
/*
    Author: German Dario Valencia Salazar
    Pattern: QPLUS Repository Pattern - Flota Terrestre
    Optimización: Conversión Grados a Metros (111320.0) en Geocercas
*/
const { sequelize } = require('../../models');

class FlotaTerrestreRepository {

  // 1. Obtiene los datos crudos para el mapa
  async obtenerDatosGeograficosFlota() {
    const query = `
      SELECT 
        id AS _id, 
        placa, 
        modelo, 
        tipo_camion, 
        estado_camion, 
        velocidad,
        ubicacion_geo.STX AS lon,
        ubicacion_geo.STY AS lat
      FROM TCL_CamionesOperaciones WITH(NOLOCK)
      WHERE ubicacion_geo IS NOT NULL
    `;
    try {
      const [resultados] = await sequelize.query(query);
      return resultados || [];
    } catch (error) {
      console.error('❌ [ERROR DATOS FLOTA]:', error?.message);
      return [];
    }
  }

  // 2. Detectar eventos con la corrección de Grados
  async detectarEventosGeocerca(offset = 0, batchSize = 1000) {
    const query = `
        WITH Lote AS (
            SELECT placa, ubicacion_geo 
            FROM TCL_CamionesOperaciones WITH(NOLOCK)
            WHERE estado_camion = 'EN_RUTA' AND ubicacion_geo IS NOT NULL
            ORDER BY id ASC
            OFFSET ${offset} ROWS FETCH NEXT ${batchSize} ROWS ONLY
        )
        SELECT T.placa, G.nombre_faro AS Lugar, G.tipo_faro AS tipo, GETDATE() AS FechaEvento
        FROM Lote T
        INNER JOIN T_Maestro_Geocercas G WITH(NOLOCK) 
            -- 🟢 CORRECCIÓN: (radio / 111320.0) convierte metros a grados en planicies
            ON T.ubicacion_geo.STDistance(G.geometria_ubicacion) <= (G.radio_metros / 111320.0)
        WHERE G.estado = 1;
    `;
    try {
      const [eventos] = await sequelize.query(query);
      return eventos || [];
    } catch (error) {
      console.error('❌ [ERROR DETECTAR GEOCERCAS]:', error?.message || error);
      return [];
    }
  }

