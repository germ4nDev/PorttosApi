/*
    Author: German Valencia
    Pattern: QPLUS DTO Pattern - Maestro de Faros
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

const FaroSchema = Joi.object({
  id_faro: Joi.number().integer().optional(), // Opcional para creación, DB hace auto-increment
  nombre_faro: Joi.string().max(100).required(),
  descripcion: Joi.string().max(500).allow('', null),

  tipo_faro: Joi.string().valid(
    'PEAJE',
    'ZONA_TERRESTRE',
    'ZONA_MARITIMA',
    'PUNTO_CONTROL'
  ).required(),

  radio_metros: Joi.number().allow(null),
  color_ui: Joi.string().max(20).allow('', null),
  metadata_extra: Joi.object().allow(null), // Validamos que entre como objeto JSON
  geocerca_geo: GeoJSONSchema.allow(null),
  genera_alerta_toast: Joi.boolean().default(false),
  estado: Joi.boolean().default(true)
});

const FaroDTO = (rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) => {
  const { error, value } = FaroSchema.validate(rawData, { abortEarly: false, stripUnknown: true });

  if (error) {
    throw {
      type: 'ValidationError',
      details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message }))
    };
  }

  const extractGeometryAsWKT = (geoJson) => {
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) return null;

    const geometry = geoJson.features[0].geometry;

    if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates.map(ring => {
        const coordPairs = ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
        return `(${coordPairs})`;
      });
      return `POLYGON(${rings.join(', ')})`;
    }

    if (geometry.type === 'Point') {
      return `POINT(${geometry.coordinates[0]} ${geometry.coordinates[1]})`;
    }

    return null;
  };

  return {
    ...(value.id_faro && { id_faro: value.id_faro }),
    nombre_faro: value.nombre_faro.trim().toUpperCase(),
    descripcion: value.descripcion ? value.descripcion.trim() : null,
    tipo_faro: value.tipo_faro.trim().toUpperCase(),
    radio_metros: value.radio_metros,
    color_ui: value.color_ui ? value.color_ui.trim() : null,
    metadata_extra: value.metadata_extra ? JSON.stringify(value.metadata_extra) : null,
    geocerca_geo: extractGeometryAsWKT(value.geometria_ubicacion),
    genera_alerta_toast: value.genera_alerta_toast,
    estado: value.estado,
    usuario_cargue: userContext.codigoUsuario,
    fecha_cargue: new Date().toISOString()
  };
};

const FaroModel = (sequelize) => {
  return sequelize.define('T_Maestro_Faros', {
    id_faro: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: 'id_faro'
    },
    nombre_faro: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(500), allowNull: true },
    tipo_faro: { type: DataTypes.STRING(50), allowNull: false },
    radio_metros: { type: DataTypes.FLOAT, allowNull: true },
    color_ui: { type: DataTypes.STRING(20), allowNull: true },
    metadata_extra: { type: DataTypes.STRING('MAX'), allowNull: true },
    geocerca_geo: { type: DataTypes.GEOMETRY, allowNull: true },
    genera_alerta_toast: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    estado: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    usuario_cargue: { type: DataTypes.STRING(200), allowNull: false },
    fecha_cargue: { type: DataTypes.STRING(100), allowNull: false }
  }, {
    tableName: 'T_Maestro_Faros',
    schema: 'dbo',
    timestamps: false
  });
};

module.exports = { FaroModel, FaroDTO, FaroSchema };