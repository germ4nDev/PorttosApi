/*
    Author: German Valencia
    Pattern: QPLUS Controller Pattern - Marítimo Maestro
*/
const fs = require('fs');
const path = require('path');
const MaritimoService = require('../../services/torre-control/maritimo.service');
const IngestionService = require('../../services/torre-control/ingestion.service');
const GeoreferenciacionService = require('../../services/torre-control/georeferenciacion.service');

const obtenerOperacionesSLA = async (req, res) => {
  try {
    const puerto = req.query.puerto || 'BUENAVENTURA';
    const data = await MaritimoService.obtenerOperacionesSLA(puerto);
    return res.status(200).json(data);
  } catch (error) {
    console.error('[MaritimoController] Error en operaciones-sla:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerPosicionesMapa = async (req, res) => {
  try {
    const geoJsonData = await GeoreferenciacionService.obtenerCapaMaritimaGeoJSON();

    return res.status(200).json({
      exito: true,
      data: geoJsonData
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al procesar la capa geográfica',
      error: error.message
    });
  }
}

const obtenerLineUp = async (req, res) => {
  try {
    const puerto = req.query.puerto || 'BUENAVENTURA';
    const data = await MaritimoService.obtenerLineUp(puerto);
    return res.status(200).json(data);
  } catch (error) {
    console.error('[MaritimoController] Error en lineup:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerClima = async (req, res) => {
  try {
    const puerto = req.query.puerto || 'BUENAVENTURA';
    const data = await MaritimoService.obtenerClima(puerto);
    return res.status(200).json(data);
  } catch (error) {
    console.error('[MaritimoController] Error en clima:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Método Maestro: Orquesta la sincronización y la entrega de datos
 */
const obtenerResumenOperativo = async (req, res) => {
  try {
    const puerto = req.query.puerto || 'BUENAVENTURA';
    console.log('🔍 [DEBUG API] Recibiendo consulta para puerto:', puerto);
    await IngestionService.sincronizarMotonaves(puerto);

    const data = await MaritimoService.obtenerResumenOperativo(puerto);
    console.log('🔍 [DEBUG API] Registros encontrados en BD:', data.length);
    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('[MaritimoController] Error en resumen maestro:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerInfraestructuraMapa = async (req, res) => {
  try {
    const geoJsonData = await GeoreferenciacionService.obtenerCapaInfraestructuraGeoJSON();
    return res.status(200).json({ exito: true, data: geoJsonData });
  } catch (error) {
    return res.status(500).json({ exito: false, error: error.message });
  }
}

module.exports = {
  obtenerOperacionesSLA,
  obtenerLineUp,
  obtenerClima,
  obtenerPosicionesMapa,
  obtenerInfraestructuraMapa,
  obtenerResumenOperativo
};