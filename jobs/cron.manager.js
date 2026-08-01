// // /*
// //     Author: German Valencia
// //     Manager: Orquestador Central de Tareas Programadas (CRON)
// // */
// // const cron = require('node-cron');
// // const { sequelize } = require('../database/connection');

// // const ClimateIngestionService = require('../services/torre-control/climate-ingestion.service');
// // const IngestionService = require('../services/torre-control/ingestion.service');
// // const ReportesService = require('../services/torre-control/reportes.service');
// // const MapaGeneralRepository = require('../repositories/torre-control/mapa-general.repository');
// // const MapaGeneralService = require('../services/torre-control/mapa-general.service');
// // const SincronizacionService = require('./sincronizacion.service');
// // const flotaTerrestreService = require('../services/torre-control/flota-terrestre.service');

// // const mapaRepository = new MapaGeneralRepository(sequelize); // <- AQUÍ SE CREA
// // const mapaGeneralService = new MapaGeneralService(mapaRepository); // <- SE INYECTA

// // const initCronJobs = (sequelizeInstance) => {
// //   console.log('--- [CRON MANAGER] Inicializando tareas en segundo plano ---');
// //   let simulacionEnCurso = false;

// //   // ---------------------------------------------------------
// //   // CRON 1: NUEVO ETL DE CLIMA Y ALERTAS (Open-Meteo / IDEAM)
// //   // Frecuencia: Cada 15 minutos (*/15 * * * *)
// //   // Reemplaza al antiguo CRON 5 estático
// //   // ---------------------------------------------------------
// //   cron.schedule('*/15 * * * *', async () => {
// //     console.log('⏰ [CRON 15m] Disparando ETL Nacional de Clima...');
// //     try {
// //       // Pasamos sequelizeInstance para que el ETL pueda guardar en BD
// //       await ClimateIngestionService.ejecutarIngesta(sequelizeInstance);
// //     } catch (error) {
// //       console.error('🚨 [CRON ERROR] Fallo en ETL de Clima:', error.message);
// //     }
// //   });

// //   // ---------------------------------------------------------
// //   // CRON 2: MOTONAVES (VesselFinder/Puertos)
// //   // Frecuencia: Cada 30 minutos
// //   // ---------------------------------------------------------
// //   cron.schedule('*/30 * * * *', async () => {
// //     console.log('⏰ [CRON 30m] Iniciando escaneo de motonaves...');
// //     try {
// //       await IngestionService.sincronizarMotonavesColombia();
// //     } catch (error) {
// //       console.error('🚨 [CRON ERROR] Fallo en sincronización de motonaves:', error.message);
// //     }
// //   });

// //   // ---------------------------------------------------------
// //   // CRON 3: BOLETINES MARÍTIMOS (DIMAR)
// //   // Frecuencia: Cada 6 horas (ej: 00:00, 06:00, 12:00, 18:00)
// //   // ---------------------------------------------------------
// //   cron.schedule('0 */6 * * *', async () => {
// //     console.log('⏰ [CRON 6h] Actualizando boletines externos DIMAR...');
// //     try {
// //       // Nota: Removí consultarClimaIDEAM() de aquí porque ya lo hace el CRON 1 de forma más eficiente
// //       await ReportesService.escanearBoletinesDIMAR();
// //     } catch (error) {
// //       console.error('🚨 [CRON ERROR] Fallo en escaneo DIMAR:', error.message);
// //     }
// //   });

// //   // ---------------------------------------------------------
// //   // CRON 4: PRODUCTIVIDAD INTERNA Y CIERRE DE CAJA
// //   // Frecuencia: Todos los días a las 02:00 AM
// //   // ---------------------------------------------------------
// //   cron.schedule('0 2 * * *', async () => {
// //     console.log('⏰ [CRON 02:00 AM] Generando reportes de productividad del día anterior...');
// //     try {
// //       await ReportesService.generarReporteProductividadAyer();
// //       await ReportesService.generarBoletinSemanal();
// //     } catch (error) {
// //       console.error('🚨 [CRON ERROR] Fallo en reportes de productividad:', error.message);
// //     }
// //   });

