/*
    Author: German Valencia
    Manager: Orquestador Central de Tareas Programadas (CRON)
*/
const cron = require('node-cron');
const { sequelize } = require('../database/connection');

// ==========================================
// 1. IMPORTACIÓN DE SERVICIOS
// (Ajusta las rutas relativas según tu estructura de carpetas)
// ==========================================
const ClimateIngestionService = require('../services/torre-control/climate-ingestion.service');
const IngestionService = require('../services/torre-control/ingestion.service');
const ReportesService = require('../services/torre-control/reportes.service');
const MapaGeneralRepository = require('../repositories/torre-control/mapa-general.repository');
const MapaGeneralService = require('../services/torre-control/mapa-general.service');
const SincronizacionService = require('./sincronizacion.service');
const flotaTerrestreService = require('../services/torre-control/flota-terrestre.service');

// 2. INYECCIÓN DE DEPENDENCIAS (El orden es vital)
const mapaRepository = new MapaGeneralRepository(sequelize); // <- AQUÍ SE CREA
const mapaGeneralService = new MapaGeneralService(mapaRepository); // <- SE INYECTA

const initCronJobs = (sequelizeInstance) => {
  console.log('--- [CRON MANAGER] Inicializando tareas en segundo plano ---');
  let simulacionEnCurso = false;
  // ---------------------------------------------------------
  // CRON 1: NUEVO ETL DE CLIMA Y ALERTAS (Open-Meteo / IDEAM)
  // Frecuencia: Cada 15 minutos (*/15 * * * *)
  // Reemplaza al antiguo CRON 5 estático
  // ---------------------------------------------------------
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ [CRON 15m] Disparando ETL Nacional de Clima...');
    try {
      // Pasamos sequelizeInstance para que el ETL pueda guardar en BD
      await ClimateIngestionService.ejecutarIngesta(sequelizeInstance);
    } catch (error) {
      console.error('🚨 [CRON ERROR] Fallo en ETL de Clima:', error.message);
    }
  });

  // ---------------------------------------------------------
  // CRON 2: MOTONAVES (VesselFinder/Puertos)
  // Frecuencia: Cada 30 minutos
  // ---------------------------------------------------------
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ [CRON 30m] Iniciando escaneo de motonaves...');
    try {
      await IngestionService.sincronizarMotonavesColombia();
    } catch (error) {
      console.error('🚨 [CRON ERROR] Fallo en sincronización de motonaves:', error.message);
    }
  });

  // ---------------------------------------------------------
  // CRON 3: BOLETINES MARÍTIMOS (DIMAR)
  // Frecuencia: Cada 6 horas (ej: 00:00, 06:00, 12:00, 18:00)
  // ---------------------------------------------------------
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ [CRON 6h] Actualizando boletines externos DIMAR...');
    try {
      // Nota: Removí consultarClimaIDEAM() de aquí porque ya lo hace el CRON 1 de forma más eficiente
      await ReportesService.escanearBoletinesDIMAR();
    } catch (error) {
      console.error('🚨 [CRON ERROR] Fallo en escaneo DIMAR:', error.message);
    }
  });

  // ---------------------------------------------------------
  // CRON 4: PRODUCTIVIDAD INTERNA Y CIERRE DE CAJA
  // Frecuencia: Todos los días a las 02:00 AM
  // ---------------------------------------------------------
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON 02:00 AM] Generando reportes de productividad del día anterior...');
    try {
      await ReportesService.generarReporteProductividadAyer();
      await ReportesService.generarBoletinSemanal();
    } catch (error) {
      console.error('🚨 [CRON ERROR] Fallo en reportes de productividad:', error.message);
    }
  });

  // ---------------------------------------------------------
  // CRON 5: CAPTURA DE PRODUCTIVIDAD (Comentado por redundancia)
  // Nota Arquitectónica: Este CRON llamaba a sincronizarTodosLosPuertos() cada 2 horas, 
  // pero el CRON 2 ya lo hace cada 30 minutos. Se deja comentado para evitar duplicidad de procesos.
  // ---------------------------------------------------------
  cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ [CRON 2H] Iniciando captura de productividad por terminales...');
    try {
      const resultados = await IngestionService.sincronizarTodosLosPuertos();
      // console.log(`📊 [CRON STATUS] Proceso completado. Registros procesados: ${resultados?.procesados || 0}`);
    } catch (error) {
      console.error('🚨 [CRON ERROR] Fallo en captura 2H:', error.message);
    }
  });

  // -------------------------------------------------------------------
  // CRON 6: SIMULADOR DE FLOTA TERRESTRE (Cada 15 segundos)
  // -------------------------------------------------------------------
  cron.schedule('*/30 * * * * *', async () => {
    console.log('⏰ [CRON 2H] Iniciando captura de posiciones de camiones ...');
    try {
      // ELIMINA EL IF DE SEGURIDAD. 
      // Si el método realmente existe, debe correr directamente.
      await mapaGeneralService.simularMovimientoFlota();

      console.log("✅ Actualización exitosa");
    } catch (error) {
      // Esto nos dirá si falla dentro del método o si realmente no existe
      console.error("🔥 ERROR EN LA EJECUCIÓN DEL MÉTODO:", error);
    }
  });

  // -------------------------------------------------------------------
  // CRON 7: EVENTOS VIALES (Cada 1 hora)
  // -------------------------------------------------------------------
  cron.schedule('*/45 * * * * *', () => {
    console.log(`🕒 [${new Date().toISOString()}] Iniciando sincronización de eventos viales...`);
    // Y envolvemos la llamada asíncrona en una función autoejecutable (IIFE)
    (async () => {
      try {
        await SincronizacionService.sincronizarEventosViales();
      } catch (error) {
        console.error('❌ Error crítico en el cron de eventos viales:', error);
      }
    })(); // Los paréntesis del final la ejecutan inmediatamente
  });

  // -------------------------------------------------------------------
  // CRON 8: SIMULADOR AUTOMATICO DE CAPAS (Cada 15 segundos)
  // -------------------------------------------------------------------
  cron.schedule('0 * * * * *', () => {
    console.log('🔄 Iniciando sincronización automática de capas...');
    (async () => {
      try {
        await SincronizacionService.sincronizarAlertasClimaticas();
        await SincronizacionService.sincronizarEventosViales();
        console.log('✅ Sincronización finalizada exitosamente.');
      } catch (error) {
        console.error('❌ Error en el Cron Job de sincronización:', error);
      }
    })();
  });

  // -------------------------------------------------------------------
  // CRON 9: SIMULADOR DE MOVIMIENTO DE CAMIONES
  // -------------------------------------------------------------------
  cron.schedule('*/50 * * * * *', () => {
    if (simulacionEnCurso) {
      console.log('⚠️ [Simulación] Saltando ciclo: el anterior aún está procesando.');
      return;
    }

    simulacionEnCurso = true;
    console.log('🔄 Iniciando simulación de movimiento...');

    (async () => {
      try {
        await flotaTerrestreService.simularMovimientoFlota();
      } catch (error) {
        console.error('[CronJob] Error en la simulación:', error);
      } finally {
        simulacionEnCurso = false;
      }
    })();
  });

  console.log('--- [CRON MANAGER] Todas las tareas registradas exitosamente ---');
};

module.exports = initCronJobs;