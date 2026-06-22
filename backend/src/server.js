const criarApp = require('./app');
const { initSchema, seed } = require('./db/database');

const PORT = process.env.PORT || 3000;

initSchema();
seed();

const app = criarApp();

app.listen(PORT, () => {
  console.log(`BarberPro API rodando em http://localhost:${PORT}`);
});