  // 3. Ejecuta la simulación matemática en SQL Server (Ya no dará Timeout)
  async ejecutarMotorVectorial(offset, batchSize) {
    const sqlQuery = `
        SET NOCOUNT ON;

        DECLARE @LoteCamiones TABLE (
            id NVARCHAR(50), 
            placa VARCHAR(50),
            ubicacion_geo geometry,
            punto_destino geometry,
            velocidad FLOAT
        );

        INSERT INTO @LoteCamiones (id, placa, ubicacion_geo, punto_destino, velocidad)
        SELECT id, placa, ubicacion_geo, punto_destino, velocidad
        FROM TCL_CamionesOperaciones WITH (ROWLOCK, READPAST)
        WHERE estado_camion = 'EN_RUTA' 
          AND ubicacion_geo IS NOT NULL 
          AND punto_destino IS NOT NULL
        ORDER BY id ASC
        OFFSET ${offset} ROWS FETCH NEXT ${batchSize} ROWS ONLY;

        UPDATE T
        SET
            ubicacion_geo = CASE
                WHEN (T.velocidad * 0.000556 * 0.008983) >= SQRT(SQUARE(T.punto_destino.STX - T.ubicacion_geo.STX) + SQUARE(T.punto_destino.STY - T.ubicacion_geo.STY)) 
                     THEN T.punto_destino
                WHEN ViaCercana.PuntoAsfalto IS NOT NULL THEN ViaCercana.PuntoAsfalto
                ELSE ISNULL(geometry::Point(
                    T.ubicacion_geo.STX + ( (T.punto_destino.STX - T.ubicacion_geo.STX) / NULLIF(SQRT(SQUARE(T.punto_destino.STX - T.ubicacion_geo.STX) + SQUARE(T.punto_destino.STY - T.ubicacion_geo.STY)), 0) ) * (T.velocidad * 0.000556 * 0.008983),
                    T.ubicacion_geo.STY + ( (T.punto_destino.STY - T.ubicacion_geo.STY) / NULLIF(SQRT(SQUARE(T.punto_destino.STY - T.ubicacion_geo.STY)), 0) ) * (T.velocidad * 0.000556 * 0.008983),
                    4326), T.ubicacion_geo)
            END,
            estado_camion = 'EN_RUTA',
            velocidad = 60
        FROM TCL_CamionesOperaciones T
        INNER JOIN @LoteCamiones LC ON T.id = LC.id
        OUTER APPLY (
            SELECT TOP 1 T.ubicacion_geo.ShortestLineTo(R.geometria_via).STEndPoint() AS PuntoAsfalto
            FROM TCL_RedVial R WITH(INDEX(IX_RedVial_Geometria), ROWLOCK, READPAST)
            WHERE R.geometria_via.STDistance(T.ubicacion_geo) < 0.0005
            ORDER BY R.geometria_via.STDistance(T.ubicacion_geo) ASC
        ) ViaCercana;

        INSERT INTO TCL_HistoricoEventos (placa, id_geocerca, tipo_evento)
        SELECT LC.placa, G.id_geocerca, 'ENTRADA'
        FROM @LoteCamiones LC
        -- 🟢 CORRECCIÓN DE UNIDADES AQUÍ TAMBIÉN
        INNER JOIN T_Maestro_Geocercas G ON LC.ubicacion_geo.STDistance(G.geometria_ubicacion) <= (G.radio_metros / 111320.0)
        WHERE G.estado = 1 AND NOT EXISTS (
            SELECT 1 FROM TCL_HistoricoEventos H 
            WHERE H.placa = LC.placa 
              AND H.id_geocerca = G.id_geocerca 
              AND H.fecha_evento > DATEADD(minute, -30, GETDATE())
        );

        SELECT @@ROWCOUNT AS FilasMovidas;
    `;

    try {
      const resultados = await sequelize.query(sqlQuery, { timeout: 60000 });
      if (resultados && Array.isArray(resultados) && resultados[0]) {
        return resultados;
      }
      return [[{ FilasMovidas: 0 }]];
    } catch (error) {
      console.error('❌ [ERROR MOTOR SQL - Lote ' + offset + ']:', error?.message || error);
      return [[{ FilasMovidas: 0 }]];
    }
  }