// //   // ---------------------------------------------------------
// //   // CRON 5: CAPTURA DE PRODUCTIVIDAD (Comentado por redundancia)
// //   // Nota Arquitectónica: Este CRON llamaba a sincronizarTodosLosPuertos() cada 2 horas, 
// //   // pero el CRON 2 ya lo hace cada 30 minutos. Se deja comentado para evitar duplicidad de procesos.
// //   // ---------------------------------------------------------
// //   cron.schedule('0 */2 * * *', async () => {
// //     console.log('⏰ [CRON 2H] Iniciando captura de productividad por terminales...');
// //     try {
// //       const resultados = await IngestionService.sincronizarTodosLosPuertos();
// //       // console.log(`📊 [CRON STATUS] Proceso completado. Registros procesados: ${resultados?.procesados || 0}`);
// //     } catch (error) {
// //       console.error('🚨 [CRON ERROR] Fallo en captura 2H:', error.message);
// //     }
// //   });

// //   // -------------------------------------------------------------------
// //   // CRON 6: SIMULADOR DE FLOTA TERRESTRE (Cada 15 segundos)
// //   // -------------------------------------------------------------------
// //   cron.schedule('*/30 * * * * *', async () => {
// //     console.log('⏰ [CRON 2H] Iniciando captura de posiciones de camiones ...');
// //     try {
// //       // ELIMINA EL IF DE SEGURIDAD. 
// //       // Si el método realmente existe, debe correr directamente.
// //       await mapaGeneralService.simularMovimientoFlota();

// //       console.log("✅ Actualización exitosa");
// //     } catch (error) {
// //       // Esto nos dirá si falla dentro del método o si realmente no existe
// //       console.error("🔥 ERROR EN LA EJECUCIÓN DEL MÉTODO:", error);
// //     }
// //   });

// //   // -------------------------------------------------------------------
// //   // CRON 7: EVENTOS VIALES (Cada 1 hora)
// //   // -------------------------------------------------------------------
// //   cron.schedule('*/10 * * * *', () => {
// //     console.log(`🕒 [${new Date().toISOString()}] Iniciando sincronización de eventos viales...`);
// //     (async () => {
// //       try {
// //         await SincronizacionService.sincronizarEventosViales();
// //       } catch (error) {
// //         console.error('❌ Error crítico en el cron de eventos viales:', error);
// //       }
// //     })();
// //   });

// //   // -------------------------------------------------------------------
// //   // CRON 8: SIMULADOR AUTOMATICO DE CAPAS (Cada 15 segundos)
// //   // -------------------------------------------------------------------
// //   cron.schedule('0 * * * * *', () => {
// //     console.log('🔄 Iniciando sincronización automática de capas...');
// //     (async () => {
// //       try {
// //         await SincronizacionService.sincronizarAlertasClimaticas();
// //         await SincronizacionService.sincronizarEventosViales();
// //         console.log('✅ Sincronización finalizada exitosamente.');
// //       } catch (error) {
// //         console.error('❌ Error en el Cron Job de sincronización:', error);
// //       }
// //     })();
// //   });

// //   // -------------------------------------------------------------------
// //   // CRON 9: SIMULADOR DE MOVIMIENTO DE CAMIONES
// //   // -------------------------------------------------------------------
// //   cron.schedule('*/50 * * * * *', () => {
// //     if (simulacionEnCurso) {
// //       console.log('⚠️ [Simulación] Saltando ciclo: el anterior aún está procesando.');
// //       return;
// //     }

// //     simulacionEnCurso = true;
// //     console.log('🔄 Iniciando simulación de movimiento...');

// //     (async () => {
// //       try {
// //         await flotaTerrestreService.simularMovimientoFlota();
// //       } catch (error) {
// //         console.error('[CronJob] Error en la simulación:', error);
// //       } finally {
// //         simulacionEnCurso = false;
// //       }
// //     })();
// //   });

// //   // -------------------------------------------------------------------
// //   // CRON 10: SIMULADOR DE MOVIMIENTO DE CAMIONES
// //   // -------------------------------------------------------------------
// //   cron.schedule('0 * * * *', async () => {
// //     console.log('🤖 [Cron] Iniciando búsqueda de naves sin homologar...');

// //     try {
// //       const pendientes = await MaritimoRepository.getNavesSinHomologar();
// //       console.log(`🔎 Se encontraron ${pendientes.length} naves pendientes.`);

