// middleware/logUsuarios.js
const crypto = require('crypto');

const getClientIp = (req) => {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
};

module.exports = function logUsuarios(pool) {
  return (req, res, next) => {
    const startNs = process.hrtime.bigint();

    // request id
    const xreqid = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-Id', xreqid);

    res.on('finish', async () => {
      try {
        // evitar ruido
        if (req.method === 'OPTIONS' || res.statusCode === 304) return;

        // 👇 SIEMPRE declarar user; si no hay verifyToken, queda {}
        const user = req.user || {};

        const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
        const queryKeys = Object.keys(req.query || {});
        const bodyKeys  = Object.keys(req.body || {}).filter(k => k !== 'password');

        await pool.execute(
          `INSERT INTO user_logs
             (user_id, username, event, method, route, status, response_time_ms,
              ip, host_header, user_agent, referer, x_request_id, extra)
           VALUES (?, ?, 'request', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id || null,
            user.username || null,
            req.method,
            req.originalUrl || (req.baseUrl || '') + (req.path || ''),
            res.statusCode,
            Math.round(durationMs),
            getClientIp(req),
            req.get('host') || null,
            req.get('user-agent') || null,
            req.get('referer') || null,
            xreqid,
            JSON.stringify({ queryKeys, bodyKeys })
          ]
        );
      } catch (e) {
        console.error('Error guardando user_log:', e.message);
      }
    });

    next();
  };
};
