/*
    Author: German Valencia
    Refactored for: QPLUS DTO Pattern, Primary Key Standardization & Joi Validation
*/
const Joi = require('joi');
const { DataTypes } = require('sequelize');

const PaqueteSCSchema = Joi.object({
  codigoSuscriptorPaquete: Joi.string().max(200).required()
    .messages({ 'any.required': 'El código único de la relación Suscriptor-Paquete es obligatorio.' }),

  codigoSuscriptor: Joi.string().max(200).required()
    .messages({ 'any.required': 'El código del suscriptor es obligatorio.' }),

  codigoPaquete: Joi.string().max(200).required()
    .messages({ 'any.required': 'El código del paquete es obligatorio.' }),

  estadoSuscriptorPaquete: Joi.boolean().optional().default(true),

  codigoUsuarioCreacion: Joi.string().max(200).required(),
  fechaCreacion: Joi.string().max(100).required(),
  codigoUsuarioModificacion: Joi.string().max(200).allow('', null).optional(),
  fechaModificacion: Joi.string().max(100).allow('', null).optional()
});

const PaqueteSCDTO = (rawData) => {
  const { error, value } = PaqueteSCSchema.validate(rawData, { abortEarly: false });

  if (error) {
    throw {
      type: 'ValidationError',
      details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message }))
    };
  }

  const fechaActual = new Date().toISOString();

  return {
    codigoSuscriptorPaquete: value.codigoSuscriptorPaquete.trim(),
    codigoSuscriptor: value.codigoSuscriptor.trim(),
    codigoPaquete: value.codigoPaquete.trim(),
    estadoSuscriptorPaquete: value.estadoSuscriptorPaquete,

    codigoUsuarioCreacion: value.codigoUsuarioCreacion,
    fechaCreacion: value.fechaCreacion || fechaActual,
    codigoUsuarioModificacion: value.codigoUsuarioModificacion || value.codigoUsuarioCreacion,
    fechaModificacion: value.fechaModificacion || fechaActual
  };
};

const PaqueteSCModel = (sequelize) => {
  return sequelize.define('PTLPaquetesSC', {
    paqueteSCId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false
    },
    codigoSuscriptorPaquete: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    codigoSuscriptor: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    codigoPaquete: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    estadoSuscriptorPaquete: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    codigoUsuarioCreacion: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    fechaCreacion: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    codigoUsuarioModificacion: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    fechaModificacion: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'PTLPaquetesSC',
    timestamps: false
  });
};

module.exports = {
  PaqueteSCModel,
  PaqueteSCDTO,
  PaqueteSCSchema
};