// //       for (const barco of pendientes) {
// //         // Aquí va tu lógica de búsqueda (puedes buscar en tabla AIS o llamar a una API)
// //         const mmsiEncontrado = await buscarMmsiEnTuBaseDeDatos(barco.omi);

// //         if (mmsiEncontrado) {
// //           await MaritimoRepository.registrarHomologacion(barco.id_aviso, mmsiEncontrado);
// //           console.log(`✅ ${barco.motonave} homologada con MMSI: ${mmsiEncontrado}`);
// //         }
// //       }
// //     } catch (error) {
// //       console.error('❌ Error en el cron:', error);
// //     }
// //   });

// //   // Función de ejemplo (tú debes definir la lógica de búsqueda aquí)
// //   async function buscarMmsiEnTuBaseDeDatos(omi) {
// //     try {
// //       const query = `
// //             SELECT mmsi 
// //             FROM dbo.TCL_Referencia_OMI_MMSI 
// //             WHERE omi = :omi
// //         `;

// //       const resultado = await db.sequelize.query(query, {
// //         replacements: { omi: omi },
// //         type: db.sequelize.QueryTypes.SELECT
// //       });

// //       // Si encontró coincidencia, retorna el MMSI, si no, retorna null
// //       return resultado.length > 0 ? resultado[0].mmsi : null;

// //     } catch (error) {
// //       console.error(`❌ Error buscando MMSI para OMI ${omi}:`, error);
// //       return null;
// //     }
// //   }

// //   console.log('--- [CRON MANAGER] Todas las tareas registradas exitosamente ---');
// // };

// // module.exports = initCronJobs;

// /*
//     Author: German Valencia
//     Manager: Orquestador Central de Tareas Programadas (CRON)
// */
// const cron = require('node-cron');
// const { sequelize } = require('../database/connection');

// // 🟢 AÑADIDO: Importaciones requeridas para evitar el crash del CRON 10
// const db = require('../models');
// const MaritimoRepository = require('../repositories/torre-control/maritimo.repository'); // Verifica que esta ruta sea exacta

// const ClimateIngestionService = require('../services/torre-control/climate-ingestion.service');
// const IngestionService = require('../services/torre-control/ingestion.service');
// const ReportesService = require('../services/torre-control/reportes.service');
// const MapaGeneralRepository = require('../repositories/torre-control/mapa-general.repository');
// const MapaGeneralService = require('../services/torre-control/mapa-general.service');
// const SincronizacionService = require('./sincronizacion.service');
// const flotaTerrestreService = require('../services/torre-control/flota-terrestre.service');

// const mapaRepository = new MapaGeneralRepository(sequelize);
// const mapaGeneralService = new MapaGeneralService(mapaRepository);
// const ejecutarConMonitoreo = require('../utils/monitorETL');

// const initCronJobs = (sequelizeInstance) => {
//   console.log('--- [CRON MANAGER] Inicializando tareas en segundo plano ---');
//   let simulacionEnCurso = false;

//   // ---------------------------------------------------------
//   // CRON 1: NUEVO ETL DE CLIMA Y ALERTAS (Open-Meteo / IDEAM)
//   // Frecuencia: Cada 15 minutos (*/15 * * * *)
//   // ---------------------------------------------------------
//   cron.schedule('*/15 * * * *', async () => {
//     console.log('⏰ [CRON 15m] Disparando ETL Nacional de Clima...');
//     ejecutarConMonitoreo('🔄 ETL Nacional de Clima', async () => {
//       return await ClimateIngestionService.ejecutarIngesta(sequelizeInstance);
//     });
//   });

//   // ---------------------------------------------------------
//   // CRON 2: MOTONAVES (VesselFinder/Puertos)
//   // Frecuencia: Cada 30 minutos
//   // ---------------------------------------------------------
//   cron.schedule('*/30 * * * *', async () => {
//     console.log('⏰ [CRON 30m] Iniciando escaneo de motonaves...');
//     ejecutarConMonitoreo('🔄 Escaneo de motonaves', async () => {
//       return await IngestionService.sincronizarMotonavesColombia();
//     });
//   });

