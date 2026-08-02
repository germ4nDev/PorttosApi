const db = require('../../database/connection');

class MotonavesRepository {

    // Obtiene los datos crudos de las posiciones y el cruce con DIMAR
    //   async obtenerPosicionesConDimar() {
    //     const query = `
    //         WITH DimarMaster AS (
    //             SELECT id_aviso, omi, motonave, agencia, eta, 'ARRIBADA' as estado FROM dbo.TLCNaves_Arribadas
    //             UNION ALL
    //             SELECT id_aviso, omi, motonave, agencia, eta, 'AVISADA' as estado FROM dbo.TLCNaves_Avisadas
    //             UNION ALL
    //             SELECT id_aviso, omi, motonave, agencia, eta, 'FONDEO' as estado FROM dbo.TLCNaves_Fondeo
    //             UNION ALL
    //             SELECT id_aviso, omi, motonave, agencia, eta, 'ZARPADA' as estado FROM dbo.TLCNaves_Zarpadas
    //         )
    //         SELECT 
    //             dimar.motonave,
    //             dimar.agencia,
    //             dimar.estado,
    //             dimar.eta,
    //             ais.latitud,
    //             ais.longitud,
    //             ais.velocidad,
    //             ais.estado_inferido,
    //             ais.mmsi
    //         FROM DimarMaster dimar
    //         -- 1. Homologación: Convertimos todo a VARCHAR para que coincidan
    //         LEFT JOIN dbo.TCL_Homologacion_MMSI hom ON CAST(dimar.id_aviso AS VARCHAR(20)) = CAST(hom.id_aviso AS VARCHAR(20))

    //         -- 2. Join AIS: Normalizamos el MMSI y OMI a texto para forzar el match
    //         -- Si unimos por OMI (7 dígitos):
    //         LEFT JOIN dbo.TCLAisUltimaPosicion ais ON 
    //             RIGHT('0000000' + CAST(dimar.omi AS VARCHAR(7)), 7) = 
    //             RIGHT('0000000' + CAST(ais.omi AS VARCHAR(7)), 7)

    //         WHERE (ais.latitud IS NULL OR (ais.latitud <> 0 AND ais.longitud <> 0))
    //     `;

    //     const [resultados] = await db.sequelize.query(query);
    //     return resultados;
    //   }
    // async obtenerPosicionesConDimar() {
    //     const query = `
    //     WITH DimarMaster AS (
    //         SELECT id_aviso, omi, motonave, agencia, eta, 'ARRIBADA' as estado FROM dbo.TLCNaves_Arribadas
    //         UNION ALL
    //         SELECT id_aviso, omi, motonave, agencia, eta, 'AVISADA' as estado FROM dbo.TLCNaves_Avisadas
    //         UNION ALL
    //         SELECT id_aviso, omi, motonave, agencia, eta, 'FONDEO' as estado FROM dbo.TLCNaves_Fondeo
    //         UNION ALL
    //         SELECT id_aviso, omi, motonave, agencia, eta, 'ZARPADA' as estado FROM dbo.TLCNaves_Zarpadas
    //     )
    //     SELECT 
    //         -- 1. Datos espaciales base (¡Lo vital para que el mapa dibuje el punto!)
    //         ais.mmsi,
    //         ais.latitud,
    //         ais.longitud,
    //         ais.velocidad,
    //         ais.estado_inferido,
    //         ais.rumbo, 

    //         -- 2. Enriquecimiento de datos (Prioriza el nombre de DIMAR, si no hay, usa el del AIS)
    //         COALESCE(dimar.motonave, ais.nombre_motonave) AS motonave,
    //         dimar.agencia,
    //         dimar.estado AS estado_dimar,
    //         dimar.eta,
    //         dimar.id_aviso

    //     -- TABLA PRINCIPAL: Todo lo que la antena esté viendo en este momento
    //     FROM dbo.TCLAisUltimaPosicion ais WITH(NOLOCK)

    //     -- PRIMER PUENTE: Usamos la tabla de homologación cruzando por MMSI
    //     LEFT JOIN dbo.TCL_Homologacion_MMSI hom WITH(NOLOCK) 
    //         ON CAST(ais.mmsi AS VARCHAR(20)) = CAST(hom.mmsi AS VARCHAR(20))

    //     -- SEGUNDO PUENTE: Traemos la metadata oficial de la DIMAR
    //     LEFT JOIN DimarMaster dimar 
    //         ON CAST(hom.id_aviso AS VARCHAR(20)) = CAST(dimar.id_aviso AS VARCHAR(20))
    //         OR (
    //             -- Respaldo automático: Si nadie ha homologado manualmente, intentamos cruzar por el OMI de 7 dígitos
    //             ais.omi IS NOT NULL AND 
    //             RIGHT('0000000' + CAST(dimar.omi AS VARCHAR(7)), 7) = RIGHT('0000000' + CAST(ais.omi AS VARCHAR(7)), 7)
    //         )

    //     -- FILTRO DE SEGURIDAD: Solo enviamos a Node lo que tenga coordenadas válidas
    //     WHERE ais.latitud IS NOT NULL 
    //       AND ais.latitud <> 0 
    //       AND ais.longitud <> 0;
    // `;

