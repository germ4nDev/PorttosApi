// /*
//     Author: German Valencia
//     Pattern: Service Layer - Maestro de Faros
// */
// const { FaroModel } = require('../models/Faro'); // Ajusta la ruta a tu modelo
// const sequelize = require('../config/database'); // Tu instancia de Sequelize

// const Faro = FaroModel(sequelize);

// const faroService = {

//   crearFaro: async (faroData) => {
//     // Si viene geometría (WKT), aplicamos la función nativa de SQL Server
//     if (faroData.geometria_ubicacion) {
//       // 4326 es el SRID estándar para coordenadas GPS (Longitud/Latitud)
//       faroData.geometria_ubicacion = sequelize.literal(`geometry::STGeomFromText('${faroData.geometria_ubicacion}', 4326)`);
//     }

//     // El DTO ya se aseguró de limpiar y preparar el resto de los datos
//     const nuevoFaro = await Faro.create(faroData);
//     return nuevoFaro;
//   },

//   obtenerFaros: async () => {
//     // Retornamos todos los faros activos
//     return await Faro.findAll({
//       where: { estado: true },
//       // Opcional: Si necesitas que SQL Server te devuelva la geometría como texto plano para el mapa
//       // attributes: { include: [[sequelize.literal('geometria_ubicacion.STAsText()'), 'geometria_wkt']] }
//     });
//   },

//   obtenerFaroPorId: async (id_faro) => {
//     const faro = await Faro.findByPk(id_faro);
//     if (!faro) throw new Error('Faro no encontrado');
//     return faro;
//   },

//   actualizarFaro: async (id_faro, faroData) => {
//     const faroExistente = await Faro.findByPk(id_faro);
//     if (!faroExistente) throw new Error('Faro no encontrado para actualizar');

//     // 🔥 PREVENCIÓN DE BUG DE SOBRESCRITURA NULA (Partial Updates)
//     // Si la solicitud no incluye una nueva geometría, borramos la llave 
//     // del payload para que Sequelize no guarde un NULL accidentalmente.
//     if (faroData.geometria_ubicacion) {
//       faroData.geometria_ubicacion = sequelize.literal(`geometry::STGeomFromText('${faroData.geometria_ubicacion}', 4326)`);
//     } else {
//       delete faroData.geometria_ubicacion;
//     }

//     await faroExistente.update(faroData);
//     return faroExistente;
//   },

//   eliminarFaro: async (id_faro) => {
//     const faro = await Faro.findByPk(id_faro);
//     if (!faro) throw new Error('Faro no encontrado');

//     // Soft delete (recomendado)
//     await faro.update({ estado: false });
//     return { mensaje: 'Faro desactivado correctamente' };
//   }
// };

// module.exports = faroService;

/*
    Author: German Valencia
    Pattern: Service Layer - Maestro de Faros
    Description: Servicio para la gestión unificada de peajes, geocercas terrestres y zonas marítimas.
*/
// const { FaroModel } = require('../../models/torre-control/faro.model'); // Ajusta la ruta a la ubicación real de tu modelo
// const { Sequelize } = require('sequelize');
// const { sequelize } = require('../../database/connection');
// const parseWKT = require('wellknown');

// const Faro = FaroModel(sequelize);

// /**
//  * HELPER: Envuelve una geometría cruda (Polygon, Point, etc.) 
//  * en un objeto FeatureCollection estándar de GeoJSON.
//  */
// const wrapToFeatureCollection = (geometry, properties = {}) => {
//   if (!geometry) return null;
//   return {
//     type: 'FeatureCollection',
//     features: [
//       {
//         type: 'Feature',
//         geometry: geometry,
//         properties: properties
//       }
//     ]
//   };
// };

// const faroService = {

//   crearFaro: async (faroData) => {
//     // Si la solicitud incluye geometría (en formato WKT validado por el DTO)
//     if (faroData.geometria_ubicacion) {
//       faroData.geometria_ubicacion = sequelize.literal(
//         `geometry::STGeomFromText('${faroData.geometria_ubicacion}', 4326)`
//       );
//     }

//     const nuevoFaro = await Faro.create(faroData);
//     return nuevoFaro;
//   },

//   obtenerFaros: async () => {
//     // Consultamos todos los faros activos extrayendo la geometría como texto legible (WKT)
//     const faros = await Faro.findAll({
//       where: { estado: true },
//       attributes: {
//         include: [[sequelize.literal('geocerca_geo.STAsText()'), 'geocerca_geo_wkt']]
//       }
//     });