//   // ---------------------------------------------------------
//   // CRON 3: BOLETINES MARÍTIMOS (DIMAR)
//   // Frecuencia: Cada 6 horas
//   // ---------------------------------------------------------
//   cron.schedule('0 */6 * * *', async () => {
//     console.log('⏰ [CRON 6h] Actualizando boletines externos DIMAR...');
//     // try {
//     //   await ReportesService.escanearBoletinesDIMAR();
//     // } catch (error) {
//     //   console.error('🚨 [CRON ERROR] Fallo en escaneo DIMAR:', error.message);
//     // }
//     ejecutarConMonitoreo('🔄 Actualizando boletines externos DIMAR', async () => {
//       return await ReportesService.escanearBoletinesDIMAR();
//     });
//   });

//   // ---------------------------------------------------------
//   // CRON 4: PRODUCTIVIDAD INTERNA Y CIERRE DE CAJA
//   // Frecuencia: Todos los días a las 02:00 AM
//   // ---------------------------------------------------------
//   cron.schedule('0 2 * * *', async () => {
//     console.log('⏰ [CRON 02:00 AM] Generando reportes de productividad del día anterior...');
//     // try {
//     //   await ReportesService.generarReporteProductividadAyer();
//     //   await ReportesService.generarBoletinSemanal();
//     // } catch (error) {
//     //   console.error('🚨 [CRON ERROR] Fallo en reportes de productividad:', error.message);
//     // }
//     ejecutarConMonitoreo('🔄 Generando reportes de productividad del día anterior', async () => {
//       return await ReportesService.generarReporteProductividadAyer();
//     });
//   });

//   // ---------------------------------------------------------
//   // CRON 4: PRODUCTIVIDAD INTERNA Y CIERRE DE CAJA
//   // Frecuencia: Todos los días a las 02:00 AM
//   // ---------------------------------------------------------
//   cron.schedule('0 2 * * *', async () => {
//     console.log('⏰ [CRON 02:00 AM] Generando reportes de productividad del día anterior...');
//     // try {
//     //   await ReportesService.generarReporteProductividadAyer();
//     //   await ReportesService.generarBoletinSemanal();
//     // } catch (error) {
//     //   console.error('🚨 [CRON ERROR] Fallo en reportes de productividad:', error.message);
//     // }
//     ejecutarConMonitoreo('🔄 Boletines semanales', async () => {
//       return await ReportesService.generarBoletinSemanal();
//     });
//   });

//   // ---------------------------------------------------------
//   // CRON 5: CAPTURA DE PRODUCTIVIDAD (APAGADO)
//   // 🟢 CORRECCIÓN: Comentado bloque completo por redundancia con CRON 2
//   // ---------------------------------------------------------
//   cron.schedule('0 */2 * * *', async () => {
//     console.log('⏰ [CRON 2H] Iniciando captura de productividad por terminales...');
//     // try {
//     //   const resultados = await IngestionService.sincronizarTodosLosPuertos();
//     // } catch (error) {
//     //   console.error('🚨 [CRON ERROR] Fallo en captura 2H:', error.message);
//     // }
//     ejecutarConMonitoreo('🔄 Iniciando captura de productividad por terminales', async () => {
//       return await IngestionService.sincronizarTodosLosPuertos();
//     });
//   });

//   // -------------------------------------------------------------------
//   // CRON 6: SIMULADOR DE FLOTA TERRESTRE (APAGADO)
//   // 🟢 CORRECCIÓN: Desactivado. Delegado al CRON 9 por seguridad anti-deadlocks
//   // -------------------------------------------------------------------
//   cron.schedule('*/30 * * * * *', async () => {
//     console.log('⏰ [CRON 2H] Iniciando captura de posiciones de camiones ...');
//     // try {
//     //   await mapaGeneralService.simularMovimientoFlota();
//     //   console.log("✅ Actualización exitosa");
//     // } catch (error) {
//     //   console.error("🔥 ERROR EN LA EJECUCIÓN DEL MÉTODO:", error);
//     // }
//     ejecutarConMonitoreo('🔄 Iniciando captura de posiciones de camiones', async () => {
//       return await mapaGeneralService.simularMovimientoFlota();
//     });
//   });

