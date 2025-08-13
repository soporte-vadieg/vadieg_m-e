const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/auth');

router.get('/', verificarToken, async (req, res) => {
  try {
    const { fecha, obra_id, equipo_id } = req.query;

    const condiciones = [];
    const valores = [];

    if (fecha) { condiciones.push('DATE(p.fecha) = ?'); valores.push(fecha); }
    if (obra_id) { condiciones.push('p.obra_id = ?'); valores.push(obra_id); }
    if (equipo_id) { condiciones.push('p.equipo_id = ?'); valores.push(equipo_id); }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Órdenes
    const [[ordenes]] = await pool.execute(`
      SELECT
        COUNT(*) AS totalOrdenes,
        COALESCE(SUM(estado = 'abierta'),0) AS abiertas,
        COALESCE(SUM(estado = 'pausada'),0) AS pausadas,
        COALESCE(SUM(estado = 'cerrada'),0) AS cerradas
      FROM ordenes_servicio
    `);

    const [[usuarios]] = await pool.execute(`SELECT COUNT(*) AS totalUsuarios FROM usuarios`);

    const [ultimasOrdenes] = await pool.execute(`
      SELECT o.id, o.descripcion, o.hora_inicio, o.estado, u.username AS usuario, ob.nombre_obra
      FROM ordenes_servicio o
      JOIN usuarios u ON o.usuario_id = u.id
      JOIN obras ob ON o.obra_id = ob.id
      ORDER BY o.id DESC
      LIMIT 20
    `);

    const [rankingUsuarios] = await pool.execute(`
      SELECT u.username, COUNT(*) AS cantidad
      FROM ordenes_servicio o
      JOIN usuarios u ON o.usuario_id = u.id
      GROUP BY o.usuario_id
      ORDER BY cantidad DESC
      LIMIT 3
    `);

    const [[tiempoPromedio]] = await pool.execute(`
      SELECT COALESCE(ROUND(AVG(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin))),0) AS minutos
      FROM ordenes_servicio
      WHERE estado = 'cerrada' AND hora_fin IS NOT NULL
    `);

    // Partes diarios
    const [ultimosPartes] = await pool.execute(
      `
      SELECT
        p.id,
        DATE(p.fecha) AS fecha,
        u.full_name,
        o.nombre_obra,
        e.nombre_equipo,
        ub.lat  AS ubic_lat,
        ub.lng  AS ubic_lng,
        ub.precision_m AS ubic_precision_m,
        ub.fuente      AS ubic_fuente,
        ub.captured_at AS ubic_captured_at,
        CASE
          WHEN ub.lat IS NULL OR ub.lng IS NULL THEN NULL
          ELSE JSON_OBJECT(
            'lat', ub.lat,
            'lng', ub.lng,
            'precision_m', ub.precision_m,
            'fuente', ub.fuente,
            'captured_at', ub.captured_at
          )
        END AS ubicacion,
        CASE
          WHEN ub.lat IS NULL OR ub.lng IS NULL THEN NULL
          ELSE CONCAT(ub.lat, ', ', ub.lng)
        END AS ubicaciones
      FROM partes_diarios p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN obras o    ON p.obra_id    = o.id
      JOIN equipos e  ON p.equipo_id  = e.id
      LEFT JOIN (
        SELECT u1.*
        FROM ubicaciones u1
        JOIN (
          SELECT entity_id, MAX(captured_at) AS max_cap
          FROM ubicaciones
          WHERE entity = 'parte'
          GROUP BY entity_id
        ) last
          ON last.entity_id = u1.entity_id
         AND last.max_cap   = u1.captured_at
        WHERE u1.entity = 'parte'
      ) ub ON ub.entity_id = p.id
      ${where}
      ORDER BY p.id DESC
      LIMIT 10;
      `,
      valores
    );

    const [rankingEquipos] = await pool.execute(`
      SELECT e.nombre_equipo, COUNT(*) AS cantidad
      FROM partes_diarios p
      JOIN equipos e ON p.equipo_id = e.id
      ${where}
      GROUP BY p.equipo_id
      ORDER BY cantidad DESC
      LIMIT 3
    `, valores);

    const [cantidadPorObra] = await pool.execute(`
      SELECT ob.nombre_obra, COUNT(*) AS cantidad
      FROM partes_diarios p
      JOIN obras ob ON p.obra_id = ob.id
      ${where}
      GROUP BY p.obra_id
      ORDER BY cantidad DESC
    `, valores);

    const [[promedioTareas]] = await pool.execute(`
      SELECT COALESCE(ROUND(AVG(cantidad)),0) AS promedio
      FROM (
        SELECT COUNT(*) AS cantidad
        FROM detalle_partes_diarios
        GROUP BY parte_id
      ) AS sub
    `);

    res.json({
      ...ordenes,
      totalUsuarios: usuarios.totalUsuarios || 0,
      ultimasOrdenes,
      rankingUsuarios,
      tiempoPromedio: tiempoPromedio?.minutos ?? 0,
      ultimosPartes,
      rankingEquipos,
      cantidadPorObra,
      promedioTareas: promedioTareas?.promedio ?? 0
    });

  } catch (error) {
    console.error('Error en dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
