/*
    Author: German Valencia
    Pattern: QPLUS Standard - Controlador de Infraestructura
*/
const { response } = require('express');
const InfraestructuraService = require('../../services/torre-control/infraestructura.service');

const infraestructuraService = new InfraestructuraService();

const getInfraestructuras = async (req, res = response) => {
  try {
    const respuesta = await infraestructuraService.getInfraestructuras();

    res.status(respuesta.statusCode).json({
      ok: respuesta.ok,
      data: respuesta.data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.msg || 'Error al obtener el listado de infraestructura. Hable con el administrador.',
      error: error.message || error
    });
  }
};

const getInfraestructuraById = async (req, res = response) => {
  try {
    const { id_infraestructura } = req.params;
    const respuesta = await infraestructuraService.getInfraestructuraById(id_infraestructura);

    if (!respuesta.ok) {
      return res.status(respuesta.statusCode).json({
        ok: false,
        msg: `No se encontró la infraestructura con el ID: ${id_infraestructura}`
      });
    }

    res.status(respuesta.statusCode).json({
      ok: true,
      data: respuesta.data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.msg || 'Error al obtener la infraestructura'
    });
  }
};

const crearInfraestructura = async (req, res = response) => {
  try {
    const userContext = { codigoUsuario: req.uid || 'SISTEMA_ADMIN' };
    const nuevaInfraestructura = await infraestructuraService.crearInfraestructura(req.body, userContext);

    res.status(201).json({
      ok: true,
      msg: 'Infraestructura creada exitosamente',
      data: nuevaInfraestructura
    });
  } catch (error) {
    const statusCode = error.type === 'ValidationError' ? 400 : (error.statusCode || 500);
    res.status(statusCode).json({
      ok: false,
      msg: error.type === 'ValidationError' ? 'Error de validación en los datos enviados' : (error.msg || 'Error al crear la infraestructura'),
      detalles: error.details || error
    });
  }
};

const updateInfraestructura = async (req, res = response) => {
  try {
    const { id_infraestructura } = req.params;
    const userContext = { codigoUsuario: req.uid || 'SISTEMA_ADMIN' };

    const infraestructuraActualizada = await infraestructuraService.updateInfraestructura(id_infraestructura, req.body, userContext);

    res.json({
      ok: true,
      msg: 'Infraestructura actualizada exitosamente',
      data: infraestructuraActualizada
    });
  } catch (error) {
    const statusCode = error.type === 'ValidationError' ? 400 : (error.statusCode || 500);
    res.status(statusCode).json({
      ok: false,
      msg: error.type === 'ValidationError' ? 'Error de validación en los datos enviados' : (error.msg || 'Error al actualizar la infraestructura'),
      detalles: error.details || error
    });
  }
};

const deleteInfraestructura = async (req, res = response) => {
  try {
    const { id_infraestructura } = req.params;
    const infraestructuraEliminada = await infraestructuraService.deleteInfraestructura(id_infraestructura);

    res.json({
      ok: true,
      msg: 'Infraestructura eliminada correctamente',
      data: infraestructuraEliminada
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.msg || 'Error al eliminar la infraestructura'
    });
  }
};

module.exports = {
  getInfraestructuras,
  getInfraestructuraById,
  crearInfraestructura,
  updateInfraestructura,
  deleteInfraestructura
};