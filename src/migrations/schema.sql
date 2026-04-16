CREATE TABLE IF NOT EXISTS materia_prima (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  largura DECIMAL(10,2) NOT NULL,
  comprimento DECIMAL(10,2) NOT NULL,
  espessura DECIMAL(10,2) NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque_maximo DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_materia_prima UNIQUE (descricao, largura, comprimento, espessura)
);

CREATE TABLE IF NOT EXISTS stocks (
  id SERIAL PRIMARY KEY,
  materia_prima_id INTEGER NOT NULL REFERENCES materia_prima(id) ON DELETE CASCADE,
  quer_reduzir BOOLEAN NOT NULL DEFAULT FALSE,
  quantidade DECIMAL(10,2) NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_quantidade_positiva CHECK (quantidade > 0)
);

CREATE INDEX IF NOT EXISTS idx_stocks_materia_prima_id ON stocks(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_stocks_data ON stocks(data DESC);
