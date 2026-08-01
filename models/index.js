// // models/index.js
// const { sequelize } = require('../database/connection');
// const { PuertoModel } = require('./torre-control/puerto.model.js');
// const { TerminalModel } = require('./torre-control/terminal.model.js');
// const { MuelleModel } = require('./torre-control/muelle.model');
// const { EventoVialModel } = require('./torre-control/evento-vial.model.js');

// // Inicializar modelos
// const Puerto = PuertoModel(sequelize);
// const Terminal = TerminalModel(sequelize);
// const Muelle = MuelleModel(sequelize);
// const EventoVial = EventoVialModel(sequelize);

// // Definir relaciones (Los alias 'as' son vitales para el Include)
// Puerto.hasMany(Terminal, { foreignKey: 'id_puerto', as: 'terminales' });
// Terminal.belongsTo(Puerto, { foreignKey: 'id_puerto', as: 'puerto' });

// Terminal.hasMany(Muelle, { foreignKey: 'id_terminal', as: 'muelles' });
// Muelle.belongsTo(Terminal, { foreignKey: 'id_terminal', as: 'terminal' });

// module.exports = { Puerto, Terminal, Muelle, EventoVial, sequelize };

// models/index.js
const { sequelize } = require('../database/connection');
const { PuertoModel } = require('./torre-control/puerto.model.js');
const { TerminalModel } = require('./torre-control/terminal.model.js');
const { MuelleModel } = require('./torre-control/muelle.model');
const { EventoVialModel } = require('./torre-control/evento-vial.model.js');
// NUEVO: 1. Importa el modelo de la bitácora (ajusta la ruta según cómo llamaste al archivo)
const { BitacoraSincronizacionModel } = require('./torre-control/bitacora-sincronizacion.model.js');

// Inicializar modelos
const Puerto = PuertoModel(sequelize);
const Terminal = TerminalModel(sequelize);
const Muelle = MuelleModel(sequelize);
const EventoVial = EventoVialModel(sequelize);
// NUEVO: 2. Inicializa el modelo
const BitacoraSincronizacion = BitacoraSincronizacionModel(sequelize);

// Definir relaciones (Los alias 'as' son vitales para el Include)
Puerto.hasMany(Terminal, { foreignKey: 'id_puerto', as: 'terminales' });
Terminal.belongsTo(Puerto, { foreignKey: 'id_puerto', as: 'puerto' });

Terminal.hasMany(Muelle, { foreignKey: 'id_terminal', as: 'muelles' });
Muelle.belongsTo(Terminal, { foreignKey: 'id_terminal', as: 'terminal' });

// NUEVO: 3. Añade BitacoraSincronizacion al export
module.exports = { Puerto, Terminal, Muelle, EventoVial, BitacoraSincronizacion, sequelize };