//     // Transformamos los resultados para entregar un FeatureCollection compatible con el frontend
//     return faros.map(faro => {
//       const faroJSON = faro.toJSON();

//       if (faroJSON.geocerca_geo_wkt) {
//         // 1. Traducimos el WKT a una geometría GeoJSON pura usando 'wellknown'
//         const rawGeometry = parseWKT(faroJSON.geocerca_geo_wkt);

//         // 2. Envolvemos la geometría y le pasamos los datos del faro a 'properties' 
//         // para que la capa del mapa (Mapbox/MapLibre) los tenga disponibles
//         faroJSON.geocerca_geo = wrapToFeatureCollection(rawGeometry, {
//           id_faro: faroJSON.id_faro,
//           nombre_faro: faroJSON.nombre_faro,
//           color_ui: faroJSON.color_ui,
//           tipo_faro: faroJSON.tipo_faro,
//           descripcion: faroJSON.descripcion
//         });
//       } else {
//         faroJSON.geocerca_geo = null;
//       }

//       // Limpiamos el texto WKT para no ensuciar el payload enviado a Angular
//       delete faroJSON.geocerca_geo_wkt;

//       return faroJSON;
//     });
//   },

//   obtenerFaroPorId: async (id_faro) => {
//     const faro = await Faro.findByPk(id_faro, {
//       attributes: {
//         include: [[sequelize.literal('geometria_ubicacion.STAsText()'), 'geometria_wkt']]
//       }
//     });

//     if (!faro) throw new Error('Faro no encontrado');

//     const faroJSON = faro.toJSON();

//       if (faroJSON.geocerca_geo_wkt) {
//         // 1. Traducimos el WKT a una geometría GeoJSON pura usando 'wellknown'
//         const rawGeometry = parseWKT(faroJSON.geocerca_geo_wkt);

//         // 2. Envolvemos la geometría y le pasamos los datos del faro a 'properties' 
//         // para que la capa del mapa (Mapbox/MapLibre) los tenga disponibles
//         faroJSON.geocerca_geo = wrapToFeatureCollection(rawGeometry, {
//           id_faro: faroJSON.id_faro,
//           nombre_faro: faroJSON.nombre_faro,
//           color_ui: faroJSON.color_ui,
//           tipo_faro: faroJSON.tipo_faro,
//           descripcion: faroJSON.descripcion
//         });
//       } else {
//         faroJSON.geocerca_geo = null;
//       }

//     delete faroJSON.geocerca_geo_wkt;

//     return faroJSON;
//   },

//   actualizarFaro: async (id_faro, faroData) => {
//     const faroExistente = await Faro.findByPk(id_faro);
//     if (!faroExistente) throw new Error('Faro no encontrado para actualizar');

//     // PREVENCIÓN DE BUG (Sobrescritura Nula): 
//     // Si el payload trae geometría, la preparamos para SQL Server.
//     // Si NO la trae, la eliminamos del objeto para que Sequelize mantenga el dato actual en BD.
//     if (faroData.geocerca_geo) {
//       faroData.geocerca_geo = sequelize.literal(
//         `geometry::STGeomFromText('${faroData.geocerca_geo}', 4326)`
//       );
//     } else {
//       delete faroData.geocerca_geo;
//     }

//     await faroExistente.update(faroData);

//     return faroExistente;
//   },

//   eliminarFaro: async (id_faro) => {
//     const faro = await Faro.findByPk(id_faro);
//     if (!faro) throw new Error('Faro no encontrado');

//     // Eliminación lógica
//     await faro.update({ estado: false });

//     return { mensaje: 'Faro desactivado correctamente', id_faro: faro.id_faro };
//   }
// };

// module.exports = faroService;



/*
    Author: German Valencia
    Pattern: Service Layer - Maestro de Faros
    Description: Servicio para la gestión unificada de peajes, geocercas terrestres y zonas marítimas.
    Update: Estandarización de columna geocerca_geo y métodos en inglés para el Controller.
*/
const { FaroModel } = require('../../models/torre-control/faro.model'); // Ajusta tu ruta
const { Sequelize } = require('sequelize');
const { sequelize } = require('../../database/connection'); // Ajusta tu ruta
const parseWKT = require('wellknown');

