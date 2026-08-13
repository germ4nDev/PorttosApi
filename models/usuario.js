/*
    Author: German Valencia
    Refactored for: PORTTOS DTO Pattern, Identity Standardization, Security & Joi Validation
*/
const Joi = require('joi');
const { DataTypes } = require('sequelize');

const UsuarioSchema = Joi.object({
  codigoUsuario: Joi.string().max(200).required(),

  identificacionUsuario: Joi.string().max(100).required(),

  nombreUsuario: Joi.string().max(100).required(),

  correoUsuario: Joi.string().email().max(150).required(),

  userNameUsuario: Joi.string().max(100).allow(null, '').optional(),

  claveUsuario: Joi.string().min(100).required(),

  descripcionUsuario: Joi.string().max(4000).allow('').optional().default(''),

  fotoUsuario: Joi.string().max(100).allow('', null).optional().default('default-user.png'),

  usuarioAdministrador: Joi.boolean().optional().default(false),

  estadoUsuario: Joi.boolean().optional().default(true),

  codigoUsuarioCreacion: Joi.string().max(200).required(),
  fechaCreacion: Joi.string().max(100).required(),
  codigoUsuarioModificacion: Joi.string().max(200).allow('', null).optional(),
  fechaModificacion: Joi.string().max(100).allow('', null).optional()
});

const UsuarioDTO = (rawData) => {
  const { error, value } = UsuarioSchema.validate(rawData, { abortEarly: false });

  if (error) {
    throw {
      type: 'ValidationError',
      details: error.details.map(d => ({ campo: d.context.key, mensaje: d.message }))
    };
  }

  const fechaActual = new Date().toISOString();

  return {
    codigoUsuario: value.codigoUsuario.trim(),
    identificacionUsuario: value.identificacionUsuario.trim(),
    nombreUsuario: value.nombreUsuario.trim().toUpperCase(),
    correoUsuario: value.correoUsuario.trim().toLowerCase(),
    userNameUsuario: (value.userNameUsuario || value.correoUsuario.split('@')[0]).toLowerCase(),
    claveUsuario: value.claveUsuario,
    descripcionUsuario: value.descripcionUsuario.trim(),
    fotoUsuario: value.fotoUsuario.trim(),
    usuarioAdministrador: value.usuarioAdministrador,
    estadoUsuario: value.estadoUsuario,

    codigoUsuarioCreacion: value.codigoUsuarioCreacion,
    fechaCreacion: value.fechaCreacion || fechaActual,
    codigoUsuarioModificacion: value.codigoUsuarioModificacion || value.codigoUsuarioCreacion,
    fechaModificacion: value.fechaModificacion || fechaActual
  };
};

const UsuarioModel = (sequelize) => {
  return sequelize.define('PTLUsuarios', {
    usuarioId: { type: DataTypes.INTEGER, autoIncrement: true },
    codigoUsuario: { type: DataTypes.STRING(200), primaryKey: true, allowNull: false },
    identificacionUsuario: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    nombreUsuario: { type: DataTypes.STRING(100), allowNull: false },
    correoUsuario: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    userNameUsuario: { type: DataTypes.STRING(100), unique: true },
    claveUsuario: { type: DataTypes.STRING(100), allowNull: false },
    descripcionUsuario: { type: DataTypes.STRING(4000), allowNull: false, defaultValue: '' },
    fotoUsuario: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'default-user.png' },
    usuarioAdministrador: { type: DataTypes.BOOLEAN, defaultValue: false },
    estadoUsuario: { type: DataTypes.BOOLEAN, defaultValue: true },
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
    tableName: 'PTLUsuarios',
    timestamps: false
  });
};

module.exports = {
  UsuarioModel,
  UsuarioDTO,
  UsuarioSchema
};