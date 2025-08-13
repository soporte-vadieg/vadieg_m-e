// controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const os = require('os');

// --- helpers de logging ---
const getClientIp = (req) => {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
};

const logUserEvent = async (req, {
  event,               // 'login' | 'failed_login' | 'register' | 'register_failed' | etc
  status = null,
  userId = null,
  username = null,
  extra = {}
}) => {
  try {
    await pool.execute(
      `INSERT INTO user_logs
       (created_at, user_id, username, event, method, route, status,
        ip, host_header, user_agent, referer, x_request_id, extra)
       VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username,
        event,
        req.method || 'N/A',
        (req.baseUrl || '') + (req.path || ''),   // ej: /api/login
        status,
        getClientIp(req),
        req.get('host') || null,
        req.get('user-agent') || null,
        req.get('referer') || null,
        req.get('x-request-id') || null,
        JSON.stringify({
          ...extra,
          server_hostname: os.hostname(),
          client_hostname: req.get('x-client-hostname') || null, // opcional si lo mandás desde el front
        })
      ]
    );
  } catch (e) {
    console.error('❌ Error guardando user_log 1:', e.message);
  }
};

// --- controladores ---
const registrarUsuario = async (req, res) => {
  const { full_name, username, email, password, role = 'user' } = req.body;

  if (!full_name || !username || !email || !password) {
    await logUserEvent(req, {
      event: 'register_failed',
      status: 400,
      username,
      extra: { reason: 'missing_fields' }
    });
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const [existente] = await pool.execute(
      'SELECT 1 FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existente.length > 0) {
      await logUserEvent(req, {
        event: 'register_failed',
        status: 400,
        username,
        extra: { reason: 'duplicate_user_or_email' }
      });
      return res.status(400).json({ error: 'El usuario o el email ya existen' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [resultado] = await pool.execute(
      `INSERT INTO usuarios (full_name, username, email, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, username, email, hashedPassword, role]
    );

    await logUserEvent(req, {
      event: 'register',
      status: 201,
      userId: resultado.insertId,
      username,
      extra: { role }
    });

    res.status(201).json({
      message: 'Usuario creado correctamente',
      usuarioId: resultado.insertId
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    await logUserEvent(req, {
      event: 'register_failed',
      status: 500,
      username,
      extra: { reason: 'server_error' }
    });
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const loginUsuario = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      await logUserEvent(req, {
        event: 'failed_login',
        status: 401,
        username,
        extra: { reason: 'user_not_found' }
      });
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = rows[0];
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      await logUserEvent(req, {
        event: 'failed_login',
        status: 401,
        userId: usuario.id,
        username,
        extra: { reason: 'bad_password' }
      });
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // 🔐 Token
    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    await logUserEvent(req, {
      event: 'login',
      status: 200,
      userId: usuario.id,
      username: usuario.username,
      extra: { role: usuario.role }
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        full_name: usuario.full_name,
        username: usuario.username,
        role: usuario.role,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    await logUserEvent(req, {
      event: 'failed_login',
      status: 500,
      username,
      extra: { reason: 'server_error' }
    });
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, full_name, username, email, role
      FROM usuarios
      ORDER BY username ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarios
};
