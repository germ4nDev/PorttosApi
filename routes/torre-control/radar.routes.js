const express = require('express');
const router = express.Router();
const { validarJWT } = require("../../middlewares/validar-jwt");

const radarController = require('../../controllers/torre-control/radar.controller');

router.post('/foco/:id', radarController.cambiarFocoRadar);

module.exports = router;