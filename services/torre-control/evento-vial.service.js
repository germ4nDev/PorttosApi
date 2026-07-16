// services/torre-control/evento-vial.service.js
const { EventoVialModel } = require('../../models/torre-control/evento-vial.model');
const db = require('../../models');
const EventoVial = db.EventoVial;
const sequelize = db.sequelize; // Necesitamos esto para los literales

class EventoVialService {

  async obtenerEventosActivosGeoJSON() {
    try {
      // 1. Consultar todos los eventos activos en BD
      const eventos = await EventoVial.findAll({
        where: { estadoEvento: 'ACTIVO' },
        attributes: [
          'codigoEvento', 'corredorVial', 'sector', 'tipoEvento',
          'descripcion', 'nivelSeveridad', 'fechaInicio',
          // MAGIA AQUÍ: Obligamos a SQL Server a devolvernos los números crudos
          [sequelize.literal('ubicacion_geo.STX'), 'lon'],
          [sequelize.literal('ubicacion_geo.STY'), 'lat']
        ]
      });

      // 2. Ensamblar el FeatureCollection (GeoJSON)
      const features = eventos
        .filter(evento => evento.dataValues.lon && evento.dataValues.lat) // Solo los que tengan coordenadas válidas
        .map(evento => {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              // Ensamblamos el array de coordenadas estándar que Angular espera
              coordinates: [evento.dataValues.lon, evento.dataValues.lat]
            },
            properties: {
              id: evento.codigoEvento,
              corredor: evento.corredorVial,
              sector: evento.sector,
              tipoEvento: evento.tipoEvento,
              descripcion: evento.descripcion,
              nivelSeveridad: evento.nivelSeveridad,
              fechaInicio: evento.fechaInicio
            }
          };
        });

      return {
        type: 'FeatureCollection',
        features: features
      };

    } catch (error) {
      console.error("❌ Error al obtener eventos viales:", error);
      throw error;
    }
  }
}

module.exports = new EventoVialService();