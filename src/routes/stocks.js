const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET todas as movimentações (com filtro opcional por materia_prima_id)
router.get('/', async (req, res) => {
  try {
    const { materia_prima_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT s.id, s.materia_prima_id, s.quer_reduzir, s.quantidade, s.data,
             mp.descricao, mp.largura, mp.comprimento, mp.espessura
      FROM stocks s
      JOIN materia_prima mp ON s.materia_prima_id = mp.id
    `;
    const params = [];

    if (materia_prima_id) {
      query += ' WHERE s.materia_prima_id = $1';
      params.push(materia_prima_id);
    }

    query += ` ORDER BY s.data DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST registar movimentação (e atualiza quantidade da matéria-prima)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { materia_prima_id, quer_reduzir, quantidade } = req.body;

    if (!materia_prima_id || quer_reduzir == null || !quantidade) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Campos obrigatórios: materia_prima_id, quer_reduzir, quantidade' });
    }

    if (parseFloat(quantidade) <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'A quantidade deve ser maior que zero' });
    }

    // Bloqueia a linha para evitar race conditions
    const matResult = await client.query(
      'SELECT * FROM materia_prima WHERE id = $1 FOR UPDATE',
      [materia_prima_id]
    );

    if (matResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }

    const materia = matResult.rows[0];
    const qtdAtual = parseFloat(materia.quantidade);
    const qtdMovimento = parseFloat(quantidade);
    let novaQuantidade;

    if (quer_reduzir) {
      novaQuantidade = qtdAtual - qtdMovimento;
      if (novaQuantidade < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente. Stock atual: ${qtdAtual}`
        });
      }
    } else {
      novaQuantidade = qtdAtual + qtdMovimento;
    }

    // Atualiza quantidade da matéria-prima
    await client.query(
      'UPDATE materia_prima SET quantidade = $1 WHERE id = $2',
      [novaQuantidade, materia_prima_id]
    );

    // Regista a movimentação
    const stockResult = await client.query(
      `INSERT INTO stocks (materia_prima_id, quer_reduzir, quantidade)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [materia_prima_id, quer_reduzir, qtdMovimento]
    );

    await client.query('COMMIT');

    res.status(201).json({
      movimento: stockResult.rows[0],
      quantidade_anterior: qtdAtual,
      quantidade_atual: novaQuantidade,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registar movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

module.exports = router;