//   // -------------------------------------------------------------------
//   // CRON 7: EVENTOS VIALES (Cada 10 minutos)
//   // 🟢 Mantiene cadencia segura para no banear APIs externas
//   // -------------------------------------------------------------------
//   // cron.schedule('*/10 * * * *', () => {
//   //   console.log(`🕒 [${new Date().toISOString()}] Iniciando sincronización de eventos viales...`);
//   //   (async () => {
//   //     try {
//   //       await SincronizacionService.sincronizarEventosViales();
//   //     } catch (error) {
//   //       console.error('❌ Error crítico en el cron de eventos viales:', error);
//   //     }
//   //   })();
//   // });
//   // Ejemplo de actualización de un cron existente
//   cron.schedule('*/10 * * * *', () => {
//     console.log('🕒 Iniciando sincronización de eventos viales...');
//     ejecutarConMonitoreo('🔄 Eventos Viales TomTom', async () => {
//       return await SincronizacionService.sincronizarEventosViales();
//     });
//   });

//   // -------------------------------------------------------------------
//   // CRON 8: SIMULADOR AUTOMATICO DE CAPAS (Clima - Cada 15 min)
//   // 🟢 CORRECCIÓN: Removida la redundancia de eventos viales
//   // -------------------------------------------------------------------
//   cron.schedule('*/15 * * * *', () => {
//     console.log('🔄 Iniciando sincronización automática de alertas climáticas...');
//     (async () => {
//       // try {
//       //   await SincronizacionService.sincronizarAlertasClimaticas();
//       //   console.log('✅ Sincronización climática finalizada exitosamente.');
//       // } catch (error) {
//       //   console.error('❌ Error en el Cron Job de sincronización climática:', error);
//       // }
//       ejecutarConMonitoreo('🔄 Iniciando sincronización automática de alertas climáticas', async () => {
//         return await SincronizacionService.sincronizarAlertasClimaticas();
//       });
//     })();
//   });

//   // -------------------------------------------------------------------
//   // CRON 9: SIMULADOR DE MOVIMIENTO DE CAMIONES (El Oficial)
//   // 🟢 Mantenido por su lógica segura con simulacionEnCurso
//   // -------------------------------------------------------------------
//   cron.schedule('*/50 * * * * *', () => {
//     if (simulacionEnCurso) {
//       console.log('⚠️ [Simulación] Saltando ciclo: el anterior aún está procesando.');
//       return;
//     }

//     simulacionEnCurso = true;
//     console.log('🔄 Iniciando simulación de movimiento...');

//     (async () => {
//       // try {
//       //   await flotaTerrestreService.simularMovimientoFlota();
//       // } catch (error) {
//       //   console.error('[CronJob] Error en la simulación:', error);
//       // } finally {
//       //   simulacionEnCurso = false;
//       // }
//       ejecutarConMonitoreo('🔄 Iniciando simulación de movimiento', async () => {
//         return await flotaTerrestreService.simularMovimientoFlota();
//       });
//     })();
//   });

//   // -------------------------------------------------------------------
//   // CRON 10: BUSQUEDA DE NAVES SIN HOMOLOGAR
//   // 🟢 CORRECCIÓN: Ahora puede consumir la instancia db y el Repositorio
//   // -------------------------------------------------------------------
//   cron.schedule('0 * * * *', async () => {
//     console.log('🤖 [Cron] Iniciando búsqueda de naves sin homologar...');

//     try {
//       const pendientes = await MaritimoRepository.getNavesSinHomologar();
//       console.log(`🔎 Se encontraron ${pendientes.length} naves pendientes.`);

//       for (const barco of pendientes) {
//         const mmsiEncontrado = await buscarMmsiEnTuBaseDeDatos(barco.omi);

//         if (mmsiEncontrado) {
//           // await MaritimoRepository.registrarHomologacion(barco.id_aviso, mmsiEncontrado);
//           console.log(`✅ ${barco.motonave} homologada con MMSI: ${mmsiEncontrado}`);
//           ejecutarConMonitoreo('🔄 ${barco.motonave} homologada con MMSI: ${mmsiEncontrado}', async () => {
//             return await MaritimoRepository.registrarHomologacion(barco.id_aviso, mmsiEncontrado);
//           });
//         }
//       }
//     } catch (error) {
//       console.error('❌ Error en el cron:', error);
//     }
//   });

//   // Función de búsqueda para CRON 10
//   async function buscarMmsiEnTuBaseDeDatos(omi) {
//     try {
//       const query = `
//             SELECT mmsi 
//             FROM dbo.TCL_Referencia_OMI_MMSI 
//             WHERE omi = :omi
//         `;

