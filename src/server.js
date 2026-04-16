const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pool = require('./db');
const materiasPrimasRouter = require('./routes/materiasPrimas');
const stocksRouter = require('./routes/stocks');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kaizenappfrontend-production-24ae.up.railway.app',
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/materias-primas', materiasPrimasRouter);
app.use('/api/stocks', stocksRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'ERROR', db: 'disconnected' });
  }
});

// Inicializa a base de dados (cria tabelas se não existirem)
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'migrations', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Base de dados inicializada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar base de dados:', error.message);
    console.error('Certifique-se que o PostgreSQL está a correr e o ficheiro .env está configurado.');
  }
}

app.listen(PORT, async () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
  await initDatabase();
});
