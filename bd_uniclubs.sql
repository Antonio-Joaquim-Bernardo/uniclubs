BEGIN;

-- Clean reset so the file can be rerun during evaluation.
DROP TABLE IF EXISTS inscricoes, membro_clube, eventos, membros, clubes CASCADE;

CREATE TABLE clubes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) UNIQUE NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  objetivo TEXT,
  local_base VARCHAR(120),
  cor_primaria VARCHAR(7) NOT NULL DEFAULT '#22c55e',
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clubes_status_check CHECK (status IN ('ativo', 'pausado', 'arquivado')),
  CONSTRAINT clubes_cor_check CHECK (cor_primaria ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE membros (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  curso VARCHAR(120),
  telefone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  data_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT membros_status_check CHECK (status IN ('ativo', 'pendente', 'suspenso'))
);

CREATE TABLE membro_clube (
  id SERIAL PRIMARY KEY,
  membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  clube_id INTEGER NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
  papel VARCHAR(20) NOT NULL DEFAULT 'membro',
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT membro_clube_papel_check CHECK (papel IN ('admin_clube', 'membro')),
  CONSTRAINT membro_clube_status_check CHECK (status IN ('ativo', 'pendente', 'suspenso')),
  CONSTRAINT membro_clube_unique UNIQUE (membro_id, clube_id)
);

CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  clube_id INTEGER NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
  titulo VARCHAR(160) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  local_ev VARCHAR(120),
  capacidade_maxima INTEGER,
  categoria VARCHAR(80) NOT NULL,
  destacado BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eventos_status_check CHECK (status IN ('ativo', 'cancelado', 'finalizado')),
  CONSTRAINT eventos_capacidade_check CHECK (capacidade_maxima IS NULL OR capacidade_maxima > 0)
);

CREATE TABLE inscricoes (
  id SERIAL PRIMARY KEY,
  membro_id INTEGER NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_inscricao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inscricoes_status_check CHECK (status IN ('confirmado', 'pendente', 'cancelado')),
  CONSTRAINT inscricoes_unique UNIQUE (membro_id, evento_id)
);

CREATE INDEX idx_membro_clube_clube_status ON membro_clube (clube_id, status);
CREATE INDEX idx_membro_clube_membro_status ON membro_clube (membro_id, status);
CREATE INDEX idx_eventos_clube_status_inicio ON eventos (clube_id, status, data_inicio);
CREATE INDEX idx_eventos_status_inicio ON eventos (status, data_inicio);
CREATE INDEX idx_inscricoes_evento_status ON inscricoes (evento_id, status);
CREATE INDEX idx_inscricoes_membro_status ON inscricoes (membro_id, status);

INSERT INTO clubes (id, nome, descricao, categoria, objetivo, local_base, cor_primaria, status, criado_em) VALUES
  (
    1,
    'Clube de Tecnologia Orion',
    'Espaco para programacao, automacao, robotica e projetos digitais com impacto real no campus.',
    'Tecnologia',
    'Formar talentos e acelerar solucoes academicas.',
    'Laboratorio 3',
    '#22c55e',
    'ativo',
    NOW() - INTERVAL '90 days'
  ),
  (
    2,
    'Clube de Desporto Falcoes',
    'Treinos, torneios internos e iniciativas de bem-estar para manter a universidade em movimento.',
    'Desporto',
    'Promover saude, disciplina e espirito de equipa.',
    'Pavilhao Principal',
    '#38bdf8',
    'ativo',
    NOW() - INTERVAL '120 days'
  ),
  (
    3,
    'Clube Cultural Horizonte',
    'Musica, poesia, teatro e producoes criativas para dar palco a expressao dos estudantes.',
    'Cultura',
    'Valorizar a identidade e a criacao artistica.',
    'Auditorio B',
    '#f97316',
    'ativo',
    NOW() - INTERVAL '75 days'
  ),
  (
    4,
    'Clube de Inovacao Nexus',
    'Ideias, empreendedorismo e prototipagem para transformar problemas academicos em oportunidades.',
    'Inovacao',
    'Apoiar projectos com potencial de negocio e impacto social.',
    'Sala de Startups',
    '#a855f7',
    'ativo',
    NOW() - INTERVAL '60 days'
  );

INSERT INTO membros (id, nome, email, curso, telefone, status, data_registro) VALUES
  (1, 'Ana Paixao', 'ana@uniclubs.edu', 'Engenharia Informatica', '+244 921 000 001', 'ativo', NOW() - INTERVAL '58 days'),
  (2, 'Bruno Cangundo', 'bruno@uniclubs.edu', 'Gestao', '+244 921 000 002', 'ativo', NOW() - INTERVAL '52 days'),
  (3, 'Carla Mbo', 'carla@uniclubs.edu', 'Design de Comunicacao', '+244 921 000 003', 'ativo', NOW() - INTERVAL '49 days'),
  (4, 'Diego Santos', 'diego@uniclubs.edu', 'Engenharia Civil', '+244 921 000 004', 'ativo', NOW() - INTERVAL '43 days'),
  (5, 'Elisa Kiala', 'elisa@uniclubs.edu', 'Psicologia', '+244 921 000 005', 'ativo', NOW() - INTERVAL '38 days'),
  (6, 'Fabio Tavares', 'fabio@uniclubs.edu', 'Informatica de Gestao', '+244 921 000 006', 'ativo', NOW() - INTERVAL '31 days'),
  (7, 'Gina Lemos', 'gina@uniclubs.edu', 'Arquitectura', '+244 921 000 007', 'pendente', NOW() - INTERVAL '22 days'),
  (8, 'Henrique Domingos', 'henrique@uniclubs.edu', 'Educacao Fisica', '+244 921 000 008', 'ativo', NOW() - INTERVAL '18 days');

