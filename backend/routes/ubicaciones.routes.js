// routes/ubicaciones.routes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Crear ubicación
router.post('/', async (req, res) => {
  const { entity, entity_id, lat, lng, precision_m, fuente = 'gps', usuario_id } = req.body;
  if (!entity || !entity_id || lat == null || lng == null) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const [r] = await db.execute(
      `INSERT INTO ubicaciones (entity, entity_id, usuario_id, lat, lng, precision_m, fuente)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entity, entity_id, usuario_id || null, lat, lng, precision_m || null, fuente]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear ubicación' });
  }
});

// Listar ubicaciones por entidad
router.get('/', async (req, res) => {
  const { entity, entity_id, limit = 50 } = req.query;
  if (!entity || !entity_id) return res.status(400).json({ error: 'entity y entity_id son requeridos' });
  try {
    const [rows] = await db.execute(
      `SELECT * FROM ubicaciones
       WHERE entity = ? AND entity_id = ?
       ORDER BY captured_at DESC
       LIMIT ?`,
      [entity, entity_id, Number(limit)]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar ubicaciones' });
  }
});

module.exports = router;
