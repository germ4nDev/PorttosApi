/*
    Author: German Valencia
    Pattern: QPLUS DTO Pattern - Maestro de Terminales
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
const TerminalSchema = Joi.object({
  id_terminal: Joi.string().max(50).required(),
  id_puerto: Joi.string().max(50).required(),
  nombre: Joi.string().max(150).required(),
  subtitulo: Joi.string().max(200).allow('', null),
  descripcion: Joi.string().max(500).allow('', null),
  unidad_medida: Joi.string().max(50).default('TM HOY'),
  capacidad_reefer: Joi.number().integer().min(0).default(0),
  geocerca_geo: GeoJSONSchema.allow(null)
});

// 2. EL ENSAMBLADOR: DTO
const TerminalDTO = (rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) => {
  const { error, value } = TerminalSchema.validate(rawData, { abortEarly: false, stripUnknown: true });

  if (error) {
    throw {
      type: 'ValidationError',
      details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message }))
    };
  }

  // 🟢 AGREGADO: La función es necesaria aquí para extraer la geometría
  const extractGeometry = (geoJson) => {
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) return null;
    return geoJson.features[0].geometry;
  };

  return {
    id_terminal: value.id_terminal.trim().toUpperCase(),
    id_puerto: value.id_puerto.trim().toUpperCase(),
    nombre: value.nombre.trim(),
    subtitulo: value.subtitulo ? value.subtitulo.trim() : null,
    descripcion: value.descripcion ? value.descripcion.trim() : null,
    unidad_medida: value.unidad_medida.trim().toUpperCase(),
    capacidad_reefer: value.capacidad_reefer,
    geocerca_geo: extractGeometry(value.geocerca_geo),

    usuario_cargue: userContext.codigoUsuario,
    fecha_cargue: new Date().toISOString()
  };
};

// 3. EL MAPEO: Sequelize
const TerminalModel = (sequelize) => {
  return sequelize.define('T_Maestro_Terminales', {
    id_terminal: { type: DataTypes.STRING(50), primaryKey: true, allowNull: false, field: 'id_terminal' },
    id_puerto: { type: DataTypes.STRING(50), allowNull: false },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    subtitulo: { type: DataTypes.STRING(200), allowNull: true },
    descripcion: { type: DataTypes.STRING(500), allowNull: true },
    unidad_medida: { type: DataTypes.STRING(50), allowNull: true, defaultValue: 'TM HOY' },
    capacidad_reefer: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    geocerca_geo: { type: DataTypes.GEOMETRY('POLYGON'), allowNull: true },

    usuario_cargue: { type: DataTypes.STRING(200), allowNull: false },
    fecha_cargue: { type: DataTypes.DATE, allowNull: false } // Homologado a DATE igual que en puertos
  }, {
    tableName: 'T_Maestro_Terminales',
    schema: 'dbo',
    timestamps: false
  });
};

module.exports = { TerminalModel, TerminalDTO, TerminalSchema };