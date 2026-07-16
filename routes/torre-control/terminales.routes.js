const express = require('express');
const router = express.Router();
const { validarJWT } = require("../../middlewares/validar-jwt");
// Asegúrate de que la ruta del require apunte correctamente a tu controlador
const {
  getTerminales,
  getTerminalById,
  crearTerminal,
  updateTerminal,
  deleteTerminal
} = require('../../controllers/torre-control/terminales.controller');

// Aquí es donde te estaba fallando (probablemente en el getTerminales o getTerminalById)
router.get('/', getTerminales);
router.get('/:id_terminal', getTerminalById);
router.post('/', crearTerminal);
router.put('/:id_terminal', updateTerminal);
router.delete('/:id_terminal', deleteTerminal);

module.exports = router;
