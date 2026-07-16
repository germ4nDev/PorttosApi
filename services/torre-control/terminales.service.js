/*
    Author: German Valencia
    Refactored for: QPLUS Standard (Clean Service Layer) - Catálogo de Widgets
*/
const { sequelize } = require('../../database/connection');
const { TerminalModel, TerminalDTO } = require('../../models/torre-control/terminal.model.js');
const { io } = require('../../index');
const { where } = require('sequelize');

class TerminalsService {
  constructor() {
    this.model = TerminalModel(sequelize);
  }

  // Permite buscar todos o filtrar (ej. solo los activos para el Lobby)
  async getTerminales() {
    try {
      // Obtenemos los datos limpios
      const resultados = await this.model.findAll({ raw: true });
      return {
        ok: true,
        data: resultados,
        statusCode: 200
      };
    } catch (error) {
      console.error("🔴 Error en TerminalsService (getTerminales):", error);
      throw error;
    }
  }

  async getTerminalesByIdPuerto(id_puerto) {
    try {
      // Obtenemos los datos limpios
      const resultados = await this.model.findAll({ raw: true }, { where: id_puerto });
      return {
        ok: true,
        data: resultados,
        statusCode: 200
      };
    } catch (error) {
      console.error("🔴 Error en TerminalsService (getTerminalesByIdPuerto):", error);
      throw error;
    }
  }

  async getTerminalById(id_terminal) {
    try {
      const registro = await this.model.findOne({ where: { id_terminal } });
      if (!registro) throw { statusCode: 404, msg: "No existe el puerto pur su Id." };
      return registro;
    } catch (error) {
      console.error("🔴 Error en TerminalsService (getTerminalById):", error);
      throw error;
    }
  }

  async crearTerminal(rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    try {
      // 1. Saneamiento y Validación (Escudo QPLUS)
      const dataDTO = TerminalDTO(rawData, userContext);

      return await sequelize.transaction(async (t) => {
        const nuevoTerminal = await this.model.create(dataDTO, { transaction: t });
        console.log('✅ Terminal creado en BD:', nuevoTerminal.toJSON());

        // 3. Reactividad
        if (typeof io !== 'undefined') {
          io.emit('terminales-actualizados', {
            action: 'create',
            msg: `Nuevo terminal registrado: ${nuevoTerminal.nombre}`
          });
        }

        return nuevoTerminal;
      });

    } catch (error) {
      console.error('🔴 Error COMPLETO en crearTerminal:', error);
      throw error;
    }
  }

  async updateTerminal(id_terminal, rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    try {
      const dataDTO = TerminalDTO(rawData, userContext);

      return await sequelize.transaction(async (t) => {
        const dbTerminal = await this.model.findOne({
          where: { id_terminal },
          transaction: t
        });

        if (!dbTerminal) {
          throw { statusCode: 404, msg: "No existe el terminal para actualizar." };
        }

        await this.model.update(dataDTO, {
          where: { id_terminal },
          transaction: t
        });

        const actualizado = await this.model.findOne({
          where: { id_terminal },
          transaction: t
        });

        if (typeof io !== 'undefined') {
          io.emit('terminales-actualizados', {
            action: 'update',
            msg: `Terminal actualizado: ${actualizado.nombre}`
          });
        }

        return actualizado;
      });

    } catch (error) {
      console.error(`🔴 Error en updateTerminal:`, error.msg || error.message);
      throw error;
    }
  }

  async deleteTerminal(id_terminal) {
    try {
      return await sequelize.transaction(async (t) => {
        const dbTerminal = await this.model.findOne({
          where: { id_terminal },
          transaction: t
        });

        if (!dbTerminal) {
          throw { statusCode: 404, msg: "No existe un terminal con ese id." };
        }

        await this.model.destroy({
          where: { id_terminal },
          transaction: t
        });

        if (typeof io !== 'undefined') {
          io.emit('puertos-actualizados', {
            action: 'delete',
            msg: `Terminal eliminado: ${dbTerminal.nombre}`
          });
        } else {
          console.warn('⚠️ Objeto IO no definido. Se eliminó en BD pero no se notificó por socket.');
        }

        return dbTerminal;
      });

    } catch (error) {
      console.error(`🔴 Error en deleteTerminal (Rollback):`, error.msg || error.message);
      throw error;
    }
  }
}

module.exports = TerminalsService;