const Faro = FaroModel(sequelize);

/**
 * HELPER: Envuelve una geometría cruda (Polygon, Point, etc.) 
 * en un objeto FeatureCollection estándar de GeoJSON.
 */
const wrapToFeatureCollection = (geometry, properties = {}) => {
  if (!geometry) return null;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: geometry,
        properties: properties
      }
    ]
  };
};

const faroService = {

  crearFaro: async (faroData, userContext) => {
    // 🟢 CORRECCIÓN: Usamos geocerca_geo consistentemente
    if (faroData.geocerca_geo) {
      faroData.geocerca_geo = sequelize.literal(
        `geometry::STGeomFromText('${faroData.geocerca_geo}', 4326)`
      );
    }

    const nuevoFaro = await Faro.create(faroData);
    return nuevoFaro;
  },

  // 🟢 Renombrado a getFaros para coincidir con el controlador
  obtenerFaros: async () => {
    const faros = await Faro.findAll({
      where: { estado: true },
      attributes: {
        include: [[sequelize.literal('geocerca_geo.STAsText()'), 'geocerca_geo_wkt']]
      }
    });

    const farosData = faros.map(faro => {
      const faroJSON = faro.toJSON();

      if (faroJSON.geocerca_geo_wkt) {
        const rawGeometry = parseWKT(faroJSON.geocerca_geo_wkt);
        faroJSON.geocerca_geo = wrapToFeatureCollection(rawGeometry, {
          id_faro: faroJSON.id_faro,
          nombre_faro: faroJSON.nombre_faro,
          color_ui: faroJSON.color_ui,
          tipo_faro: faroJSON.tipo_faro,
          descripcion: faroJSON.descripcion,
          genera_alerta_toast: faroJSON.genera_alerta_toast
        });
      } else {
        faroJSON.geocerca_geo = null;
      }

      delete faroJSON.geocerca_geo_wkt;
      return faroJSON;
    });

    // 🟢 El controlador espera que retornes un objeto con statusCode, ok, y data
    return { statusCode: 200, ok: true, data: farosData };
  },

  // 🟢 Renombrado a getFaroById
  obtenerFaroPorId: async (id_faro) => {
    const faro = await Faro.findByPk(id_faro, {
      attributes: {
        // 🟢 CORRECCIÓN: Usamos geocerca_geo y su alias geocerca_geo_wkt
        include: [[sequelize.literal('geocerca_geo.STAsText()'), 'geocerca_geo_wkt']]
      }
    });

    if (!faro) {
      return { statusCode: 404, ok: false, data: null };
    }

    const faroJSON = faro.toJSON();

    if (faroJSON.geocerca_geo_wkt) {
      const rawGeometry = parseWKT(faroJSON.geocerca_geo_wkt);
      faroJSON.geocerca_geo = wrapToFeatureCollection(rawGeometry, {
        id_faro: faroJSON.id_faro,
        nombre_faro: faroJSON.nombre_faro,
        color_ui: faroJSON.color_ui,
        tipo_faro: faroJSON.tipo_faro,
        descripcion: faroJSON.descripcion,
        genera_alerta_toast: faroJSON.genera_alerta_toast
      });
    } else {
      faroJSON.geocerca_geo = null;
    }

    delete faroJSON.geocerca_geo_wkt;

    return { statusCode: 200, ok: true, data: faroJSON };
  },

  // 🟢 Renombrado a updateFaro
  actualizarFaro: async (id_faro, faroData, userContext) => {
    const faroExistente = await Faro.findByPk(id_faro);

    if (!faroExistente) {
      throw { statusCode: 404, msg: 'Faro no encontrado para actualizar' };
    }

    if (faroData.geocerca_geo) {
      faroData.geocerca_geo = sequelize.literal(
        `geometry::STGeomFromText('${faroData.geocerca_geo}', 4326)`
      );
    } else {
      delete faroData.geocerca_geo;
    }

    await faroExistente.update(faroData);
    return faroExistente;
  },

  // 🟢 Renombrado a deleteFaro
  eliminarFaro: async (id_faro) => {
    const faro = await Faro.findByPk(id_faro);

    if (!faro) {
      throw { statusCode: 404, msg: 'Faro no encontrado' };
    }

    await faro.update({ estado: false });
    return { mensaje: 'Faro desactivado correctamente', id_faro: faro.id_faro };
  }
};

module.exports = faroService;