    //     const [resultados] = await db.sequelize.query(query);
    //     return resultados;
    // }
    async obtenerPosicionesConDimar() {
        const query = `
        WITH DimarMaster AS (
            SELECT id_aviso, omi, motonave, agencia, eta, 'ARRIBADA' as estado FROM dbo.TLCNaves_Arribadas
            UNION ALL
            SELECT id_aviso, omi, motonave, agencia, eta, 'AVISADA' as estado FROM dbo.TLCNaves_Avisadas
            UNION ALL
            SELECT id_aviso, omi, motonave, agencia, eta, 'FONDEO' as estado FROM dbo.TLCNaves_Fondeo
            UNION ALL
            SELECT id_aviso, omi, motonave, agencia, eta, 'ZARPADA' as estado FROM dbo.TLCNaves_Zarpadas
        )
        SELECT 
            ais.mmsi,
            ais.latitud AS lat,                    -- 🟢 ALIAS VITAL: Para que Node lea nave.lat
            ais.longitud AS lon,                   -- 🟢 ALIAS VITAL: Para que Node lea nave.lon
            ais.velocidad,
            ais.estado_inferido AS estadoInferido, -- 🟢 ALIAS VITAL
            ais.rumbo, 
            ais.destino,
            
            -- Prioriza el nombre de DIMAR, si no, usa el del AIS
            COALESCE(dimar.motonave, ais.nombre_motonave) AS nombreMotonave, -- 🟢 ALIAS VITAL
            dimar.agencia,
            dimar.estado AS estado_dimar,
            dimar.eta,
            dimar.id_aviso

        FROM dbo.TCLAisUltimaPosicion ais WITH(NOLOCK)
        
        LEFT JOIN dbo.TCL_Homologacion_MMSI hom WITH(NOLOCK) 
            ON CAST(ais.mmsi AS VARCHAR(20)) = CAST(hom.mmsi AS VARCHAR(20))
            
        LEFT JOIN DimarMaster dimar 
            ON CAST(hom.id_aviso AS VARCHAR(20)) = CAST(dimar.id_aviso AS VARCHAR(20))
            OR (
                ais.omi IS NOT NULL AND 
                RIGHT('0000000' + CAST(dimar.omi AS VARCHAR(7)), 7) = RIGHT('0000000' + CAST(ais.omi AS VARCHAR(7)), 7)
            )
            
        -- ⚠️ FILTRO COMENTADO: Si hay barcos, saldrán sí o sí (incluso si están en 0,0)
        -- WHERE ais.latitud IS NOT NULL AND ais.latitud <> 0 AND ais.longitud <> 0;
    `;

        const [resultados] = await db.sequelize.query(query);
        return resultados;
    }

    // Ejecuta el MERGE para guardar la homologación manual
    async guardarHomologacion(mmsi, id_aviso, nombre_referencia) {
        const query = `
            MERGE INTO dbo.TCL_Homologacion_MMSI AS target
            USING (SELECT :mmsi AS mmsi, :id_aviso AS id_aviso, :nombre_referencia AS nombre_referencia) AS source
            ON (target.mmsi = source.mmsi)
            WHEN MATCHED THEN 
                UPDATE SET id_aviso = source.id_aviso, nombre_referencia = source.nombre_referencia
            WHEN NOT MATCHED THEN
                INSERT (mmsi, id_aviso, nombre_referencia)
                VALUES (source.mmsi, source.id_aviso, source.nombre_referencia);
        `;
        await db.sequelize.query(query, {
            replacements: { mmsi, id_aviso, nombre_referencia }
        });
    }

    // Ejecuta el MERGE para registrar la última posición recibida de la antena AIS
    async upsertPosicionAis(datos) {
        const query = `
            MERGE INTO dbo.TCLAisUltimaPosicion AS target
            USING (SELECT :mmsi AS mmsi) AS source
            ON (target.mmsi = source.mmsi)
            WHEN MATCHED THEN 
                UPDATE SET 
                    latitud = :lat, 
                    longitud = :lon, 
                    velocidad = :velocidad, 
                    rumbo = :rumbo, 
                    estado_inferido = :estadoInferido, 
                    nombre_motonave = :nombre_motonave, 
                    destino = :destino,
                    codigoUsuarioModificacion = 'API_DIMAR_SYNC',
                    fechaModificacion = CONVERT(nvarchar(100), GETDATE(), 120)
            WHEN NOT MATCHED THEN
                INSERT (
                    mmsi, 
                    latitud, 
                    longitud, 
                    velocidad, 
                    rumbo, 
                    estado_inferido, 
                    nombre_motonave, 
                    destino, 
                    codigoUsuarioCreacion,
                    fechaCreacion
                )
                VALUES (
                    :mmsi, 
                    :lat, 
                    :lon, 
                    :velocidad, 
                    :rumbo, 
                    :estadoInferido, 
                    :nombre_motonave, 
                    :destino, 
                    'API_DIMAR_SYNC',
                    CONVERT(nvarchar(100), GETDATE(), 120)
                );
        `;

        await db.sequelize.query(query, {
            replacements: datos,
            type: db.sequelize.QueryTypes.UPSERT
        });
    }
}

module.exports = new MotonavesRepository();