INSERT INTO membro_clube (id, membro_id, clube_id, papel, status, data_entrada) VALUES
  (1, 1, 1, 'admin_clube', 'ativo', NOW() - INTERVAL '50 days'),
  (2, 2, 1, 'membro', 'ativo', NOW() - INTERVAL '48 days'),
  (3, 3, 3, 'admin_clube', 'ativo', NOW() - INTERVAL '40 days'),
  (4, 4, 2, 'admin_clube', 'ativo', NOW() - INTERVAL '35 days'),
  (5, 5, 4, 'admin_clube', 'ativo', NOW() - INTERVAL '30 days'),
  (6, 6, 4, 'membro', 'ativo', NOW() - INTERVAL '28 days'),
  (7, 7, 2, 'membro', 'pendente', NOW() - INTERVAL '20 days'),
  (8, 8, 2, 'membro', 'ativo', NOW() - INTERVAL '15 days'),
  (9, 2, 4, 'membro', 'ativo', NOW() - INTERVAL '24 days'),
  (10, 3, 4, 'membro', 'ativo', NOW() - INTERVAL '23 days'),
  (11, 1, 3, 'membro', 'ativo', NOW() - INTERVAL '26 days'),
  (12, 6, 1, 'membro', 'ativo', NOW() - INTERVAL '19 days');

INSERT INTO eventos (
  id,
  clube_id,
  titulo,
  descricao,
  data_inicio,
  data_fim,
  local_ev,
  capacidade_maxima,
  categoria,
  destacado,
  status,
  criado_em
) VALUES
  (
    1,
    1,
    'Hackathon UniClubs 2026',
    '24 horas de prototipagem com mentores, APIs e apresentacao final para os clubes de tecnologia.',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '6 days',
    'Laboratorio 1',
    80,
    'Tecnologia',
    TRUE,
    'ativo',
    NOW() - INTERVAL '10 days'
  ),
  (
    2,
    2,
    'Torneio Interclubes',
    'Competicao amistosa entre equipas, com classificacoes e trofeu para o clube vencedor.',
    NOW() + INTERVAL '8 days',
    NOW() + INTERVAL '8 days 3 hours',
    'Pavilhao Principal',
    120,
    'Desporto',
    TRUE,
    'ativo',
    NOW() - INTERVAL '12 days'
  ),
  (
    3,
    3,
    'Noite Cultural',
    'Sessao artistica com musica, poesia, exposicao criativa e apresentacao dos estudantes.',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days 4 hours',
    'Auditorio B',
    60,
    'Cultura',
    FALSE,
    'finalizado',
    NOW() - INTERVAL '35 days'
  ),
  (
    4,
    4,
    'Demo Day Nexus',
    'Apresentacao publica dos projectos de inovacao desenvolvidos durante o semestre.',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days 4 hours',
    'Sala de Startups',
    40,
    'Inovacao',
    TRUE,
    'ativo',
    NOW() - INTERVAL '8 days'
  ),
  (
    5,
    4,
    'Oficina de Produto',
    'Sessao pratica sobre definicao de proposta de valor e validacao de ideias.',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days 3 hours',
    'Sala de Startups',
    50,
    'Inovacao',
    FALSE,
    'cancelado',
    NOW() - INTERVAL '6 days'
  );

INSERT INTO inscricoes (id, membro_id, evento_id, status, data_inscricao) VALUES
  (1, 1, 1, 'confirmado', NOW() - INTERVAL '2 days'),
  (2, 2, 1, 'confirmado', NOW() - INTERVAL '2 days 2 hours'),
  (3, 3, 2, 'confirmado', NOW() - INTERVAL '1 day'),
  (4, 4, 2, 'confirmado', NOW() - INTERVAL '23 hours'),
  (5, 5, 4, 'confirmado', NOW() - INTERVAL '20 hours'),
  (6, 6, 4, 'pendente', NOW() - INTERVAL '18 hours'),
  (7, 8, 3, 'confirmado', NOW() - INTERVAL '3 days'),
  (8, 1, 3, 'confirmado', NOW() - INTERVAL '3 days 3 hours');

SELECT setval(pg_get_serial_sequence('clubes', 'id'), (SELECT COALESCE(MAX(id), 1) FROM clubes), true);
SELECT setval(pg_get_serial_sequence('membros', 'id'), (SELECT COALESCE(MAX(id), 1) FROM membros), true);
SELECT setval(pg_get_serial_sequence('membro_clube', 'id'), (SELECT COALESCE(MAX(id), 1) FROM membro_clube), true);
SELECT setval(pg_get_serial_sequence('eventos', 'id'), (SELECT COALESCE(MAX(id), 1) FROM eventos), true);
SELECT setval(pg_get_serial_sequence('inscricoes', 'id'), (SELECT COALESCE(MAX(id), 1) FROM inscricoes), true);

COMMIT;
