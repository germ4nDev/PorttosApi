/*
    Author: German Valencia
    Pattern: QPLUS DTO Pattern - Maestro de Infraestructura
    Update: Homologado con GeoJSON FeatureCollection y Arquitectura Espacial
*/
const Joi = require('joi');
const { DataTypes, Sequelize } = require('sequelize');

// 0. ESQUEMA REUTILIZABLE PARA GEOJSON (Homologado)
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

// 1. EL ESCUDO: Validación de infraestructura
const InfraestructuraSchema = Joi.object({
  id_terminal: Joi.string().max(50).required(),
  tipo: Joi.string().max(50).required(),
  nombre: Joi.string().max(250).required(),
  latitud: Joi.number().precision(8).required(),
  longitud: Joi.number().precision(8).required(),
  geocerca_geo: GeoJSONSchema.allow(null)
});

// 2. EL ENSAMBLADOR: DTO con auditoría QPLUS
const InfraestructuraDTO = (rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) => {
  const { error, value } = InfraestructuraSchema.validate(rawData, { abortEarly: false, stripUnknown: true });
  if (error) throw { type: 'ValidationError', details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message })) };

  const extractGeometry = (geoJson) => {
    if (!geoJson || !geoJson.features || geoJson.features.length === 0) return null;
    return geoJson.features[0].geometry;
  };

  return {
    id_terminal: value.id_terminal.trim().toUpperCase(),
    tipo: value.tipo.toLowerCase().trim(),
    nombre: value.nombre.trim(),
    ubicacion_geo: extractGeometry(value.ubicacion_geo),
    geocerca_geo: extractGeometry(value.geocerca_geo),

    usuario_cargue: userContext.codigoUsuario,
    fecha_cargue: new Date().toISOString()
  };
};

// 3. EL MAPEO: Definición en Sequelize
const InfraestructuraModel = (sequelize) => {
  const Infra = sequelize.define('T_Maestro_Infraestructura', {
    id_infraestructura: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_terminal: { type: DataTypes.STRING(50), allowNull: false },
    tipo: { type: DataTypes.STRING(50), allowNull: true },
    nombre: { type: DataTypes.STRING(250), allowNull: true },
    ubicacion_geo: { type: DataTypes.GEOMETRY('POINT'), allowNull: true },
    geocerca_geo: { type: DataTypes.GEOMETRY('POLYGON'), allowNull: true },
    fecha_cargue: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('GETDATE()')
    }
  }, {
    tableName: 'T_Maestro_Infraestructura',
    schema: 'dbo',
    timestamps: false
  });

  /**
   * Sobrescritura de toJSON: 
   * Limpia el buffer binario y formatea la salida para Angular.
   */
  Infra.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());

    if (values.geocerca_geo) {
      delete values.geocerca_geo;
    }

    return values;
  };

  return Infra;
};

module.exports = { InfraestructuraModel, InfraestructuraDTO, InfraestructuraSchema };