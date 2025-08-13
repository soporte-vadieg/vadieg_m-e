const db = require('../db');

// Crear parte diario (cabecera)
exports.crearParte = async (req, res) => {
  const { usuario_id, obra_id, equipo_id, horometro_inicio, observaciones } = req.body;

  try {
    const [resultado] = await db.execute(
      `INSERT INTO partes_diarios (usuario_id, obra_id, equipo_id, horometro_inicio, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, obra_id, equipo_id, horometro_inicio, observaciones]
    );
    res.status(201).json({ id: resultado.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear parte' });
  }
};

// Agregar detalle
exports.agregarDetalle = async (req, res) => {
  const { parte_id } = req.params;
  const { hora, horometro_km, tarea_id } = req.body;

  try {
    await db.execute(
      `INSERT INTO detalle_partes_diarios (parte_id, hora, horometro_km, tarea_id)
       VALUES (?, ?, ?, ?)`,
      [parte_id, hora, horometro_km, tarea_id]
    );
    res.status(201).json({ mensaje: 'Detalle agregado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar detalle' });
  }
};

// Listar tareas
exports.listarTareas = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM tareas ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar tareas' });
  }
};

// Listar Partes
exports.listaPartes = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM partes_diarios ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar partes' });
  }
};
exports.listaTareasPorParte = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT d.id,
              d.parte_id,
              d.tarea_id,
              t.nombre        AS nombre,
              d.hora,
              d.horometro_km
       FROM detalle_partes_diarios d
       LEFT JOIN tareas t ON t.id = d.tarea_id
       WHERE d.parte_id = ?
       ORDER BY d.id`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar tareas del parte' });
  }
};