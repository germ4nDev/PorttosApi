/*
    Author: German Valencia
    Refactored for: PORTTOS Architecture, Service Layer Sanitization & Transactional Integrity
*/
const { sequelize } = require('../database/connection');
const { PaqueteSCModel, PaqueteSCDTO } = require('../models/paquete-sc');
const { io } = require('../index');

class PaqueteSCService {
  constructor() {
    this.model = PaqueteSCModel(sequelize);
  }

  async getPaquetesSC() {
    return await this.model.findAll();
  }

  async getPaqueteSCById(suscriptorPaqueteId) {
    const registro = await this.model.findOne({ where: { suscriptorPaqueteId } });
    if (!registro) throw { statusCode: 404, msg: "No existe el paquete de suscriptor solicitado." };
    return registro;
  }

  /**
   * Crea una nueva asignación de paquete
   */
  async createPaqueteSC(rawData) {
    const dataDTO = PaqueteSCDTO(rawData);

    return await sequelize.transaction(async (t) => {
      const nuevoPaquete = await this.model.create(dataDTO, { transaction: t });

      io.emit('paquetes-sc-actualizados', {
        action: 'create',
        msg: `Paquete SC creado: ${nuevoPaquete.suscriptorPaqueteId}`
      });

      return nuevoPaquete;
    });
  }

  /**
   * Actualiza una asignación de paquete existente
   */
  async updatePaqueteSC(suscriptorPaqueteId, rawData) {
    // El controlador inyecta codigoUsuario en rawData antes de invocar el servicio
    const dataDTO = PaqueteSCDTO(rawData);

    return await sequelize.transaction(async (t) => {
      const registroDB = await this.model.findOne({
        where: { suscriptorPaqueteId },
        transaction: t
      });

      if (!registroDB) throw { statusCode: 404, msg: 'No existe el paquete SC para actualizar.' };

      await this.model.update(dataDTO, {
        where: { suscriptorPaqueteId },
        transaction: t
      });

      const actualizado = await this.model.findOne({
        where: { suscriptorPaqueteId },
        transaction: t
      });

      io.emit('paquetes-sc-actualizados', {
        action: 'update',
        msg: `Paquete SC actualizado: ${actualizado.suscriptorPaqueteId}`
      });

      return actualizado;
    });
  }

  async deletePaqueteSC(suscriptorPaqueteId) {
    return await sequelize.transaction(async (t) => {
      const registroDB = await this.model.findOne({
        where: { suscriptorPaqueteId },
        transaction: t
      });

      if (!registroDB) throw { statusCode: 404, msg: 'No existe el paquete SC para eliminar.' };

      const idEliminado = registroDB.suscriptorPaqueteId;

      await this.model.destroy({
        where: { suscriptorPaqueteId },
        transaction: t
      });

      io.emit('paquetes-sc-actualizados', {
        action: 'delete',
        msg: `Paquete SC eliminado: ${idEliminado}`
      });

      return true;
    });
  }
}

module.exports = PaqueteSCService;