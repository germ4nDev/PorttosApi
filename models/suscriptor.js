/*
    Author: German Valencia
    Refactored for: QPLUS DTO Pattern, Entity Standardization & Joi Validation
*/
const Joi = require('joi');
const { DataTypes } = require("sequelize");

const SuscriptorSchema = Joi.object({
  codigoSuscriptor: Joi.string().max(200).required()
    .messages({ 'any.required': 'El código único del suscriptor es obligatorio.' }),

  identificacionSuscriptor: Joi.string().max(100).required()
    .messages({ 'any.required': 'La identificación (NIT/CC) del suscriptor es obligatoria.' }),

  nombreSuscriptor: Joi.string().max(100).required()
    .messages({ 'any.required': 'El nombre o razón social del suscriptor es obligatorio.' }),

  correoSuscriptor: Joi.string().email().max(100).required()
    .messages({
      'any.required': 'El correo de contacto es obligatorio.',
      'string.email': 'Debe proporcionar un correo electrónico válido.'
    }),

  direccionSuscriptor: Joi.string().max(200).allow('', null).optional().default(''),

  telefonoContacto: Joi.string().max(100).allow('', null).optional().default(''),

  numeroEmpresas: Joi.number().integer().min(1).optional().default(1),
  numeroUsuarios: Joi.number().integer().min(1).optional().default(1),

  codigoAdministrador: Joi.string().max(200).required()
    .messages({ 'any.required': 'El código del administrador principal es obligatorio.' }),

  usuarioAdministrador: Joi.string().max(100).allow('', null).optional().default(''),

  logoSuscriptor: Joi.string().max(100).allow('', null).optional().default('no-imagen.png'),

  descripcionSuscriptor: Joi.string().max(4000).allow('', null).optional().default(''),

  envioCorreosSuscriptor: Joi.boolean().optional().default(true),
  envioMensajesSuscriptor: Joi.boolean().optional().default(false),
  envioPublicidadSuscriptor: Joi.boolean().optional().default(false),

  estadoSuscriptor: Joi.boolean().optional().default(true),

  codigoUsuarioCreacion: Joi.string().max(200).required(),
  fechaCreacion: Joi.string().max(100).required(),
  codigoUsuarioModificacion: Joi.string().max(200).allow('', null).optional(),
  fechaModificacion: Joi.string().max(100).allow('', null).optional()
});

const SuscriptorDTO = (rawData) => {
  const { error, value } = SuscriptorSchema.validate(rawData, { abortEarly: false });

  if (error) {
    throw {
      type: 'ValidationError',
      details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message }))
    };
  }

  const fechaActual = new Date().toISOString();

  return {
    codigoSuscriptor: value.codigoSuscriptor.trim(),
    identificacionSuscriptor: value.identificacionSuscriptor.trim(),
    nombreSuscriptor: value.nombreSuscriptor.trim(),
    correoSuscriptor: value.correoSuscriptor.trim().toLowerCase(), // Estandarizamos el correo
    direccionSuscriptor: value.direccionSuscriptor.trim(),
    telefonoContacto: value.telefonoContacto.trim(),
    numeroEmpresas: value.numeroEmpresas,
    numeroUsuarios: value.numeroUsuarios,
    codigoAdministrador: value.codigoAdministrador.trim(),
    usuarioAdministrador: value.usuarioAdministrador.trim(),
    logoSuscriptor: value.logoSuscriptor.trim(),
    descripcionSuscriptor: value.descripcionSuscriptor.trim(),
    envioCorreosSuscriptor: value.envioCorreosSuscriptor,
    envioMensajesSuscriptor: value.envioMensajesSuscriptor,
    envioPublicidadSuscriptor: value.envioPublicidadSuscriptor,
    estadoSuscriptor: value.estadoSuscriptor,

    codigoUsuarioCreacion: value.codigoUsuarioCreacion,
    fechaCreacion: value.fechaCreacion || fechaActual,
    codigoUsuarioModificacion: value.codigoUsuarioModificacion || value.codigoUsuarioCreacion,
    fechaModificacion: value.fechaModificacion || fechaActual
  };
};

const SuscriptorModel = (sequelize) => {
  return sequelize.define("PTLSuscriptores", {
    suscriptorId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false
    },
    codigoSuscriptor: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    identificacionSuscriptor: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nombreSuscriptor: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    correoSuscriptor: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    direccionSuscriptor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    telefonoContacto: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    numeroEmpresas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    numeroUsuarios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    codigoAdministrador: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    usuarioAdministrador: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    logoSuscriptor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    descripcionSuscriptor: {
      type: DataTypes.STRING(4000),
      allowNull: true,
    },
    envioCorreosSuscriptor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    envioMensajesSuscriptor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    envioPublicidadSuscriptor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    estadoSuscriptor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: "PTLSuscriptores",
    timestamps: false,
  });
};

module.exports = {
  SuscriptorModel,
  SuscriptorDTO,
  SuscriptorSchema
};