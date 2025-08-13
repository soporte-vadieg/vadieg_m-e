const express = require('express');
const router = express.Router();
const {
  listarEquipos,
  listarTiposEquipos,
  obtenerEquipoPorId
} = require('../controllers/equipos.controller');

router.get('/', listarEquipos);
// 👇 alias para compatibilidad con el frontend
router.get('/lista', listarEquipos);

router.get('/tipos', listarTiposEquipos);
router.get('/:id', obtenerEquipoPorId);

module.exports = router;
