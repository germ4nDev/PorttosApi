/*
    Author: German Valencia
    Pattern: QPLUS Standard - Controlador de Terminales
*/
const { response } = require('express');
const TerminalesService = require('../../services/torre-control/terminales.service');

const terminalesService = new TerminalesService();

const getTerminales = async (req, res = response) => {
  try {
    const respuesta = await terminalesService.getTerminales();

    res.status(respuesta.statusCode).json({
      ok: respuesta.ok,
      data: respuesta.data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.msg || 'Error al obtener el listado de terminales. Hable con el administrador.',
      error: error.message || error
    });
  }
};

const getTerminalById = async (req, res = response) => {
  try {
    const { id_terminal } = req.params;
    const respuesta = await terminalesService.getTerminalById(id_terminal);

    if (!respuesta.ok) {
      return res.status(respuesta.statusCode).json({
        ok: false,
        msg: `No se encontró una terminal con el ID: ${id_terminal}`
      });
    }

    res.status(respuesta.statusCode).json({
      ok: true,
      data: respuesta.data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.msg || 'Error al obtener la terminal'
    });
  }
};

const crearTerminal = async (req, res = response) => {
  try {
    const userContext = { codigoUsuario: req.uid || 'SISTEMA_ADMIN' };
    const nuevaTerminal = await terminalesService.crearTerminal(req.body, userContext);

    res.status(201).json({
      ok: true,
      msg: 'Terminal creada exitosamente',
      data: nuevaTerminal
    });
  } catch (error) {
    const statusCode = error.type === 'ValidationError' ? 400 : (error.statusCode || 500);
    res.status(statusCode).json({
      ok: false,
      msg: error.type === 'ValidationError' ? 'Error de validación en los datos enviados' : (error.msg || 'Error al crear la terminal'),
      detalles: error.details || error
    });
  }
};

const updateTerminal = async (req, res = response) => {
  try {
    const { id_terminal } = req.params;
    const userContext = { codigoUsuario: req.uid || 'SISTEMA_ADMIN' };

    // if (dataDTO.geocerca_geo) {
    //   // Si viene una geocerca nueva, la convertimos para SQL Server
    //   dataDTO.geocerca_geo = Sequelize.literal(`geometry::STGeomFromText('${dataDTO.geocerca_geo}', 4326)`);
    // } else {
    //   // 🟢 LA MAGIA AQUÍ: Si es null o no viene, borramos la propiedad.
    //   // Así Sequelize no la incluye en el SET del UPDATE y respeta la existente en BD.
    //   delete dataDTO.geocerca_geo;
    // }

    const terminalActualizada = await terminalesService.updateTerminal(id_terminal, req.body, userContext);

    res.json({
      ok: true,
      msg: 'Terminal actualizada exitosamente',
      data: terminalActualizada
    });
  } catch (error) {
    const statusCode = error.type === 'ValidationError' ? 400 : (error.statusCode || 500);
    res.status(statusCode).json({
      ok: false,
      msg: error.type === 'ValidationError' ? 'Error de validación en los datos enviados' : (error.msg || 'Error al actualizar la terminal'),
      detalles: error.details || error
    });
  }
};

const deleteTerminal = async (req, res = response) => {
  try {
    const { id_terminal } = req.params;
    const terminalEliminada = await terminalesService.deleteTerminal(id_terminal);

    res.json({
      ok: true,
      msg: 'Terminal eliminada correctamente',
      data: terminalEliminada
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.msg || 'Error al eliminar la terminal'
    });
  }
};

module.exports = {
  getTerminales,
  getTerminalById,
  crearTerminal,
  updateTerminal,
  deleteTerminal
};