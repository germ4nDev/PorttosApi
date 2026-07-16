
class TorreControlService {
  static async actualizarLayout(codigo, widgets) {
    // Iniciamos una transacción de Sequelize
    const t = await sequelize.transaction();

    try {
      // 1. Opcional: Borrar la configuración anterior de ese código de tablero
      await LayoutModel.destroy({ where: { codigoTablero: codigo }, transaction: t });

      // 2. Mapear los widgets para insertarlos
      const widgetsParaInsertar = widgets.map(w => ({
        codigoTablero: codigo,
        widgetId: w.id,
        config: w.config, // El JSON.stringify({cols, rows})
        posX: w.posicion.x,
        posY: w.posicion.y
      }));

      // 3. Inserción masiva
      await LayoutModel.bulkCreate(widgetsParaInsertar, { transaction: t });

      // Si todo sale bien, confirmamos los cambios
      await t.commit();
      return true;

    } catch (error) {
      // Si algo falla, revertimos la base de datos + error.message
      await t.rollback();
      throw new Error('Error guardando el layout en BD: ');
    }
  }
}