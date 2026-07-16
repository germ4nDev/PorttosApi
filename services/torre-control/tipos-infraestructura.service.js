/*
    Author: German Valencia
    Refactored for: QPLUS Standard (Clean Service Layer) - Catálogo de Widgets
*/
const { sequelize } = require('../../database/connection');
const { TipoInfraestructuraModel, TipoInfraestructuraDTO } = require('../../models/torre-control/tipo-infraestructura.model');
const { io } = require('../../index');
const { where } = require('sequelize');

class TipoInfraestructurasService {
  constructor() {
    this.model = TipoInfraestructuraModel(sequelize);
  }

  // Permite buscar todos o filtrar (ej. solo los activos para el Lobby)
  async getTipoInfraestructuraes() {
    try {
      // Obtenemos los datos limpios
      const resultados = await this.model.findAll({ raw: true });
      return {
        ok: true,
        data: resultados,
        statusCode: 200
      };
    } catch (error) {
      console.error("🔴 Error en TipoInfraestructurasService (getTipoInfraestructuraes):", error);
      throw error;
    }
  }

  async getTipoInfraestructuraById(id_tipo) {
    try {
      const registro = await this.model.findOne({ where: { id_tipo } });
      if (!registro) throw { statusCode: 404, msg: "No existe el puerto pur su Id." };
      return registro;
    } catch (error) {
      console.error("🔴 Error en TipoInfraestructurasService (getTipoInfraestructuraById):", error);
      throw error;
    }
  }

  async crearTipoInfraestructura(rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    try {
      // 1. Saneamiento y Validación (Escudo QPLUS)
      const dataDTO = TipoInfraestructuraDTO(rawData, userContext);

      return await sequelize.transaction(async (t) => {
        const nuevoTipoInfraestructura = await this.model.create(dataDTO, { transaction: t });
        console.log('✅ TipoInfraestructura creado en BD:', nuevoTipoInfraestructura.toJSON());

        // 3. Reactividad
        if (typeof io !== 'undefined') {
          io.emit('tipos-infraestructura-actualizados', {
            action: 'create',
            msg: `Nuevo tipo infraestructura registrado: ${nuevoTipoInfraestructura.nombre}`
          });
        }

        return nuevoTipoInfraestructura;
      });

    } catch (error) {
      console.error('🔴 Error COMPLETO en crearTipoInfraestructura:', error);
      throw error;
    }
  }

  async updateTipoInfraestructura(id_tipo, rawData, userContext = { codigoUsuario: 'SISTEMA_ADMIN' }) {
    try {
      const dataDTO = TipoInfraestructuraDTO(rawData, userContext);

      return await sequelize.transaction(async (t) => {
        const dbTipoInfraestructura = await this.model.findOne({
          where: { id_tipo },
          transaction: t
        });

        if (!dbTipoInfraestructura) {
          throw { statusCode: 404, msg: "No existe el tipo para actualizar." };
        }

        await this.model.update(dataDTO, {
          where: { id_tipo },
          transaction: t
        });

        const actualizado = await this.model.findOne({
          where: { id_tipo },
          transaction: t
        });

        if (typeof io !== 'undefined') {
          io.emit('tipos-infraestructura-actualizados', {
            action: 'update',
            msg: `TipoInfraestructura actualizado: ${actualizado.nombre}`
          });
        }

        return actualizado;
      });

    } catch (error) {
      console.error(`🔴 Error en updateTipoInfraestructura:`, error.msg || error.message);
      throw error;
    }
  }

  async deleteTipoInfraestructura(id_tipo) {
    try {
      return await sequelize.transaction(async (t) => {
        const dbTipoInfraestructura = await this.model.findOne({
          where: { id_tipo },
          transaction: t
        });

        if (!dbTipoInfraestructura) {
          throw { statusCode: 404, msg: "No existe un terminal con ese id." };
        }

        await this.model.destroy({
          where: { id_tipo },
          transaction: t
        });

        if (typeof io !== 'undefined') {
          io.emit('tipos-infraestructura-actualizados', {
            action: 'delete',
            msg: `TipoInfraestructura eliminado: ${dbTipoInfraestructura.nombre}`
          });
        } else {
          console.warn('⚠️ Objeto IO no definido. Se eliminó en BD pero no se notificó por socket.');
        }

        return dbTipoInfraestructura;
      });

    } catch (error) {
      console.error(`🔴 Error en deleteTipoInfraestructura (Rollback):`, error.msg || error.message);
      throw error;
    }
  }
}

module.exports = TipoInfraestructurasService;