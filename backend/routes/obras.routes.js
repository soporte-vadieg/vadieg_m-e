const express = require('express');
const router = express.Router();
const { listarObras } = require('../controllers/obras.controller');

router.get('/', listarObras);
// 👇 alias para compatibilidad con el frontend
router.get('/lista', listarObras);

module.exports = router;
