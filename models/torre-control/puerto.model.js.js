/*
    Author: German Valencia
    Pattern: QPLUS DTO Pattern - Maestro de Puertos
*/
const Joi = require('joi');
const { DataTypes } = require('sequelize');

const GeoJSONSchema = Joi.object({
  type: Joi.string().valid('FeatureCollection').required(),
  features: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('Feature').required(),
      geometry: Joi.object({
        type: Joi.string().valid('Point', 'Polygon', 'LineString', 'MultiPolygon').required(),
        coordinates: Joi.array().required()
      }).required(),
      properties: Joi.object().optional().allow(null)
    })
  ).required()
});

// 1. EL ESCUDO: Validación
const PuertoSchema = Joi.object({
  id_puerto: Joi.string().max(50).required(),
  nombre: Joi.string().max(100).required(),
  region: Joi.string().max(100).required(),
  descripcion: Joi.string().allow(null, '').optional(),
  imagen_url: Joi.string().uri().allow(null, '').optional(),
  ubicacion_geo: GeoJSONSchema.allow(null),
  geocerca_geo: GeoJSONSchema.allow(null),

  url_fuente_scraping: Joi.string().max(500).allow(null, ''),
  estado: Joi.boolean().default(true)
});

// 2. EL ENSAMBLADOR: DTO
const PuertoDTO = (rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) => {
  const { error, value } = PuertoSchema.validate(rawData, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    throw {
      type: 'ValidationError',
      details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message }))
    };
  }

  // Función para extraer la geometría
  const extractGeometry = (geoJson) => {
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) return null;
    return geoJson.features[0].geometry;
  };

  return {
    id_puerto: value.id_puerto.trim().toUpperCase(),
    nombre: value.nombre.trim(),
    region: value.region.trim(),
    descripcion: value.descripcion,
    url_fuente_scraping: value.url_fuente_scraping,
    estado: value.estado,
    imagen_url: value.imagen_url,
    ubicacion_geo: extractGeometry(value.ubicacion_geo),
    geocerca_geo: extractGeometry(value.geocerca_geo),

    usuario_cargue: userContext.codigoUsuario,
    fecha_cargue: new Date().toISOString()
  };
};

// 3. EL MAPEO: Sequelize
const PuertoModel = (sequelize) => {
  return sequelize.define('T_Maestro_Puertos', {
    id_puerto: { type: DataTypes.STRING(50), primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    region: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true }, // 🟢 AGREGADO
    ubicacion_geo: { type: DataTypes.GEOMETRY('POINT'), allowNull: true },
    geocerca_geo: { type: DataTypes.GEOMETRY('POLYGON'), allowNull: true },
    estado: { type: DataTypes.BOOLEAN, allowNull: true },
    imagen_url: { type: DataTypes.STRING(100), allowNull: true },
    url_fuente_scraping: { type: DataTypes.STRING(500), allowNull: true },
    usuario_cargue: { type: DataTypes.STRING(200), allowNull: true },
    fecha_cargue: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'T_Maestro_Puertos',
    timestamps: false
  });
};

module.exports = { PuertoModel, PuertoDTO, PuertoSchema };