//       const resultado = await db.sequelize.query(query, {
//         replacements: { omi: omi },
//         type: db.sequelize.QueryTypes.SELECT
//       });

//       return resultado.length > 0 ? resultado[0].mmsi : null;

//     } catch (error) {
//       console.error(`❌ Error buscando MMSI para OMI ${omi}:`, error);
//       return null;
//     }
//   }

//   console.log('--- [CRON MANAGER] Todas las tareas registradas exitosamente ---');
// };

// module.exports = initCronJobs;

/*
    Author: German Valencia
    Manager: Orquestador Central de Tareas Programadas (CRON)
*/
const cron = require('node-cron');
const { sequelize } = require('../database/connection');

// 🟢 Importaciones requeridas para evitar el crash del CRON 10
const db = require('../models');
const MaritimoRepository = require('../repositories/torre-control/maritimo.repository');

const ClimateIngestionService = require('../services/torre-control/climate-ingestion.service');
const IngestionService = require('../services/torre-control/ingestion.service');
const ReportesService = require('../services/torre-control/reportes.service');
const MapaGeneralRepository = require('../repositories/torre-control/mapa-general.repository');
const MapaGeneralService = require('../services/torre-control/mapa-general.service');
const SincronizacionService = require('./sincronizacion.service');
const flotaTerrestreService = require('../services/torre-control/flota-terrestre.service');

const mapaRepository = new MapaGeneralRepository(sequelize);
const mapaGeneralService = new MapaGeneralService(mapaRepository);
const ejecutarConMonitoreo = require('../utils/monitorETL');

