const express = require('express');
const router = express.Router();
const { listarTareas } = require('../controllers/tareas.controller');

router.get('/', listarTareas);
module.exports = router;
