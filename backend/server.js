const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');
const logUsuarios = require('./middleware/logUsuarios');

// Rutas
const usuariosRoutes = require('./routes/usuarios.routes');
const ordenesRoutes = require('./routes/ordenes.routes');
const partesRoutes = require('./routes/partes.routes');
const tareasRoutes = require('./routes/tareas.routes');
const authRoutes = require('./routes/auth.routes');
const obrasRoutes = require('./routes/obras.routes');
const equiposRoutes = require('./routes/equipos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const ubicacionesRoutes = require('./routes/ubicaciones.routes');

const app = express();

// 👇 orden correcto
app.set('trust proxy', 1);
app.set('etag', false);
app.use(cors());
app.use(express.json());

// 👇 el logger debe ir ANTES de las rutas
app.use(logUsuarios(pool));
app.use('/api', (req,res,next)=>{ res.set('Cache-Control','no-store'); next(); });
// (opcional) healthcheck rápido
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/_test-log', async (req, res) => {
  try {
    await pool.execute(
      `INSERT INTO user_logs (event, method, route, status, ip)
       VALUES ('request','GET','/_test-log',200, ?)`,
      [(req.headers['x-forwarded-for']?.split(',')[0].trim()) || req.socket?.remoteAddress || null]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rutas principales de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/partes', partesRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api', authRoutes); // login y registro
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
