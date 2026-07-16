/*
    Author: German Valencia
    Refactored for: QPLUS Architecture, Security & Authentication Integrity
*/
const bcrypt = require("bcryptjs");
const { sequelize } = require('../database/connection');
const { generarJWT } = require("../helpers/jwt");
const { UsuarioModel } = require('../models/usuario');
const { io } = require('../index');

class AuthService {
  constructor() {
    this.model = UsuarioModel(sequelize);
  }

  async login(username, password) {
    const usuarioDB = await this.model.findOne({
      where: { userNameUsuario: username }
    });
console.log('usuarioDB', usuarioDB);

    if (!usuarioDB) throw { statusCode: 404, msg: "Usuario no encontrado." };
    if (!usuarioDB.estadoUsuario) throw { statusCode: 403, msg: "El usuario se encuentra inactivo." };

    const isMatch = await bcrypt.compare(password, usuarioDB.claveUsuario);
    if (!isMatch) throw { statusCode: 401, msg: "Credenciales no válidas." };

    // Generación de token
    const token = await generarJWT(
      usuarioDB.codigoUsuario,
      usuarioDB.userNameUsuario,
      usuarioDB.correoUsuario,
      usuarioDB.fotoUsuario
    );

    // Notificación en tiempo real (Socket.io)
    io.emit('autenticaciones-actualizadas', {
      action: 'login',
      msg: `Sesión iniciada: ${usuarioDB.userNameUsuario}`
    });

    // Respuesta limpia (sin clave)
    return {
      usuario: {
        codigoUsuario: usuarioDB.codigoUsuario,
        nombreUsuario: usuarioDB.nombreUsuario,
        userNameUsuario: usuarioDB.userNameUsuario,
        correoUsuario: usuarioDB.correoUsuario,
        usuarioAdministrador: usuarioDB.usuarioAdministrador,
        fotoUsuario: usuarioDB.fotoUsuario
      },
      token
    };
  }

  async verificarClave(username, password) {
    const usuarioDB = await this.model.findOne({
      where: { userNameUsuario: username }
    });

    if (!usuarioDB) throw { statusCode: 404, msg: "Usuario no encontrado." };

    const isMatch = await bcrypt.compare(password, usuarioDB.claveUsuario);
    if (!isMatch) throw { statusCode: 401, msg: "Contraseña incorrecta." };

    return usuarioDB;
  }

  async renovarToken(uid) {
    const usuarioDB = await this.model.findOne({
      where: { codigoUsuario: uid }
    });

    if (!usuarioDB) throw { statusCode: 404, msg: "Usuario no existe." };

    const token = await generarJWT(
      usuarioDB.codigoUsuario,
      usuarioDB.userNameUsuario,
      usuarioDB.fotoUsuario,
      usuarioDB.correoUsuario
    );

    // Retorno de usuario sin clave sensible
    return {
      usuario: {
        codigoUsuario: usuarioDB.codigoUsuario,
        nombreUsuario: usuarioDB.nombreUsuario,
        userNameUsuario: usuarioDB.userNameUsuario,
        correoUsuario: usuarioDB.correoUsuario,
        fotoUsuario: usuarioDB.fotoUsuario
      },
      token
    };
  }

  /**
   * Valida permisos basados en el RBAC del sistema
   */
  verificarRol(roles, roleToCheck) {
    if (!roles || !Array.isArray(roles)) return false;
    return roles.some((rol) => rol.nombre === roleToCheck);
  }
}

module.exports = AuthService;