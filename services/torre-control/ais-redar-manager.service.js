const WebSocket = require('ws');
const { TCLAisUltimaPosicion } = require('../../models');

// Diccionario de Bounding Boxes por puerto
const BBOX_PUERTOS = {
  'BUENAVENTURA': [[3.75, -77.15], [3.95, -76.95]],
  'CARTAGENA': [[10.25, -75.65], [10.45, -75.45]],
  'SANTAMARTA': [[11.15, -74.30], [11.35, -74.10]],
  'BARRANQUILLA': [[10.95, -74.90], [11.15, -74.70]]
};

class AisRadarManager {
  constructor() {
    this.socket = null;
    this.apiKey = process.env.AISSTREAM_API_KEY || 'TU_API_KEY_DE_AISSTREAM';
    this.currentPuerto = null;
  }

  cambiarPuerto(puertoId) {
    const bbox = BBOX_PUERTOS[puertoId];
    if (!bbox) {
      throw new Error(`El puerto '${puertoId}' no tiene un BBOX configurado.`);
    }

    // Si ya hay una conexión abierta, la terminamos limpiamente antes de cambiar
    if (this.socket) {
      console.log(`🔄 Cerrando conexión anterior del radar...`);
      this.socket.terminate();
      this.socket = null;
    }

    this.currentPuerto = puertoId;
    console.log(`📡 Abriendo radar de Aisstream para el puerto: ${puertoId.toUpperCase()}`);

    this.socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

    this.socket.onopen = () => {
      console.log(`✅ Conectado exitosamente. Suscribiendo al BBOX de ${puertoId}...`);
      const subscriptionMessage = {
        APIKey: this.apiKey,
        BoundingBoxes: [bbox],
        FilterMessageTypes: ["PositionReport"]
      };
      this.socket.send(JSON.stringify(subscriptionMessage));
    };

    this.socket.onmessage = (event) => {
      const aisMessage = JSON.parse(event.data);

      if (aisMessage.MessageType === "PositionReport") {
        const reporte = aisMessage.Message.PositionReport;
        const metadatos = aisMessage.MetaData;

        const datosNave = {
          mmsi: metadatos.MMSI,
          nombre: metadatos.ShipName ? metadatos.ShipName.trim() : 'DESCONOCIDO',
          latitud: reporte.Latitude,
          longitud: reporte.Longitude,
          velocidad: reporte.Sog,
          rumbo: reporte.Cog,
          timestamp: metadatos.time_utc
        };

        console.log(`🚢 [${puertoId.toUpperCase()}] ${datosNave.nombre} | Lat: ${datosNave.latitud}, Lon: ${datosNave.longitud}`);

        guardarOActualizarPosicionEnDB(datosNave);
      }
    };

    this.socket.onerror = (error) => {
      console.error(`❌ Error en el WebSocket de Aisstream:`, error.message);
    };

    this.socket.onclose = () => {
      console.log(`⚠️ Conexión WebSocket cerrada para ${puertoId}.`);
    };
  }


  async guardarOActualizarPosicionEnDB(datosNave) {
    try {
      await TCLAisUltimaPosicion.upsert({
        mmsi: datosNave.mmsi,
        nombre_motonave: datosNave.nombre,
        latitud: datosNave.latitud,
        longitud: datosNave.longitud,
        velocidad: datosNave.velocidad,
        rumbo: datosNave.rumbo,
        destino: '',
        estado_inferido: '',
        codigoUsuarioCreacion: 'ADMIN_SYSTEM',
        fechaCreacion: new Date().toISOString(),
        codigoUsuarioModificacion: 'ADMIN_SYSTEM',
        fechaModificacion: new Date().toISOString()
      });

      console.log(`💾 [DB] Posición actualizada para: ${datosNave.nombre} (MMSI: ${datosNave.mmsi})`);
    } catch (error) {
      console.error(`❌ Error al guardar en TCLAisUltimaPosicion:`, error.message);
    }
  }
}

// Exportamos una instancia única (Singleton)
module.exports = new AisRadarManager();