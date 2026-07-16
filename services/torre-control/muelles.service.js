/*
    Author: German Valencia
    Refactored for: QPLUS Standard (Clean Service Layer) - Catálogo de Widgets
*/
const { Sequelize } = require('sequelize');
const { sequelize } = require('../../database/connection');
const { MuelleModel, MuelleDTO } = require('../../models/torre-control/muelle.model.js');
const { io } = require('../../index');

class MuellesService {
  constructor() {
    this.model = MuelleModel(sequelize);
  }

  // Permite buscar todos o filtrar (ej. solo los activos para el Lobby)
  async getMuelles() {
    try {
      const resultados = await this.model.findAll({
        raw: true,
        attributes: {
          include: [
            [Sequelize.literal('[geocerca_geo].STAsText()'), 'geocerca_geo_wkt']
          ],
          exclude: ['geocerca_geo']
        }
      });

      const dataLimpia = resultados.map(muelle => this.procesarMuelle(muelle));

      // 🟢 CORRECCIÓN 1: Retornar statusCode y ok para que el controlador no explote
      return {
        ok: true,
        data: dataLimpia,
        statusCode: 200
      };
    } catch (error) {
      console.error("🔴 Error en MuellesService (getMuelles):", error);
      throw error;
    }
  }

  procesarMuelle(muelleRaw) {
    let geojsonPolygon = null;

    // 🟢 CORRECCIÓN 2: Usar el nombre de alias correcto (geocerca_geo_wkt)
    if (muelleRaw.geocerca_geo_wkt && muelleRaw.geocerca_geo_wkt.startsWith('POLYGON')) {
      const match = muelleRaw.geocerca_geo_wkt.match(/\(\((.+)\)\)/);
      if (match) {
        const pares = match[1].split(',');
        const coordenadas = pares.map(par => {
          const [lon, lat] = par.trim().split(/\s+/);
          return [parseFloat(lon), parseFloat(lat)];
        });

        geojsonPolygon = {
          type: 'Polygon',
          coordinates: [coordenadas]
        };
      }
    }

    return {
      id_interno: muelleRaw.id_interno,
      id_terminal: muelleRaw.id_terminal,
      codigo_muelle: muelleRaw.codigo_muelle,
      especialidad: muelleRaw.especialidad,
      calado_metros: muelleRaw.calado_metros,
      estado_mantenimiento: muelleRaw.estado_mantenimiento,
      geocerca_geo: geojsonPolygon
    };
  }

  async getMuellesByIdTerminal(id_terminal) {
    try {
      // 🟢 CORRECCIÓN 3: Sintaxis correcta de Sequelize y añadir STAsText para evitar fallos a futuro
      const resultados = await this.model.findAll({
        raw: true,
        where: { id_terminal },
        attributes: {
          include: [
            [Sequelize.literal('[geocerca_geo].STAsText()'), 'geocerca_geo_wkt']
          ],
          exclude: ['geocerca_geo']
        }
      });

      const dataLimpia = resultados.map(muelle => this.procesarMuelle(muelle));

      return {
        ok: true,
        data: dataLimpia,
        statusCode: 200
      };
    } catch (error) {
      console.error("🔴 Error en MuellesService (getMuellesByIdTerminal):", error);
      throw error;
    }
  }

  async getMuelleById(id_nuelle) {
    try {
      const registro = await this.model.findOne({
        where: { id_interno: id_nuelle }, // Ojo, verifica que sea id_interno o el PK correcto
        raw: true,
        attributes: {
          include: [[Sequelize.literal('[geocerca_geo].STAsText()'), 'geocerca_geo_wkt']],
          exclude: ['geocerca_geo']
        }
      });

      if (!registro) throw { statusCode: 404, msg: "No existe el muelle por su Id." };

      const dataLimpia = this.procesarMuelle(registro);

      return {
        ok: true,
        data: dataLimpia,
        statusCode: 200
      };
    } catch (error) {
      console.error("🔴 Error en MuellesService (getMuelleById):", error);
      throw error;
    }
  }

  async crearMuelle(rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    // ... tu lógica intacta
    try {
      const dataDTO = MuelleDTO(rawData, userContext);
      return await sequelize.transaction(async (t) => {
        const nuevoMuelle = await this.model.create(dataDTO, { transaction: t });

        if (typeof io !== 'undefined') {
          io.emit('muelles-actualizados', { action: 'create', msg: `Nuevo muelle registrado: ${nuevoMuelle.codigo_muelle}` });
        }
        return nuevoMuelle;
      });
    } catch (error) {
      console.error('🔴 Error COMPLETO en crearMuelle:', error);
      throw error;
    }
  }

  async updateMuelle(id_muelle, rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    // ... tu lógica intacta
    try {
      const dataDTO = MuelleDTO(rawData, userContext);
      return await sequelize.transaction(async (t) => {
        const dbMuelle = await this.model.findOne({ where: { id_interno: id_muelle }, transaction: t });
        if (!dbMuelle) throw { statusCode: 404, msg: "No existe el muelle para actualizar." };

        await this.model.update(dataDTO, { where: { id_interno: id_muelle }, transaction: t });
        const actualizado = await this.model.findOne({ where: { id_interno: id_muelle }, transaction: t });

        if (typeof io !== 'undefined') {
          io.emit('muelles-actualizados', { action: 'update', msg: `Muelle actualizado: ${actualizado.codigo_muelle}` });
        }
        return actualizado;
      });
    } catch (error) {
      console.error(`🔴 Error en updateMuelle:`, error.msg || error.message);
      throw error;
    }
  }

  async deleteMuelle(id_muelle) {
    // ... tu lógica intacta
    try {
      return await sequelize.transaction(async (t) => {
        const dbMuelle = await this.model.findOne({ where: { id_interno: id_muelle }, transaction: t });
        if (!dbMuelle) throw { statusCode: 404, msg: "No existe un muelle con ese id." };

        await this.model.destroy({ where: { id_interno: id_muelle }, transaction: t });

        if (typeof io !== 'undefined') {
          io.emit('muelles-actualizados', { action: 'delete', msg: `Muelle eliminado: ${dbMuelle.codigo_muelle}` });
        }
        return dbMuelle;
      });
    } catch (error) {
      console.error(`🔴 Error en deleteMuelle (Rollback):`, error.msg || error.message);
      throw error;
    }
  }
}

module.exports = MuellesService;