  // 4. KPIs Corregidos: Enviamos el radio real y filtramos camiones únicos
  async obtenerGeocercasConKPIs() {
    const query = `
      SELECT 
          g.id_geocerca, 
          g.nombre_faro, 
          g.radio_metros,
          g.tipo_faro,
          g.geometria_ubicacion.STAsText() as wkt,
          
          -- KPIs Terrestres
          ISNULL(kpi_camiones.total_camiones, 0) as total_camiones,
          ISNULL(kpi_camiones.en_ruta, 0) as camiones_ruta,
          ISNULL(kpi_camiones.detenidos, 0) as camiones_detenidos,
          
          -- KPIs Marítimos
          ISNULL(kpi_naves.total_naves, 0) as total_naves,
          ISNULL(kpi_naves.fondeadas, 0) as naves_fondeadas,
          ISNULL(kpi_naves.avisadas, 0) as naves_avisadas,
          ISNULL(kpi_naves.arribadas, 0) as naves_arribadas,
          
          CASE 
              WHEN (ISNULL(kpi_camiones.total_camiones, 0) + ISNULL(kpi_naves.total_naves, 0)) > 50 THEN 'ROJO'
              WHEN (ISNULL(kpi_camiones.total_camiones, 0) + ISNULL(kpi_naves.total_naves, 0)) > 20 THEN 'AMARILLO'
              ELSE 'VERDE'
          END as estado_kpi

      FROM T_Maestro_Geocercas g WITH(NOLOCK)
      
      -- 🚛 1. BÚSQUEDA TERRESTRE
      OUTER APPLY (
          SELECT 
              COUNT(DISTINCT c.placa) as total_camiones,
              SUM(CASE WHEN c.estado_camion = 'EN_RUTA' THEN 1 ELSE 0 END) as en_ruta,
              SUM(CASE WHEN c.estado_camion != 'EN_RUTA' THEN 1 ELSE 0 END) as detenidos
          FROM TCL_CamionesOperaciones c WITH(NOLOCK) 
          WHERE c.ubicacion_geo IS NOT NULL 
          AND c.ubicacion_geo.STDistance(g.geometria_ubicacion) <= (g.radio_metros / 111320.0) 
      ) kpi_camiones
      
      -- 🚢 2. BÚSQUEDA MARÍTIMA (CRUCE DE PERFIL + POSICIÓN AIS)
      OUTER APPLY (
          SELECT 
              COUNT(DISTINCT ais.mmsi) as total_naves,
              SUM(CASE WHEN perfiles.estado_nave = 'FONDEADAS' THEN 1 ELSE 0 END) as fondeadas,
              SUM(CASE WHEN perfiles.estado_nave = 'AVISADAS' THEN 1 ELSE 0 END) as avisadas,
              SUM(CASE WHEN perfiles.estado_nave = 'ARRIBADAS' THEN 1 ELSE 0 END) as arribadas
          FROM TCLAisUltimaPosicion ais WITH(NOLOCK)
          LEFT JOIN (
              SELECT motonave, 'AVISADAS' as estado_nave FROM TLCNaves_Avisadas WITH(NOLOCK)
              UNION ALL
              SELECT motonave, 'FONDEADAS' as estado_nave FROM TLCNaves_Fondeadas WITH(NOLOCK)
              UNION ALL
              SELECT motonave, 'ARRIBADAS' as estado_nave FROM TLCNaves_Arribadas WITH(NOLOCK)
              UNION ALL
              SELECT motonave, 'ZARPADAS' as estado_nave FROM TLCNaves_Zarpadas WITH(NOLOCK)
          ) perfiles 
          -- 🔥 Blindaje contra nombres nulos o espacios en blanco
          ON LTRIM(RTRIM(UPPER(ISNULL(ais.nombre_motonave, '')))) = LTRIM(RTRIM(UPPER(ISNULL(perfiles.motonave, ''))))
          
          -- 🔥 Blindaje vital: Ignorar naves sin coordenadas antes de armar el Point
          WHERE ais.latitud IS NOT NULL AND ais.longitud IS NOT NULL
          AND geometry::Point(ais.longitud, ais.latitud, 4326).STDistance(g.geometria_ubicacion) <= (g.radio_metros / 111320.0)
      ) kpi_naves
      
      WHERE g.estado = 1;
    `;

    try {
      const [resultados] = await sequelize.query(query);
      return resultados || [];
    } catch (error) {
      console.error('❌ [ERROR KPIs GEOCERCAS]:', error?.message || error);
      return [];
    }
  }

  async obtenerGeocercasMaritimas() {
    const query = `
      SELECT id_geocerca, nombre_faro, radio_metros, 
             geometria_ubicacion.STAsText() as wkt
      FROM T_Maestro_Geocercas WITH(NOLOCK)
      WHERE tipo_faro = 'MARITIMA' AND estado = 1;
    `;
    const [resultados] = await sequelize.query(query);
    return resultados;
  }

  async upsertPosicion(dtoData) {
    return await sequelize.models.TCL_CamionesOperaciones.upsert(dtoData);
  }
}

module.exports = new FlotaTerrestreRepository();