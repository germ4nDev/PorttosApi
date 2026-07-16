const { Sequelize } = require('sequelize');
const { sequelize } = require('../../database/connection');
const { PuertoModel, PuertoDTO } = require('../../models/torre-control/puerto.model.js');
const { wrapToFeatureCollection } = require('../../utils/geoJsonHelper.js');
const { io } = require('../../index');

class PuertosService {
  constructor() {
    this.model = PuertoModel(sequelize);
  }

  // 1. Parsers para convertir WKT a GeoJSON Geometry puro
  _parseWktPoint(wkt) {
    if (!wkt) return null;
    const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
    if (!match) return null;

    // CORREGIDO: Ahora retorna el estándar GeoJSON Geometry
    return {
      type: 'Point',
      coordinates: [parseFloat(match[1]), parseFloat(match[2])] // [lon, lat]
    };
  }

  _parseWktPolygon(wkt) {
    if (!wkt) return null;
    const match = wkt.match(/POLYGON\s*\(\((.+)\)\)/);
    if (!match) return null;

    const coordsStr = match[1]; // "-74.95 10.95, -74.7 10.95..."
    const coordinates = coordsStr.split(',').map(pair => {
      return pair.trim().split(' ').map(Number);
    });

    return { type: 'Polygon', coordinates: [coordinates] };
  }

  // 2. Mapeo para Angular (El viaje de Vuelta)
  _mapearRegistro(puertoInstancia) {
    const p = puertoInstancia.get({ plain: true });

    // Extraemos la geometría pura
    const pointGeometry = this._parseWktPoint(p.ubicacion_text);
    const polygonGeometry = this._parseWktPolygon(p.geocerca_text);

    return {
      ...p,
      // CORREGIDO: Mantenemos la nomenclatura "_geo" y envolvemos para Mapbox
      ubicacion_geo: wrapToFeatureCollection(pointGeometry),
      geocerca_geo: wrapToFeatureCollection(polygonGeometry),

      // Limpiamos los campos de texto extraídos de SQL y los posibles buffers
      ubicacion_text: undefined,
      geocerca_text: undefined
    };
  }

  // 3. CRUD de Lectura
  async getPuertos() {
    try {
      const registros = await this.model.findAll({
        attributes: {
          include: [
            [Sequelize.literal('ubicacion_geo.STAsText()'), 'ubicacion_text'],
            [Sequelize.literal('geocerca_geo.STAsText()'), 'geocerca_text']
          ]
        }
      });

      return {
        ok: true,
        data: registros.map(p => this._mapearRegistro(p)),
        statusCode: 200
      };
    } catch (error) {
      console.error("Error en getPuertos:", error);
      throw error;
    }
  }

  async getPuertoById(id) {
    try {
      const puerto = await this.model.findOne({
        where: { id_puerto: id },
        attributes: {
          include: [
            [Sequelize.literal('ubicacion_geo.STAsText()'), 'ubicacion_text'],
            [Sequelize.literal('geocerca_geo.STAsText()'), 'geocerca_text']
          ]
        }
      });

      if (!puerto) return { ok: false, statusCode: 404 };

      return {
        ok: true,
        data: this._mapearRegistro(puerto),
        statusCode: 200
      };
    } catch (error) {
      console.error("Error en getPuertoById:", error);
      throw error;
    }
  }

  // 4. CRUD de Escritura (Usa el patrón DTO QPLUS)
  async crearPuerto(rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    try {
      const dataDTO = PuertoDTO(rawData, userContext);
      return await sequelize.transaction(async (t) => {
        const nuevo = await this.model.create(dataDTO, { transaction: t });
        if (typeof io !== 'undefined') io.emit('puertos-actualizados', { action: 'create' });
        return nuevo;
      });
    } catch (error) { throw error; }
  }

  async updatePuerto(id_puerto, rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    try {
      const dataDTO = PuertoDTO(rawData, userContext);
      return await sequelize.transaction(async (t) => {
        await this.model.update(dataDTO, { where: { id_puerto }, transaction: t });
        const actualizado = await this.model.findOne({ where: { id_puerto }, transaction: t });
        if (typeof io !== 'undefined') io.emit('puertos-actualizados', { action: 'update' });
        return actualizado;
      });
    } catch (error) { throw error; }
  }

  async deletePuerto(id_puerto) {
    try {
      return await sequelize.transaction(async (t) => {
        await this.model.destroy({ where: { id_puerto }, transaction: t });
        if (typeof io !== 'undefined') io.emit('puertos-actualizados', { action: 'delete' });
        return { success: true };
      });
    } catch (error) { throw error; }
  }
}

module.exports = PuertosService;