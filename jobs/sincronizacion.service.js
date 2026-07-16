const db = require('../models');
const MapaGeneralRepository = require('../repositories/torre-control/mapa-general.repository');
const ExternalIntegrationService = require('../services/torre-control/external-integration.service');
const { EventoVial, sequelize } = require('../models/index');
const { EventoVialDTO } = require('../models/torre-control/evento-vial.model');

// Accede al modelo inicializado
const EventoVialModel = db.EventoVial;

class SincronizacionService {

  async sincronizarAlertasClimaticas() {
    try {
      const datosOficiales = await ExternalIntegrationService.getAlertasClimaticasOficiales();
      for (const item of datosOficiales) {
        const alerta = {
          codigoAlerta: item.id_externo,
          region: item.zona,
          corredorVial: item.corredor,
          sector: item.tramo,
          tipoAlerta: item.tipo,
          nivelSeveridad: parseInt(item.nivel),
          estadoAlerta: 'ACTIVO',
          fechalnicio: new Date().toISOString()
        };
        await MapaGeneralRepository.upsertAlertaClimatica(alerta);
      }
    } catch (error) {
      console.error("❌ Error en sincronización climática:", error);
    }
  }

  async sincronizarEventosViales() {
    console.log("🚀 Iniciando sincronización de eventos viales...");
    try {
      const incidentesTomTom = await ExternalIntegrationService.getEventosVialesOficiales();
      const userContext = { codigoUsuario: 'SYS_CRON_TOMTOM' };

      for (const item of incidentesTomTom) {
        try {
          // 1. Mapear datos crudos a estructura JSON estándar (GeoJSON)
          const rawData = this._mapearEventoVial(item);

          // 2. Validar y Ensamblar DTO
          const eventoDTO = EventoVialDTO(rawData, userContext);

          // 3. Conversión de GeoJSON a SQL Literal (Solo para MSSQL)
          // Hacemos esto DESPUÉS de la validación del DTO
          if (eventoDTO.ubicacion_geo && eventoDTO.ubicacion_geo.coordinates) {
            const [lon, lat] = eventoDTO.ubicacion_geo.coordinates;
            eventoDTO.ubicacion_geo = sequelize.literal(`geometry::STGeomFromText('POINT(${lon} ${lat})', 4326)`);
          }

          // 4. Persistencia
          const eventoExistente = await EventoVialModel.findByPk(eventoDTO.codigoEvento);

          if (eventoExistente) {
            await eventoExistente.update(eventoDTO);
            // console.log(`✅ Actualizado: ${eventoDTO.codigoEvento}`);
          } else {
            await EventoVialModel.create(eventoDTO);
            // console.log(`✨ Creado: ${eventoDTO.codigoEvento}`);
          }
        } catch (error) {
          console.log(`===========================================`);
          console.log(`❌ FALLO CAPTURADO EN REGISTRO: ${item.properties?.id || 'Desconocido'}`);

          // 🔥 Al separarlo por coma, Node.js imprimirá el objeto completo con todas sus propiedades ocultas
          console.log(`MOTIVO COMPLETO:`, error);

          console.log(`===========================================`);
        }
      }
      console.log("🏁 Sincronización de eventos viales finalizada.");
    } catch (error) {
      console.error("❌ Error grave en el Job:", error);
    }
  }

  iniciarMotorSimulacion() {
    console.log("🚛 Iniciando Motor de Simulación de Flota Terrestre...");

    setInterval(async () => {
      try {
        // Pega aquí exactamente el Query de la Fase 2 usando Sequelize literal o RAW
        await sequelize.query(`
            DECLARE @SegundosDeSimulacion FLOAT = 10.0; 
            DECLARE @Horas FLOAT = @SegundosDeSimulacion / 3600.0;
            DECLARE @GradosPorKm FLOAT = 1.0 / 111.32; 

            WITH Movimiento AS ( ... ) -- TODO EL QUERY
            UPDATE T SET ...
         `);
      } catch (error) {
        console.error("Error moviendo la flota:", error);
      }
    }, 10000); // 10000 milisegundos = 10 segundos
  }

  _mapearEventoVial(item) {
    const props = item.properties || {};

    // iconCategory es el código numérico que manda TomTom
    const categoria = props.iconCategory || 0;
    const magnitud = props.magnitudeOfDelay || 0;

    const coords = item.geometry?.coordinates;
    const puntoInicial = Array.isArray(coords[0]) ? coords[0] : coords;
    const lon = puntoInicial[0];
    const lat = puntoInicial[1];

    // 1. CLASIFICACIÓN CORREGIDA DE TOMTOM
    let tipoEventoMapeado = 'ALERTA_VIAL';

    switch (categoria) {
      case 1:
        tipoEventoMapeado = 'ACCIDENTE';
        break;
      case 6: // <--- ¡AQUÍ ESTABA EL ERROR! Ahora sí es Congestión
        tipoEventoMapeado = 'CONGESTION';
        break;
      case 8:
      case 9:
        tipoEventoMapeado = 'CIERRE_VIAL';
        break;
      case 11:
        tipoEventoMapeado = 'MANTENIMIENTO_OBRA';
        break;
      case 2:
      case 3:
      case 4:
      case 5:
        tipoEventoMapeado = 'ALERTA_CLIMATICA';
        break;
      case 14:
        tipoEventoMapeado = 'VEHICULO_AVERIDADO';
        break;
      default:
        tipoEventoMapeado = 'ALERTA_VIAL';
    }

    // 2. Cálculo de severidad
    let severidadMapeada = 1;
    if (magnitud >= 3) severidadMapeada = 3;
    else if (magnitud === 2) severidadMapeada = 2;

    const corredorPorDefecto = 'Buga - Buenaventura';
    let descripcionLugar = props.from ? `De ${props.from} a ${props.to || ''}` : 'Sector Georreferenciado';

    let descripcionLimpia = 'Novedad vial reportada.';
    if (props.events && props.events.length > 0) {
      descripcionLimpia = props.events.map(e => e.description).join(' | ').substring(0, 4000);
    }

    return {
      // 🟢 1. Enviamos idExterno como lo pide el DTO
      idExterno: props.id || Buffer.from(`${lon}-${lat}-${Date.now()}-${Math.random()}`).toString('base64').substring(0, 36),
      codigoEvento: props.id || Buffer.from(`${lon}-${lat}-${Date.now()}-${Math.random()}`).toString('base64').substring(0, 36), // Dejamos este por si el modelo Sequelize lo usa
      corredorVial: corredorPorDefecto,
      sector: descripcionLugar.substring(0, 100),
      tipoEvento: tipoEventoMapeado,
      descripcion: descripcionLimpia,
      nivelSeveridad: severidadMapeada,
      estadoEvento: 'ACTIVO',
      ubicacion_geo: (lat && lon) ? { type: 'Point', coordinates: [lon, lat] } : null,

      // 🟢 2. Corregimos el error tipográfico: fechaInicio con "I" mayúscula
      fechaInicio: props.startTime ? new Date(props.startTime).toISOString() : new Date().toISOString(),
      fechaFin: props.endTime ? new Date(props.endTime).toISOString() : null
    };
  }
}

module.exports = new SincronizacionService();