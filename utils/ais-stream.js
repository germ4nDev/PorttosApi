const WebSocket = require('ws');

// Configuración
const API_KEY = 'TU_API_KEY_DE_AISSTREAM';
// Coordenadas aproximadas para cubrir el área marítima de Buenaventura
const BBOX = [[3.75, -77.15], [3.95, -76.95]];

function iniciarRadarPorttos() {
  console.log("📡 Conectando a la red global AIS...");
  const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

  socket.onopen = function (_) {
    console.log("✅ Conexión establecida. Suscribiendo al área de Buenaventura...");
    const subscriptionMessage = {
      APIKey: API_KEY,
      BoundingBoxes: [BBOX],
      // Filtramos solo los mensajes de posición (tipos 1, 2, 3, 18, 19)
      FilterMessageTypes: ["PositionReport"]
    };
    socket.send(JSON.stringify(subscriptionMessage));
  };

  socket.onmessage = function (event) {
    const aisMessage = JSON.parse(event.data);

    if (aisMessage.MessageType === "PositionReport") {
      const reporte = aisMessage.Message.PositionReport;
      const metadatos = aisMessage.MetaData;

      const datosNave = {
        mmsi: metadatos.MMSI,
        nombre: metadatos.ShipName ? metadatos.ShipName.trim() : 'DESCONOCIDO',
        latitud: reporte.Latitude,
        longitud: reporte.Longitude,
        velocidad: reporte.Sog, // Speed over ground
        rumbo: reporte.Cog, // Course over ground
        timestamp: metadatos.time_utc
      };

      console.log(`🚢 Nave detectada: ${datosNave.nombre} (MMSI: ${datosNave.mmsi}) | Lat: ${datosNave.latitud}, Lon: ${datosNave.longitud}`);

      // 🎯 AQUÍ ENTRA TU LÓGICA DE BASE DE DATOS
      // actualizarTablaUltimaPosicion(datosNave);
    }
  };

  socket.onerror = function (error) {
    console.error("❌ Error en el socket:", error);
  };

  socket.onclose = function () {
    console.log("⚠️ Conexión cerrada. Intentando reconectar en 5 segundos...");
    setTimeout(iniciarRadarPorttos, 5000);
  };
}

iniciarRadarPorttos();