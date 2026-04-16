const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET todas as matérias-primas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materia_prima ORDER BY descricao ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar matérias-primas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET uma matéria-prima
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM materia_prima WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST criar matéria-prima
router.post('/', async (req, res) => {
  try {
    const { descricao, largura, comprimento, espessura, quantidade, estoque_minimo, estoque_maximo } = req.body;

    if (!descricao || largura == null || comprimento == null || espessura == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: descricao, largura, comprimento, espessura' });
    }

    const result = await pool.query(
      `INSERT INTO materia_prima (descricao, largura, comprimento, espessura, quantidade, estoque_minimo, estoque_maximo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [descricao, largura, comprimento, espessura, quantidade || 0, estoque_minimo || 0, estoque_maximo || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma matéria-prima com essa descrição e dimensões' });
    }
    console.error('Erro ao criar matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT atualizar matéria-prima
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, largura, comprimento, espessura, estoque_minimo, estoque_maximo } = req.body;

    if (!descricao || largura == null || comprimento == null || espessura == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: descricao, largura, comprimento, espessura' });
    }

    const result = await pool.query(
      `UPDATE materia_prima
       SET descricao = $1, largura = $2, comprimento = $3, espessura = $4,
           estoque_minimo = $5, estoque_maximo = $6
       WHERE id = $7
       RETURNING *`,
      [descricao, largura, comprimento, espessura, estoque_minimo || 0, estoque_maximo || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma matéria-prima com essa descrição e dimensões' });
    }
    console.error('Erro ao atualizar matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE eliminar matéria-prima
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM materia_prima WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    res.json({ message: 'Matéria-prima eliminada com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