const initCronJobs = (sequelizeInstance) => {
  console.log('--- [CRON MANAGER] Inicializando tareas en segundo plano ---');
  let simulacionEnCurso = false;

  // ---------------------------------------------------------
  // CRON 1: NUEVO ETL DE CLIMA Y ALERTAS (Open-Meteo / IDEAM)
  // Frecuencia: Cada 15 minutos (*/15 * * * *)
  // ---------------------------------------------------------
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ [CRON 15m] Disparando ETL Nacional de Clima...');
    ejecutarConMonitoreo('🔄 ETL Nacional de Clima', async () => {
      return await ClimateIngestionService.ejecutarIngesta(sequelizeInstance);
    });
  });

  // ---------------------------------------------------------
  // CRON 2: MOTONAVES (VesselFinder/Puertos)
  // Frecuencia: Cada 30 minutos
  // ---------------------------------------------------------
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ [CRON 30m] Iniciando escaneo de motonaves...');
    ejecutarConMonitoreo('🔄 Escaneo de motonaves', async () => {
      return await IngestionService.sincronizarMotonavesColombia();
    });
  });

  // ---------------------------------------------------------
  // CRON 3: BOLETINES MARÍTIMOS (DIMAR)
  // Frecuencia: Cada 6 horas
  // ---------------------------------------------------------
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ [CRON 6h] Actualizando boletines externos DIMAR...');
    ejecutarConMonitoreo('🔄 Actualizando boletines externos DIMAR', async () => {
      return await ReportesService.escanearBoletinesDIMAR();
    });
  });

  // ---------------------------------------------------------
  // CRON 4a: PRODUCTIVIDAD INTERNA Y CIERRE DE CAJA
  // Frecuencia: Todos los días a las 02:00 AM
  // ---------------------------------------------------------
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON 02:00 AM] Generando reportes de productividad del día anterior...');
    ejecutarConMonitoreo('🔄 Generando reportes de productividad del día anterior', async () => {
      return await ReportesService.generarReporteProductividadAyer();
    });
  });

  // ---------------------------------------------------------
  // CRON 4b: BOLETINES SEMANALES
  // Frecuencia: Todos los días a las 02:00 AM
  // ---------------------------------------------------------
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON 02:00 AM] Generando boletines semanales...');
    ejecutarConMonitoreo('🔄 Boletines semanales', async () => {
      return await ReportesService.generarBoletinSemanal();
    });
  });

  // ---------------------------------------------------------
  // CRON 5: CAPTURA DE PRODUCTIVIDAD (APAGADO)
  // 🟢 CORRECCIÓN: Comentado bloque completo por redundancia con CRON 2
  // ---------------------------------------------------------
  // cron.schedule('0 */2 * * *', async () => {
  //   console.log('⏰ [CRON 2H] Iniciando captura de productividad por terminales...');
  //   ejecutarConMonitoreo('🔄 Iniciando captura de productividad por terminales', async () => {
  //     return await IngestionService.sincronizarTodosLosPuertos();
  //   });
  // });

  // -------------------------------------------------------------------
  // CRON 6: SIMULADOR DE FLOTA TERRESTRE (APAGADO)
  // 🟢 CORRECCIÓN: Desactivado. Delegado al CRON 9 por seguridad anti-deadlocks
  // -------------------------------------------------------------------
  // cron.schedule('*/30 * * * * *', async () => {
  //   console.log('⏰ [CRON 2H] Iniciando captura de posiciones de camiones ...');
  //   ejecutarConMonitoreo('🔄 Iniciando captura de posiciones de camiones', async () => {
  //     return await mapaGeneralService.simularMovimientoFlota();
  //   });
  // });

  // -------------------------------------------------------------------
  // CRON 7: EVENTOS VIALES (Cada 10 minutos)
  // -------------------------------------------------------------------
  cron.schedule('*/10 * * * *', () => {
    console.log('🕒 Iniciando sincronización de eventos viales...');
    ejecutarConMonitoreo('🔄 Eventos Viales TomTom', async () => {
      return await SincronizacionService.sincronizarEventosViales();
    });
  });

  // -------------------------------------------------------------------
  // CRON 8: SIMULADOR AUTOMATICO DE CAPAS (Clima - Cada 15 min)
  // -------------------------------------------------------------------
  cron.schedule('*/15 * * * *', () => {
    console.log('🔄 Iniciando sincronización automática de alertas climáticas...');
    (async () => {
      ejecutarConMonitoreo('🔄 Iniciando sincronización automática de alertas climáticas', async () => {
        return await SincronizacionService.sincronizarAlertasClimaticas();
      });
    })();
  });

  // -------------------------------------------------------------------
  // CRON 9: SIMULADOR DE MOVIMIENTO DE CAMIONES (El Oficial)
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
        await ejecutarConMonitoreo('🔄 Iniciando simulación de movimiento', async () => {
          return await flotaTerrestreService.simularMovimientoFlota();
        });
      } finally {
        simulacionEnCurso = false;
      }
    })();
  });

  // -------------------------------------------------------------------
  // CRON 10: BUSQUEDA DE NAVES SIN HOMOLOGAR
  // 🟢 CORRECCIÓN: Envuelto todo el proceso para un solo registro en bitácora
  // -------------------------------------------------------------------
  cron.schedule('0 * * * *', async () => {
    console.log('🤖 [Cron] Iniciando búsqueda de naves sin homologar...');

    ejecutarConMonitoreo('🔄 Homologación de Naves', async () => {
      const pendientes = await MaritimoRepository.getNavesSinHomologar();
      console.log(`🔎 Se encontraron ${pendientes.length} naves pendientes.`);

      let homologadas = 0;

      for (const barco of pendientes) {
        const mmsiEncontrado = await buscarMmsiEnTuBaseDeDatos(barco.omi);

        if (mmsiEncontrado) {
          await MaritimoRepository.registrarHomologacion(barco.id_aviso, mmsiEncontrado);
          console.log(`✅ ${barco.motonave} homologada con MMSI: ${mmsiEncontrado}`);
          homologadas++;
        }
      }

      // Retornamos la cantidad de registros homologados para que la bitácora lo guarde
      return { insertados: homologadas };
    });
  });

  // Función de búsqueda para CRON 10
  async function buscarMmsiEnTuBaseDeDatos(omi) {
    try {
      const query = `
            SELECT mmsi 
            FROM dbo.TCL_Referencia_OMI_MMSI 
            WHERE omi = :omi
        `;

      const resultado = await db.sequelize.query(query, {
        replacements: { omi: omi },
        type: db.sequelize.QueryTypes.SELECT
      });

      return resultado.length > 0 ? resultado[0].mmsi : null;

    } catch (error) {
      console.error(`❌ Error buscando MMSI para OMI ${omi}:`, error);
      return null;
    }
  }

  console.log('--- [CRON MANAGER] Todas las tareas registradas exitosamente ---');
};

module.exports = initCronJobs;