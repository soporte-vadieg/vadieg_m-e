const db = require('../db');

exports.listarTareas = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nombre FROM tareas ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};
