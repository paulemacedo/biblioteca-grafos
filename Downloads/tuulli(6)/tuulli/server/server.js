const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { col, ready } = require('./lib/db');
const { seed } = require('./lib/seed');
const { hashSenha, verificaSenha } = require('./lib/auth');
const {
  LINHAS, ORIXAS, normalizaEntidades, normalizaPadrinhos, padrinhosTexto,
} = require('./lib/catalogo.js');

const app = express();
const PORT = process.env.PORT || 3000;
const EM_PRODUCAO = process.env.NODE_ENV === 'production';

/* hospedagens (Render, Railway, Fly...) ficam atrás de um proxy que termina o
   HTTPS — sem isto o cookie "secure" não chega ao navegador e o login falha */
if (EM_PRODUCAO) app.set('trust proxy', 1);

app.use(express.json());

/* Sessões: com MongoDB configurado elas ficam no próprio banco, então
   ninguém é desconectado quando o servidor reinicia ou o sistema é
   atualizado. Sem MONGODB_URI (uso local), ficam em memória mesmo. */
let sessionStore;
if (process.env.MONGODB_URI) {
  try {
    /* v5 exporta direto; v6 exporta em .default */
    const mod = require('connect-mongo');
    const MongoStore = mod.default || mod;
    sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB || 'casa_umbanda',
      collectionName: 'sessoes',
      ttl: 60 * 60 * 8,
    });
  } catch {
    console.warn('[aviso] connect-mongo não instalado — sessões ficarão em memória.');
  }
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'troque-este-segredo-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    sameSite: 'lax',
    secure: EM_PRODUCAO,
  },
}));

if (EM_PRODUCAO && !process.env.SESSION_SECRET) {
  console.warn('[aviso] Defina SESSION_SECRET no ambiente antes de usar em produção.');
}
app.use(express.static(path.join(__dirname, 'public')));

/* ---------------- middlewares de acesso ---------------- */
const logado = (req, res, next) =>
  req.session.membro ? next() : res.status(401).json({ erro: 'Faça login para continuar.' });
const admin = (req, res, next) =>
  req.session.membro?.papel === 'admin' ? next() : res.status(403).json({ erro: 'Acesso restrito à administração.' });

/* ---------------- uploads ---------------- */
const storageApostilas = multer.diskStorage({
  destination: path.join(__dirname, 'uploads', 'apostilas'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^\w.\-]+/g, '_')),
});
const upApostila = multer({
  storage: storageApostilas,
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
  limits: { fileSize: 30 * 1024 * 1024 },
});
const storageGaleria = multer.diskStorage({
  destination: path.join(__dirname, 'uploads', 'galeria'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^\w.\-]+/g, '_')),
});
const upFoto = multer({
  storage: storageGaleria,
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
  limits: { fileSize: 10 * 1024 * 1024 },
});
app.use('/uploads/galeria', express.static(path.join(__dirname, 'uploads', 'galeria')));

/* ================================================================
   AUTENTICAÇÃO
================================================================ */
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  const m = await col('membros').findOne({ usuario });
  if (!m || !m.ativo || !verificaSenha(senha, m.senha))
    return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  req.session.membro = { _id: m._id, nome: m.nome, papel: m.papel };
  res.json({ nome: m.nome, papel: m.papel });
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => res.json(req.session.membro || null));

/* ================================================================
   PÚBLICO
================================================================ */
app.get('/api/public/info', async (req, res) => {
  res.json(await col('config').findOne({ _id: 'casa' }));
});
app.get('/api/public/galeria', async (req, res) => {
  res.json(await col('galeria').find({}).sort({ data: -1 }).toArray());
});

/* ================================================================
   FILHOS DA CASA
================================================================ */

/* --- perfil --- */
app.get('/api/perfil', logado, async (req, res) => {
  const m = await col('membros').findOne({ _id: req.session.membro._id });
  delete m.senha;
  if (m.gtId) m.gt = await col('gts').findOne({ _id: m.gtId });
  m.buzios = await col('buzios').find({ membroId: m._id }).sort({ data: -1 }).toArray();
  res.json(m);
});
app.put('/api/perfil', logado, async (req, res) => {
  const { nascimento, orixas, email } = req.body;
  const entidades = normalizaEntidades(req.body.entidades);
  const padrinhos = normalizaPadrinhos(req.body.padrinhos);
  const antes = await col('membros').findOne({ _id: req.session.membro._id });
  await col('membros').updateOne(
    { _id: req.session.membro._id },
    { $set: { nascimento, orixas, padrinhos, entidades, email: email || '' } }
  );

  /* notifica a administração sobre o que mudou (principalmente entidades) */
  const mudancas = [];
  const listaEnt = (l) => (l || []).map((e) => `${e.linha}: ${e.nome}`).sort().join(' · ');
  if (listaEnt(antes.entidades) !== listaEnt(entidades)) {
    mudancas.push(`entidades (antes: ${listaEnt(antes.entidades) || 'nenhuma'} → agora: ${listaEnt(entidades) || 'nenhuma'})`);
  }
  const orixaTxt = (o) => `${o?.frente || '—'} / ${o?.junto || '—'}`;
  if (orixaTxt(antes.orixas) !== orixaTxt(orixas)) {
    mudancas.push(`orixás (${orixaTxt(antes.orixas)} → ${orixaTxt(orixas)})`);
  }
  const padTxt = (p) => padrinhosTexto(p).sort().join(', ');
  if (padTxt(antes.padrinhos) !== padTxt(padrinhos)) mudancas.push('padrinhos');
  if ((antes.nascimento || '') !== (nascimento || '')) mudancas.push('data de nascimento');
  if ((antes.email || '') !== (email || '')) mudancas.push('e-mail');
  if (mudancas.length) {
    await col('notificacoes').insertOne({
      tipo: 'perfil', membroId: antes._id,
      texto: `${antes.nome} alterou no perfil: ${mudancas.join('; ')}.`,
      data: new Date().toISOString(), lida: false,
    });
  }
  res.json({ ok: true });
});

/* catálogo fixo: linhas de entidade e orixás (evita 'baiano' vs 'baianos') */
app.get('/api/catalogo', logado, (req, res) => res.json({ linhas: LINHAS, orixas: ORIXAS }));

/* nomes dos membros ativos (para o filho escolher padrinhos da casa no perfil) */
app.get('/api/membros-nomes', logado, async (req, res) => {
  const ms = await col('membros').find({ ativo: true }).toArray();
  res.json(ms.map((m) => ({ _id: m._id, nome: m.nome })).sort((a, b) => a.nome.localeCompare(b.nome)));
});
app.put('/api/perfil/senha', logado, async (req, res) => {
  const { atual, nova } = req.body;
  const m = await col('membros').findOne({ _id: req.session.membro._id });
  if (!verificaSenha(atual, m.senha)) return res.status(400).json({ erro: 'Senha atual incorreta.' });
  await col('membros').updateOne({ _id: m._id }, { $set: { senha: hashSenha(nova) } });
  res.json({ ok: true });
});

/* --- apostilas --- */
app.get('/api/apostilas', logado, async (req, res) => {
  res.json(await col('apostilas').find({}).sort({ data: -1 }).toArray());
});
app.get('/api/apostilas/:id/arquivo', logado, async (req, res) => {
  const a = await col('apostilas').findOne({ _id: req.params.id });
  if (!a) return res.status(404).end();
  res.download(path.join(__dirname, 'uploads', 'apostilas', a.arquivo), a.titulo + '.pdf');
});

/* --- calendário --- */
app.get('/api/eventos', logado, async (req, res) => {
  res.json(await col('eventos').find({}).sort({ data: 1 }).toArray());
});

/* --- escala da gira (quadro de funções) ---
   Cada evento pode ter uma escala: lista de funções (Consultas, Passes,
   Defumação...) com os médiuns alocados, seus graus e uma nota opcional. */
app.get('/api/eventos/:id/escala', logado, async (req, res) => {
  const evento = await col('eventos').findOne({ _id: req.params.id });
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  const escala = await col('escalas').findOne({ eventoId: req.params.id });
  const membros = await col('membros').find({}).toArray();
  const dados = (id) => {
    const m = membros.find((x) => x._id === id);
    return { membroId: id, nome: m?.nome || '?', grau: m?.grau ?? null };
  };
  res.json({
    evento: { _id: evento._id, titulo: evento.titulo, data: evento.data, hora: evento.hora },
    funcoes: (escala?.funcoes || []).map((f) => ({
      nome: f.nome, obs: f.obs || '', gtId: f.gtId || null, todos: !!f.todos,
      membros: (f.membros || []).map((x) => ({
        ...dados(x.membroId),
        nota: x.nota || '',
        /* cambonagem: outro médium escalado para cambonar, ou um texto
           livre como "Fixo" quando a cambonagem daquele médium é fixa */
        cambonoId: x.cambonoId || null,
        cambonoNome: x.cambonoId ? (membros.find((m) => m._id === x.cambonoId)?.nome || '?') : '',
        cambonagem: x.cambonagem || '',
      })),
    })),
  });
});
app.put('/api/admin/eventos/:id/escala', admin, async (req, res) => {
  const evento = await col('eventos').findOne({ _id: req.params.id });
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  const funcoes = (req.body.funcoes || []).map((f) => ({
    nome: String(f.nome || '').trim(),
    obs: String(f.obs || ''),
    gtId: f.gtId || null,
    todos: !!f.todos, // função que vale para a casa inteira (mostra "Todos")
    membros: (f.membros || []).map((m) => ({
      membroId: m.membroId,
      nota: String(m.nota || ''),
      cambonoId: m.cambonoId || null,
      cambonagem: String(m.cambonagem || ''),
    })),
  })).filter((f) => f.nome);
  const existente = await col('escalas').findOne({ eventoId: req.params.id });
  if (existente) await col('escalas').updateOne({ _id: existente._id }, { $set: { funcoes } });
  else await col('escalas').insertOne({ eventoId: req.params.id, funcoes });
  res.json({ ok: true });
});

/* --- frequência do próprio filho (com justificativas de falta) ---
   Regra da casa: 2 faltas não justificadas = advertência; 3 ou mais = suspensão.
   Uma falta só conta como justificada quando a administração aceita a justificativa. */
const MOTIVOS_FALTA = ['doenca', 'trabalho', 'filhos', 'acidente', 'outro'];

function situacaoDisciplinar(faltasNaoJustificadas) {
  if (faltasNaoJustificadas >= 3) return 'suspensao';
  if (faltasNaoJustificadas === 2) return 'advertencia';
  return 'ok';
}

/* Carrega UMA vez os dados de que o cálculo de frequência precisa.
   Antes, cada membro disparava 3 consultas ao banco — com a casa cheia
   isso deixava as telas de financeiro e relatórios lentíssimas. */
async function baseFrequencia() {
  const [eventos, freq, justs] = await Promise.all([
    col('eventos').find({ encerrada: true }).sort({ data: -1 }).toArray(),
    col('frequencia').find({}).toArray(),
    col('justificativas').find({}).toArray(),
  ]);
  const presencaPor = {}, justPor = {};
  for (const f of freq) (presencaPor[String(f.membroId)] ??= new Set()).add(String(f.eventoId));
  for (const j of justs) (justPor[String(j.membroId)] ??= []).push(j);
  return { eventos, presencaPor, justPor };
}

/* Resumo de um membro a partir da base já carregada (sem tocar no banco) */
function resumoDaBase(base, membroId) {
  const id = String(membroId);
  const presentes = base.presencaPor[id] || new Set();
  const justs = base.justPor[id] || [];
  const lista = base.eventos.map((e) => {
    const j = justs.find((x) => String(x.eventoId) === String(e._id));
    return {
      eventoId: e._id, titulo: e.titulo, data: e.data,
      presente: presentes.has(String(e._id)),
      justificativa: j ? { motivo: j.motivo, texto: j.texto, status: j.status } : null,
    };
  });
  const total = lista.length;
  const compareceu = lista.filter((l) => l.presente).length;
  const faltas = total - compareceu;
  const faltasJustificadas = lista.filter((l) => !l.presente && l.justificativa?.status === 'aceita').length;
  const faltasNaoJustificadas = faltas - faltasJustificadas;
  return {
    lista, total, compareceu, faltas, faltasJustificadas, faltasNaoJustificadas,
    percentual: total ? Math.round((100 * compareceu) / total) : 0,
    situacao: situacaoDisciplinar(faltasNaoJustificadas),
  };
}

/* Resumo de um membro só (usa a base internamente) */
async function resumoFrequencia(membroId) {
  return resumoDaBase(await baseFrequencia(), membroId);
}

app.get('/api/minha-frequencia', logado, async (req, res) => {
  res.json(await resumoFrequencia(req.session.membro._id));
});

/* administração registra a justificativa de uma falta (o filho avisa a casa,
   e a administração lança aqui — já entra como aceita por padrão) */
app.post('/api/admin/justificativas', admin, async (req, res) => {
  const { membroId, eventoId, motivo, texto, status } = req.body;
  if (!MOTIVOS_FALTA.includes(motivo)) return res.status(400).json({ erro: 'Escolha o motivo da falta.' });
  const evento = await col('eventos').findOne({ _id: eventoId });
  if (!evento || !evento.encerrada) return res.status(400).json({ erro: 'Evento inválido.' });
  const presente = await col('frequencia').findOne({ eventoId, membroId });
  if (presente) return res.status(400).json({ erro: 'Esse filho esteve presente nesta gira — não há falta a justificar.' });
  const dados = {
    motivo, texto: texto || '',
    status: status === 'recusada' ? 'recusada' : status === 'pendente' ? 'pendente' : 'aceita',
    data: new Date().toISOString(), respostaData: new Date().toISOString(),
  };
  const existente = await col('justificativas').findOne({ eventoId, membroId });
  if (existente) await col('justificativas').updateOne({ _id: existente._id }, { $set: dados });
  else await col('justificativas').insertOne({ eventoId, membroId, ...dados });
  res.json({ ok: true });
});

/* pendências do filho (banner na área interna) */
app.get('/api/minhas-pendencias', logado, async (req, res) => {
  const mensalidades = await col('pagamentos')
    .find({ membroId: req.session.membro._id, tipo: 'mensalidade', status: 'pendente' }).toArray();
  const f = await resumoFrequencia(req.session.membro._id);
  res.json({ mensalidades, situacao: f.situacao, faltasNaoJustificadas: f.faltasNaoJustificadas });
});

/* --- justificativas (administração dá o ok) --- */
app.get('/api/admin/justificativas', admin, async (req, res) => {
  const justs = await col('justificativas').find({}).sort({ data: -1 }).toArray();
  const membros = await col('membros').find({}).toArray();
  const eventos = await col('eventos').find({}).toArray();
  res.json(justs.map((j) => ({
    ...j,
    membroNome: membros.find((m) => m._id === j.membroId)?.nome || '?',
    evento: (() => { const e = eventos.find((x) => x._id === j.eventoId); return e ? { titulo: e.titulo, data: e.data } : null; })(),
  })));
});
app.put('/api/admin/justificativas/:id', admin, async (req, res) => {
  const status = req.body.status === 'aceita' ? 'aceita' : 'recusada';
  await col('justificativas').updateOne(
    { _id: req.params.id },
    { $set: { status, respostaData: new Date().toISOString() } }
  );
  res.json({ ok: true });
});

/* --- FAQ da comunidade --- */
app.get('/api/faq', logado, async (req, res) => {
  const posts = await col('faq').find({}).sort({ data: -1 }).toArray();
  const membros = await col('membros').find({}).toArray();
  const nome = (id) => membros.find((m) => m._id === id)?.nome || 'Membro';
  res.json(posts.map((p) => ({
    ...p, autor: nome(p.autorId),
    respostas: (p.respostas || []).map((r) => ({ ...r, autor: nome(r.autorId) })),
  })));
});
app.post('/api/faq', logado, async (req, res) => {
  const { titulo, texto } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ erro: 'Escreva o título da dúvida.' });
  await col('faq').insertOne({ autorId: req.session.membro._id, titulo, texto: texto || '', data: new Date().toISOString(), respostas: [] });
  res.json({ ok: true });
});
app.post('/api/faq/:id/respostas', logado, async (req, res) => {
  const { texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ erro: 'Escreva a resposta.' });
  await col('faq').updateOne(
    { _id: req.params.id },
    { $push: { respostas: { autorId: req.session.membro._id, texto, data: new Date().toISOString() } } }
  );
  res.json({ ok: true });
});

/* --- certificados do filho --- */
app.get('/api/certificados', logado, async (req, res) => {
  res.json(await col('certificados').find({ membroId: req.session.membro._id }).sort({ data: -1 }).toArray());
});
app.get('/api/certificados/:id', logado, async (req, res) => {
  const c = await col('certificados').findOne({ _id: req.params.id });
  if (!c) return res.status(404).json({ erro: 'Certificado não encontrado.' });
  const eDono = c.membroId === req.session.membro._id;
  if (!eDono && req.session.membro.papel !== 'admin') return res.status(403).json({ erro: 'Sem acesso.' });
  const m = await col('membros').findOne({ _id: c.membroId });

  /* primeira vez que o próprio filho abre = retirada do certificado no site */
  if (eDono && !c.vistoEm) {
    c.vistoEm = new Date().toISOString();
    await col('certificados').updateOne({ _id: c._id }, { $set: { vistoEm: c.vistoEm } });
    await col('notificacoes').insertOne({
      tipo: 'certificado', membroId: m._id,
      texto: `${m.nome} retirou o certificado "${c.titulo}" no site.`,
      data: c.vistoEm, lida: false,
    });
  }

  const casa = await col('config').findOne({ _id: 'casa' });
  res.json({ ...c, membroNome: m.nome, casa: { nome: casa.nome, maeDeSanto: casa.maeDeSanto.nome } });
});

/* --- documentos para assinatura --- */
app.get('/api/documentos', logado, async (req, res) => {
  const docs = await col('documentos').find({}).sort({ data: -1 }).toArray();
  res.json(docs.map((d) => ({
    ...d,
    jaAssinei: (d.assinaturas || []).some((a) => a.membroId === req.session.membro._id),
  })));
});
app.post('/api/documentos/:id/assinar', logado, async (req, res) => {
  const { nome } = req.body;
  const d = await col('documentos').findOne({ _id: req.params.id });
  if (!d) return res.status(404).json({ erro: 'Documento não encontrado.' });
  if ((d.assinaturas || []).some((a) => a.membroId === req.session.membro._id))
    return res.status(400).json({ erro: 'Você já assinou este documento.' });
  await col('documentos').updateOne(
    { _id: req.params.id },
    { $push: { assinaturas: { membroId: req.session.membro._id, nome, data: new Date().toISOString() } } }
  );
  res.json({ ok: true });
});

/* ================================================================
   ADMINISTRAÇÃO
================================================================ */

/* --- configurações da casa (alimenta a página pública) --- */
app.put('/api/admin/config', admin, async (req, res) => {
  const { nome, sigla, slogan, selo, fundamentos, maeDeSanto, endereco, sede, horarios, contatos } = req.body;
  await col('config').updateOne({ _id: 'casa' }, { $set: { nome, sigla, slogan, selo, fundamentos, maeDeSanto, endereco, sede, horarios, contatos } });
  res.json({ ok: true });
});

/* --- membros --- */
app.get('/api/admin/membros', admin, async (req, res) => {
  const membros = await col('membros').find({}).sort({ nome: 1 }).toArray();
  const gts = await col('gts').find({}).toArray();
  res.json(membros.map((m) => {
    const { senha, ...rest } = m;
    return { ...rest, gtNome: gts.find((g) => g._id === m.gtId)?.nome || null };
  }));
});
app.post('/api/admin/membros', admin, async (req, res) => {
  const { nome, usuario, senha, papel, nascimento, grau } = req.body;
  if (!nome || !usuario || !senha) return res.status(400).json({ erro: 'Nome, usuário e senha são obrigatórios.' });
  if (await col('membros').findOne({ usuario })) return res.status(400).json({ erro: 'Já existe um membro com esse usuário.' });
  await col('membros').insertOne({
    nome, usuario, senha: hashSenha(senha), papel: papel === 'admin' ? 'admin' : 'filho',
    nascimento: nascimento || '', grau: grau === '' || grau == null ? null : Number(grau),
    email: req.body.email || '',
    orixas: { frente: '', junto: '' },
    padrinhos: { orixas: [], pessoas: [] }, entidades: [], ativo: true, gtId: null,
  });
  res.json({ ok: true });
});
app.put('/api/admin/membros/:id', admin, async (req, res) => {
  const b = req.body, set = {};
  for (const campo of ['ativo', 'papel', 'nome', 'nascimento', 'email', 'orixas', 'padrinhos', 'entidades', 'telefone', 'endereco', 'ficha']) {
    if (b[campo] !== undefined) set[campo] = b[campo];
  }
  if (b.grau !== undefined) set.grau = b.grau === '' || b.grau == null ? null : Number(b.grau);
  if (set.entidades) set.entidades = normalizaEntidades(set.entidades);
  if (set.padrinhos) set.padrinhos = normalizaPadrinhos(set.padrinhos);
  await col('membros').updateOne({ _id: req.params.id }, { $set: set });
  res.json({ ok: true });
});

/* perfil completo de um membro (aba Membros -> abrir como perfil) */
app.get('/api/admin/membros/:id', admin, async (req, res) => {
  const m = await col('membros').findOne({ _id: req.params.id });
  if (!m) return res.status(404).json({ erro: 'Membro não encontrado.' });
  delete m.senha;
  const gts = await col('gts').find({}).toArray();
  m.gtNome = gts.find((g) => g._id === m.gtId)?.nome || null;
  const hist = await col('historicoGt').find({ membroId: m._id }).sort({ data: -1 }).toArray();
  m.historicoGts = hist.map((h) => ({ gtNome: gts.find((g) => g._id === h.gtId)?.nome || '(GT excluído)', data: h.data }));
  m.frequencia = await resumoFrequencia(m._id);
  m.pagamentos = (await col('pagamentos').find({ membroId: m._id }).sort({ referencia: -1 }).toArray());
  m.buzios = await col('buzios').find({ membroId: m._id }).sort({ data: -1 }).toArray();
  m.certificados = await col('certificados').find({ membroId: m._id }).sort({ data: -1 }).toArray();
  res.json(m);
});

/* jogos de búzios do membro (registrados pela administração) */
app.post('/api/admin/membros/:id/buzios', admin, async (req, res) => {
  const { data, texto } = req.body;
  if (!data) return res.status(400).json({ erro: 'Informe a data do jogo.' });
  await col('buzios').insertOne({ membroId: req.params.id, data, texto: texto || '' });
  res.json({ ok: true });
});
app.delete('/api/admin/buzios/:id', admin, async (req, res) => {
  await col('buzios').deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

/* --- calendário --- */
app.post('/api/admin/eventos', admin, async (req, res) => {
  const { titulo, tipo, data, hora, descricao } = req.body;
  if (!titulo || !data) return res.status(400).json({ erro: 'Título e data são obrigatórios.' });
  await col('eventos').insertOne({ titulo, tipo: tipo || 'gira', data, hora: hora || '', descricao: descricao || '', encerrada: false });
  res.json({ ok: true });
});
app.delete('/api/admin/eventos/:id', admin, async (req, res) => {
  await col('eventos').deleteOne({ _id: req.params.id });
  await col('frequencia').deleteMany({ eventoId: req.params.id });
  await col('escalas').deleteMany({ eventoId: req.params.id });
  res.json({ ok: true });
});

/* --- frequência: marcar presenças após a gira --- */
app.get('/api/admin/eventos/:id/frequencia', admin, async (req, res) => {
  const presencas = await col('frequencia').find({ eventoId: req.params.id }).toArray();
  res.json(presencas.map((p) => p.membroId));
});
app.post('/api/admin/eventos/:id/frequencia', admin, async (req, res) => {
  const { membroIds } = req.body; // lista completa dos presentes
  await col('frequencia').deleteMany({ eventoId: req.params.id });
  for (const membroId of membroIds || []) {
    await col('frequencia').insertOne({ eventoId: req.params.id, membroId, data: new Date().toISOString() });
  }
  await col('eventos').updateOne({ _id: req.params.id }, { $set: { encerrada: true } });
  res.json({ ok: true });
});

/* --- GTs --- */
app.get('/api/admin/gts', admin, async (req, res) => {
  const gts = await col('gts').find({}).sort({ nome: 1 }).toArray();
  const membros = await col('membros').find({}).toArray();
  res.json(gts.map((g) => ({
    ...g,
    liderNome: membros.find((m) => m._id === g.liderId)?.nome || null,
    fixos: g.fixos || [],
    membrosDetalhe: (g.membros || []).map((id) => {
      const m = membros.find((x) => x._id === id);
      return {
        _id: id, nome: m?.nome || '?', grau: m?.grau ?? null,
        lider: id === g.liderId,
        fixo: id === g.liderId || (g.fixos || []).includes(id),
      };
    }),
  })));
});
app.post('/api/admin/gts', admin, async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Dê um nome ao grupo de trabalho.' });
  await col('gts').insertOne({ nome, descricao: descricao || '', liderId: null, membros: [] });
  res.json({ ok: true });
});
app.post('/api/admin/gts/:id/membros', admin, async (req, res) => {
  const { membroId, lider } = req.body;
  const gt = await col('gts').findOne({ _id: req.params.id });
  if (!gt) return res.status(404).json({ erro: 'GT não encontrado.' });
  // remove o membro do GT anterior, se houver
  const antigo = await col('membros').findOne({ _id: membroId });
  if (antigo?.gtId && antigo.gtId !== gt._id) {
    await col('gts').updateOne({ _id: antigo.gtId }, { $pull: { membros: membroId } });
    const gtAntigo = await col('gts').findOne({ _id: antigo.gtId });
    if (gtAntigo?.liderId === membroId) await col('gts').updateOne({ _id: antigo.gtId }, { $set: { liderId: null } });
  }
  if (!(gt.membros || []).includes(membroId))
    await col('gts').updateOne({ _id: gt._id }, { $push: { membros: membroId } });
  if (lider) await col('gts').updateOne({ _id: gt._id }, { $set: { liderId: membroId } });
  await col('membros').updateOne({ _id: membroId }, { $set: { gtId: gt._id } });
  await col('historicoGt').insertOne({ gtId: gt._id, membroId, data: new Date().toISOString() });
  res.json({ ok: true });
});
app.delete('/api/admin/gts/:id/membros/:membroId', admin, async (req, res) => {
  await col('gts').updateOne({ _id: req.params.id }, { $pull: { membros: req.params.membroId } });
  const gt = await col('gts').findOne({ _id: req.params.id });
  if (gt?.liderId === req.params.membroId) await col('gts').updateOne({ _id: gt._id }, { $set: { liderId: null } });
  await col('membros').updateOne({ _id: req.params.membroId }, { $set: { gtId: null } });
  res.json({ ok: true });
});

/* --- sugestão de alocação para GTs ---
   Ordena os filhos ativos sem GT por:
   1) maior frequência nas giras encerradas (quem comparece mais assume mais responsabilidade)
   2) menor número de alocações anteriores (rodízio justo entre os irmãos)          */
/* feedback dos GTs (anotações da administração sobre o trabalho do grupo) */
app.post('/api/admin/gts/:id/feedback', admin, async (req, res) => {
  const { texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ erro: 'Escreva o feedback.' });
  await col('gts').updateOne(
    { _id: req.params.id },
    { $push: { feedbacks: { id: Date.now().toString(36), texto, data: new Date().toISOString() } } }
  );
  res.json({ ok: true });
});
app.delete('/api/admin/gts/:id/feedback/:fid', admin, async (req, res) => {
  const gt = await col('gts').findOne({ _id: req.params.id });
  if (!gt) return res.status(404).json({ erro: 'GT não encontrado.' });
  await col('gts').updateOne(
    { _id: gt._id },
    { $set: { feedbacks: (gt.feedbacks || []).filter((f) => f.id !== req.params.fid) } }
  );
  res.json({ ok: true });
});

/* ===================================================================
   ALOCAÇÃO POR GIRA
   O GT não é mais "onde a pessoa mora": ele define a FUNÇÃO na gira.
   Ficam fixos apenas o líder e quem a casa marcar como fixo (ex.: uma
   cambonagem fixa). O restante é escalado gira a gira, em rodízio.
   =================================================================== */

/* quantas vezes cada membro já foi escalado (no total e por GT) */
async function historicoEscalas() {
  const escalas = await col('escalas').find({}).toArray();
  const eventos = await col('eventos').find({}).toArray();
  const porMembro = {}; // membroId -> { total, porGt: {gtId: n}, ultima: {gtId: data}, ultimaGeral }
  for (const esc of escalas) {
    const evento = eventos.find((e) => e._id === esc.eventoId);
    const data = evento?.data || '';
    for (const f of esc.funcoes || []) {
      for (const m of f.membros || []) {
        const r = (porMembro[m.membroId] ??= { total: 0, porGt: {}, ultima: {}, ultimaGeral: '' });
        r.total++;
        const chave = f.gtId || f.nome;
        r.porGt[chave] = (r.porGt[chave] || 0) + 1;
        if (data > (r.ultima[chave] || '')) r.ultima[chave] = data;
        if (data > r.ultimaGeral) r.ultimaGeral = data;
      }
    }
  }
  return porMembro;
}

/* ficha de cada membro para decidir a escala (assiduidade + disciplina) */
async function fichasParaEscala() {
  const membros = (await col('membros').find({ ativo: true }).toArray()).filter((m) => m.papel !== 'admin');
  const hist = await historicoEscalas();
  const base = await baseFrequencia();
  const fichas = [];
  for (const m of membros) {
    const f = resumoDaBase(base, m._id);
    const h = hist[m._id] || { total: 0, porGt: {}, ultima: {}, ultimaGeral: '' };
    fichas.push({
      _id: m._id, nome: m.nome, grau: m.grau ?? null,
      percentual: f.percentual, compareceu: f.compareceu, totalGiras: f.total,
      faltasNaoJustificadas: f.faltasNaoJustificadas, situacao: f.situacao,
      vezesEscalado: h.total, porGt: h.porGt, ultimaPorGt: h.ultima, ultimaEscala: h.ultimaGeral,
    });
  }
  return fichas;
}

/* sugestão de escala para UMA gira: por GT, os fixos + o rodízio sugerido */
app.get('/api/admin/eventos/:id/sugestao', admin, async (req, res) => {
  const evento = await col('eventos').findOne({ _id: req.params.id });
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  const gts = await col('gts').find({}).toArray();
  const fichas = await fichasParaEscala();
  const escala = await col('escalas').findOne({ eventoId: evento._id });

  /* onde cada pessoa já está nesta gira — ela continua podendo ser
     escalada em outro GT, mas a tela mostra onde já está */
  const ondeJaEsta = {};
  for (const f of escala?.funcoes || []) {
    for (const m of f.membros || []) {
      (ondeJaEsta[String(m.membroId)] ??= []).push(f.nome);
    }
  }

  /* quem é líder/fixo de qualquer GT já tem lugar garantido: não entra no rodízio dos outros */
  const fixosDaCasa = new Set(gts.flatMap((g) => [g.liderId, ...(g.fixos || [])].filter(Boolean)));

  const sugestoesDoGt = (gt) => {
    const fixos = [...new Set([gt.liderId, ...(gt.fixos || [])].filter(Boolean))];
    const nesteGt = new Set(
      (escala?.funcoes || [])
        .filter((f) => f.gtId === gt._id || f.nome === gt.nome)
        .flatMap((f) => (f.membros || []).map((m) => String(m.membroId)))
    );
    const candidatos = fichas
      .filter((f) => !fixos.includes(f._id) && !nesteGt.has(String(f._id)))
      .map((f) => ({
        ...f,
        vezesNesteGt: f.porGt[gt._id] || 0,
        ultimaVezNesteGt: f.ultimaPorGt[gt._id] || '',
        daEquipe: (gt.membros || []).includes(f._id),
        /* já escalado nesta gira em outro(s) GT(s) — pode servir aqui também */
        jaNaGiraEm: ondeJaEsta[String(f._id)] || [],
      }))
      .sort((a, b) =>
        /* 1) quem está suspenso vai para o fim  2) rodízio: menos vezes neste GT
           3) quem serviu há mais tempo  4) maior assiduidade  5) nome */
        (a.situacao === 'suspensao') - (b.situacao === 'suspensao')
        || (a.jaNaGiraEm.length > 0) - (b.jaNaGiraEm.length > 0)
        || a.vezesNesteGt - b.vezesNesteGt
        || (a.ultimaVezNesteGt || '').localeCompare(b.ultimaVezNesteGt || '')
        || b.percentual - a.percentual
        || a.nome.localeCompare(b.nome)
      );
    return { fixos: fixos.map((id) => fichas.find((f) => f._id === id)).filter(Boolean), candidatos };
  };

  res.json({
    evento: { _id: evento._id, titulo: evento.titulo, data: evento.data },
    criterio: 'Fixos (líder e quem a casa marcou como fixo) entram sempre. Os demais são sugeridos por rodízio: quem serviu menos vezes naquele GT vem primeiro; empate, quem serviu há mais tempo; depois, maior assiduidade. Quem está suspenso aparece por último, sinalizado.',
    gts: gts.map((gt) => {
      const { fixos, candidatos } = sugestoesDoGt(gt);
      return {
        _id: gt._id, nome: gt.nome, descricao: gt.descricao || '',
        liderId: gt.liderId || null,
        fixos, candidatos,
        jaEscalados: (escala?.funcoes || [])
          .filter((f) => f.gtId === gt._id || f.nome === gt.nome)
          .flatMap((f) => (f.membros || []).map((m) => m.membroId)),
      };
    }),
  });
});

/* aloca um médium em um GT DESTA gira (cria a função na escala se faltar) */
app.post('/api/admin/eventos/:id/escala/alocar', admin, async (req, res) => {
  const { gtId, membroId, nota, cambonoId } = req.body;
  const evento = await col('eventos').findOne({ _id: req.params.id });
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  const gt = await col('gts').findOne({ _id: gtId });
  if (!gt) return res.status(404).json({ erro: 'GT não encontrado.' });

  let escala = await col('escalas').findOne({ eventoId: evento._id });
  if (!escala) {
    await col('escalas').insertOne({ eventoId: evento._id, funcoes: [] });
    escala = await col('escalas').findOne({ eventoId: evento._id });
  }
  const funcoes = escala.funcoes || [];
  /* a mesma pessoa PODE servir em mais de um GT na mesma gira (ex.: consulta
     e ainda ajuda na mesa). Só informamos onde mais ela já está. */
  const tambemEm = funcoes
    .filter((x) => (x.membros || []).some((m) => String(m.membroId) === String(membroId)))
    .filter((x) => !(x.gtId === gt._id || x.nome === gt.nome))
    .map((x) => x.nome);
  let f = funcoes.find((x) => x.gtId === gt._id || x.nome === gt.nome);
  if (!f) {
    f = { gtId: gt._id, nome: gt.nome, obs: '', membros: [] };
    funcoes.push(f);
  }
  f.gtId = gt._id;
  if (!f.membros.some((m) => m.membroId === membroId)) {
    f.membros.push({
      membroId, nota: String(nota || ''),
      cambonoId: cambonoId || null, cambonagem: '',
    });
  }
  await col('escalas').updateOne({ _id: escala._id }, { $set: { funcoes } });
  res.json({ ok: true, tambemEm });
});

/* tira um médium da escala desta gira */
app.delete('/api/admin/eventos/:id/escala/membros/:membroId', admin, async (req, res) => {
  const escala = await col('escalas').findOne({ eventoId: req.params.id });
  if (!escala) return res.json({ ok: true });
  const funcoes = (escala.funcoes || []).map((f) => ({
    ...f, membros: (f.membros || []).filter((m) => m.membroId !== req.params.membroId),
  }));
  await col('escalas').updateOne({ _id: escala._id }, { $set: { funcoes } });
  res.json({ ok: true });
});

/* monta a escala inteira automaticamente: fixos + N sugeridos por GT */
app.post('/api/admin/eventos/:id/escala/sugerir-tudo', admin, async (req, res) => {
  const porGt = Number(req.body.porGt) || 2; // quantos dinâmicos por GT
  const evento = await col('eventos').findOne({ _id: req.params.id });
  if (!evento) return res.status(404).json({ erro: 'Evento não encontrado.' });
  const gts = await col('gts').find({}).toArray();
  const fichas = await fichasParaEscala();
  const usados = new Set();

  /* 1º passe: os fixos de TODOS os GTs são reservados antes de qualquer
     distribuição — senão o fixo de um GT acabaria escalado noutro. */
  const funcoes = gts.map((gt) => {
    const fixos = [...new Set([gt.liderId, ...(gt.fixos || [])].filter(Boolean))];
    const membros = [];
    for (const id of fixos) {
      if (usados.has(id) || !fichas.some((f) => f._id === id)) continue;
      usados.add(id);
      membros.push({
        membroId: id,
        nota: id === gt.liderId ? 'Líder' : 'Fixo',
        cambonoId: null, cambonagem: '',
      });
    }
    return { gtId: gt._id, nome: gt.nome, obs: gt.descricao || '', membros };
  });

  /* 2º passe: rodízio distribuído — uma rodada por vez em cada GT, para que
     todos recebam gente antes de alguém receber a segunda pessoa. */
  /* quantas funções a pessoa já tem NESTA gira (para não sobrecarregar ninguém) */
  const quantasNaGira = (id) =>
    funcoes.filter((x) => (x.membros || []).some((m) => String(m.membroId) === String(id))).length;

  const melhorPara = (gt, permitirRepetir = false) => fichas
    .filter((f) => (permitirRepetir || !usados.has(f._id)) && f.situacao !== 'suspensao')
    .filter((f) => !(funcoes.find((x) => x.gtId === gt._id)?.membros || [])
      .some((m) => String(m.membroId) === String(f._id)))
    .map((f) => ({
      ...f,
      naGira: quantasNaGira(f._id),
      vezesNesteGt: f.porGt[gt._id] || 0,
      ultimaVezNesteGt: f.ultimaPorGt[gt._id] || '',
    }))
    .sort((a, b) =>
      /* quem tem menos funções nesta gira vem primeiro; depois o rodízio normal */
      a.naGira - b.naGira
      || a.vezesNesteGt - b.vezesNesteGt
      || (a.ultimaVezNesteGt || '').localeCompare(b.ultimaVezNesteGt || '')
      || b.percentual - a.percentual
      || a.nome.localeCompare(b.nome)
    )[0];

  for (let rodada = 0; rodada < porGt; rodada++) {
    for (let i = 0; i < gts.length; i++) {
      /* primeiro tenta quem ainda não foi escalado nesta gira; se a casa for
         pequena e a gente acabar, repete quem serviu menos — assim nenhum GT
         fica vazio e ninguém aparece duas vezes no mesmo GT */
      const escolhido = melhorPara(gts[i]) || melhorPara(gts[i], true);
      if (!escolhido) continue;
      usados.add(escolhido._id);
      funcoes[i].membros.push({ membroId: escolhido._id, nota: '', cambonoId: null, cambonagem: '' });
    }
  }

  const existente = await col('escalas').findOne({ eventoId: evento._id });
  if (existente) await col('escalas').updateOne({ _id: existente._id }, { $set: { funcoes } });
  else await col('escalas').insertOne({ eventoId: evento._id, funcoes });
  res.json({ ok: true, funcoes: funcoes.length, escalados: usados.size });
});

/* marca/desmarca um membro como FIXO do GT (entra em toda gira) */
/* excluir um GT (os membros ficam sem GT; escalas antigas são preservadas) */
app.delete('/api/admin/gts/:id', admin, async (req, res) => {
  const gt = await col('gts').findOne({ _id: req.params.id });
  if (!gt) return res.status(404).json({ erro: 'GT não encontrado.' });
  await col('gts').deleteOne({ _id: gt._id });
  const membros = await col('membros').find({}).toArray();
  for (const m of membros) {
    if (String(m.gtId) === String(gt._id)) {
      await col('membros').updateOne({ _id: m._id }, { $set: { gtId: null } });
    }
  }
  res.json({ ok: true });
});

app.put('/api/admin/gts/:id/fixos/:membroId', admin, async (req, res) => {
  const gt = await col('gts').findOne({ _id: req.params.id });
  if (!gt) return res.status(404).json({ erro: 'GT não encontrado.' });
  const fixos = new Set(gt.fixos || []);
  if (req.body.fixo) fixos.add(req.params.membroId);
  else fixos.delete(req.params.membroId);
  await col('gts').updateOne({ _id: gt._id }, { $set: { fixos: [...fixos] } });
  res.json({ ok: true });
});

app.get('/api/admin/gts/sugestoes', admin, async (req, res) => {
  const membros = (await col('membros').find({ ativo: true }).toArray()).filter((m) => m.papel !== 'admin');
  const eventosEncerrados = await col('eventos').find({ encerrada: true }).toArray();
  const totalGiras = eventosEncerrados.length || 1;
  const freq = await col('frequencia').find({}).toArray();
  const hist = await col('historicoGt').find({}).toArray();
  const gts = await col('gts').find({}).toArray();

  const justs = await col('justificativas').find({ status: 'aceita' }).toArray();
  const linhas = membros.map((m) => {
    const presencas = freq.filter((f) => f.membroId === m._id).length;
    const faltas = eventosEncerrados.filter((e) => !freq.some((f) => f.eventoId === e._id && f.membroId === m._id));
    const faltasNaoJust = faltas.filter((e) => !justs.some((j) => j.eventoId === e._id && j.membroId === m._id)).length;
    const meuHist = hist.filter((h) => h.membroId === m._id).sort((a, b) => b.data.localeCompare(a.data));
    return {
      _id: m._id, nome: m.nome, grau: m.grau ?? null,
      gtAtual: gts.find((g) => g._id === m.gtId)?.nome || null,
      gtAtualId: m.gtId || null,
      presencas, totalGiras: eventosEncerrados.length,
      percentual: Math.round((100 * presencas) / totalGiras),
      faltasNaoJustificadas: faltasNaoJust,
      situacao: situacaoDisciplinar(faltasNaoJust),
      alocacoes: meuHist.length,
      historico: meuHist.map((h) => ({ gtNome: gts.find((g) => g._id === h.gtId)?.nome || '(GT excluído)', data: h.data })),
    };
  });
  linhas.sort((a, b) => (b.percentual - a.percentual) || (a.alocacoes - b.alocacoes) || a.nome.localeCompare(b.nome));
  res.json({
    criterio: 'Ordenado por frequência nas giras (maior primeiro) e, em empate, por menos alocações anteriores em GTs — para dar rodízio justo. O histórico de GTs de cada um aparece na linha, para basear a decisão.',
    gts: gts.map((g) => ({ _id: g._id, nome: g.nome })),
    semGt: linhas.filter((l) => !l.gtAtual),
    todos: linhas,
  });
});

/* --- relatório de rendimento / frequência geral --- */
app.get('/api/admin/relatorios/frequencia', admin, async (req, res) => {
  const membros = (await col('membros').find({ ativo: true }).toArray()).filter((m) => m.papel !== 'admin');
  const eventos = await col('eventos').find({ encerrada: true }).sort({ data: 1 }).toArray();
  const freq = await col('frequencia').find({}).toArray();
  res.json({
    eventos: eventos.map((e) => ({ _id: e._id, titulo: e.titulo, data: e.data })),
    membros: await (async () => {
      const base = await baseFrequencia();
      return membros.map((m) => {
      const f = resumoDaBase(base, m._id);
      return {
        _id: m._id, nome: m.nome,
        presencas: eventos.map((e) => freq.some((x) => x.eventoId === e._id && x.membroId === m._id)),
        total: f.compareceu, percentual: f.percentual,
        faltasJustificadas: f.faltasJustificadas,
        faltasNaoJustificadas: f.faltasNaoJustificadas,
        situacao: f.situacao,
      };
      });
    })(),
  });
});

/* --- financeiro: recebimentos --- */
app.get('/api/admin/pagamentos', admin, async (req, res) => {
  const pagamentos = await col('pagamentos').find({}).sort({ referencia: -1 }).toArray();
  const membros = await col('membros').find({}).toArray();
  const base = await baseFrequencia();
  const assiduidade = {}, girasDe = {};
  for (const m of membros) {
    if (m.papel === 'admin') continue;
    const f = resumoDaBase(base, m._id);
    assiduidade[m._id] = f.percentual;
    girasDe[m._id] = f.total;
  }
  res.json(pagamentos.map((p) => {
    const m = membros.find((x) => x._id === p.membroId);
    return {
      ...p,
      categoria: p.categoria || (p.tipo === 'mensalidade' ? 'fixo' : 'variavel'),
      membroNome: m?.nome || '?', membroEmail: m?.email || '',
      assiduidade: assiduidade[p.membroId] ?? null,
      giras: girasDe[p.membroId] ?? 0,
    };
  }));
});
app.post('/api/admin/pagamentos', admin, async (req, res) => {
  const { membroId, tipo, referencia, valor, categoria } = req.body;
  const t = tipo === 'gira_extra' ? 'gira_extra' : tipo === 'outro' ? 'outro' : 'mensalidade';
  await col('pagamentos').insertOne({
    membroId, tipo: t,
    categoria: categoria === 'fixo' || categoria === 'variavel' ? categoria : (t === 'mensalidade' ? 'fixo' : 'variavel'),
    referencia, valor: Number(valor) || 0, status: 'pendente', dataPagamento: null,
  });
  res.json({ ok: true });
});

/* gera as mensalidades pendentes de um mês para todos os filhos ativos (idempotente):
   ao abrir o mês no painel, todo filho já aparece como pendente. */
app.post('/api/admin/pagamentos/gerar-mes', admin, async (req, res) => {
  const { mes, valor, atualizarValor } = req.body; // mes: 'AAAA-MM'
  if (!/^\d{4}-\d{2}$/.test(mes || '')) return res.status(400).json({ erro: 'Informe o mês no formato AAAA-MM.' });
  const filhos = (await col('membros').find({ ativo: true }).toArray()).filter((m) => m.papel !== 'admin');
  const existentes = await col('pagamentos').find({ tipo: 'mensalidade', referencia: mes }).toArray();
  const valorNum = Number(valor) || 0;
  let criadas = 0, atualizadas = 0, duplicadasRemovidas = 0;

  /* limpa duplicidades do mesmo mês (uma mensalidade por filho) */
  const vistos = new Map();
  for (const p of existentes) {
    const chave = String(p.membroId);
    if (!vistos.has(chave)) { vistos.set(chave, p); continue; }
    /* mantém a que já estiver paga; a outra sai */
    const guardada = vistos.get(chave);
    const manter = guardada.status === 'pago' ? guardada : (p.status === 'pago' ? p : guardada);
    const remover = manter === guardada ? p : guardada;
    await col('pagamentos').deleteOne({ _id: remover._id });
    vistos.set(chave, manter);
    duplicadasRemovidas++;
  }

  for (const f of filhos) {
    const existente = vistos.get(String(f._id));
    if (existente) {
      /* corrigir o valor da mensalidade do mês (só o que ainda está pendente) */
      if (atualizarValor && existente.status === 'pendente' && Number(existente.valor) !== valorNum) {
        await col('pagamentos').updateOne({ _id: existente._id }, { $set: { valor: valorNum } });
        atualizadas++;
      }
      continue;
    }
    await col('pagamentos').insertOne({
      membroId: String(f._id), tipo: 'mensalidade', categoria: 'fixo',
      referencia: mes, valor: valorNum, status: 'pendente', dataPagamento: null,
    });
    criadas++;
  }
  res.json({ ok: true, criadas, atualizadas, duplicadasRemovidas });
});
app.delete('/api/admin/pagamentos/:id', admin, async (req, res) => {
  await col('pagamentos').deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

/* --- financeiro: gastos da casa (inclusive o que a administração pagou do próprio bolso) --- */
app.get('/api/admin/gastos', admin, async (req, res) => {
  res.json(await col('gastos').find({}).sort({ data: -1 }).toArray());
});
app.post('/api/admin/gastos', admin, async (req, res) => {
  const { descricao, categoria, valor, data, pagoPor, recorrente } = req.body;
  if (!descricao?.trim()) return res.status(400).json({ erro: 'Descreva o gasto.' });
  await col('gastos').insertOne({
    descricao, categoria: categoria === 'fixo' ? 'fixo' : 'variavel',
    valor: Number(valor) || 0, data: data || new Date().toISOString().slice(0, 10),
    pagoPor: pagoPor === 'administracao' ? 'administracao' : 'caixa',
    /* recorrente = repete todo mês (aluguel, luz...). O lançamento de cada
       mês é criado pelo botão "Lançar gastos fixos do mês". */
    recorrente: !!recorrente,
  });
  res.json({ ok: true });
});

/* marca/desmarca um gasto como recorrente (todo mês) */
app.put('/api/admin/gastos/:id', admin, async (req, res) => {
  const set = {};
  if (req.body.recorrente !== undefined) set.recorrente = !!req.body.recorrente;
  if (req.body.valor !== undefined) set.valor = Number(req.body.valor) || 0;
  await col('gastos').updateOne({ _id: req.params.id }, { $set: set });
  res.json({ ok: true });
});

/* lança, no mês escolhido, todos os gastos marcados como recorrentes
   que ainda não tenham lançamento naquele mês (idempotente) */
app.post('/api/admin/gastos/gerar-mes', admin, async (req, res) => {
  const { mes } = req.body; // 'AAAA-MM'
  if (!/^\d{4}-\d{2}$/.test(mes || '')) return res.status(400).json({ erro: 'Informe o mês no formato AAAA-MM.' });
  const gastos = await col('gastos').find({}).toArray();
  const recorrentes = gastos.filter((g) => g.recorrente);
  const doMes = gastos.filter((g) => (g.data || '').slice(0, 7) === mes);
  let criados = 0;
  for (const r of recorrentes) {
    if (doMes.some((g) => g.descricao === r.descricao)) continue;
    await col('gastos').insertOne({
      descricao: r.descricao, categoria: r.categoria, valor: r.valor,
      data: `${mes}-05`, pagoPor: r.pagoPor, recorrente: false, origemRecorrente: true,
    });
    criados++;
  }
  res.json({ ok: true, criados, recorrentes: recorrentes.length });
});
app.delete('/api/admin/gastos/:id', admin, async (req, res) => {
  await col('gastos').deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});
app.put('/api/admin/pagamentos/:id', admin, async (req, res) => {
  const { status } = req.body;
  await col('pagamentos').updateOne(
    { _id: req.params.id },
    { $set: { status, dataPagamento: status === 'pago' ? new Date().toISOString() : null } }
  );
  res.json({ ok: true });
});

/* --- documentos --- */
app.post('/api/admin/documentos', admin, async (req, res) => {
  const { titulo, conteudo } = req.body;
  if (!titulo || !conteudo) return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
  await col('documentos').insertOne({ titulo, conteudo, data: new Date().toISOString(), assinaturas: [] });
  res.json({ ok: true });
});

/* --- certificados (emissão) --- */
app.get('/api/admin/certificados', admin, async (req, res) => {
  const certs = await col('certificados').find({}).sort({ data: -1 }).toArray();
  const membros = await col('membros').find({}).toArray();
  res.json(certs.map((c) => ({
    ...c, membroNome: membros.find((m) => m._id === c.membroId)?.nome || '?',
  })));
});
app.post('/api/admin/certificados', admin, async (req, res) => {
  const { membroId, titulo, descricao, data } = req.body;
  if (!membroId || !titulo) return res.status(400).json({ erro: 'Escolha o membro e o título do certificado.' });
  await col('certificados').insertOne({ membroId, titulo, descricao: descricao || '', data: data || new Date().toISOString().slice(0, 10) });
  res.json({ ok: true });
});

/* --- apostilas (upload) --- */
app.post('/api/admin/apostilas', admin, upApostila.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Envie um arquivo PDF.' });
  await col('apostilas').insertOne({
    titulo: req.body.titulo || req.file.originalname.replace(/\.pdf$/i, ''),
    descricao: req.body.descricao || '', arquivo: req.file.filename, data: new Date().toISOString(),
  });
  res.json({ ok: true });
});
app.delete('/api/admin/apostilas/:id', admin, async (req, res) => {
  const a = await col('apostilas').findOne({ _id: req.params.id });
  if (a) {
    try { fs.unlinkSync(path.join(__dirname, 'uploads', 'apostilas', a.arquivo)); } catch {}
    await col('apostilas').deleteOne({ _id: req.params.id });
  }
  res.json({ ok: true });
});

/* --- galeria (upload) --- */
app.post('/api/admin/galeria', admin, upFoto.single('foto'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Envie uma imagem.' });
  await col('galeria').insertOne({ legenda: req.body.legenda || '', arquivo: req.file.filename, data: new Date().toISOString() });
  res.json({ ok: true });
});
app.delete('/api/admin/galeria/:id', admin, async (req, res) => {
  const f = await col('galeria').findOne({ _id: req.params.id });
  if (f) {
    try { fs.unlinkSync(path.join(__dirname, 'uploads', 'galeria', f.arquivo)); } catch {}
    await col('galeria').deleteOne({ _id: req.params.id });
  }
  res.json({ ok: true });
});

/* --- notificações da administração (mudanças de perfil, certificados retirados...) --- */
app.get('/api/admin/notificacoes', admin, async (req, res) => {
  const ns = await col('notificacoes').find({}).sort({ data: -1 }).toArray();
  res.json({ lista: ns.slice(0, 200), naoLidas: ns.filter((n) => !n.lida).length });
});
app.put('/api/admin/notificacoes/lidas', admin, async (req, res) => {
  const ns = await col('notificacoes').find({ lida: false }).toArray();
  for (const n of ns) await col('notificacoes').updateOne({ _id: n._id }, { $set: { lida: true } });
  res.json({ ok: true });
});

/* --- certificados: lista do admin agora diz se o filho retirou --- */

/* ===================================================================
   RELATÓRIO FINANCEIRO — consolidado mês a mês, com percentuais
   =================================================================== */
/* mês de competência de um recebimento: a referência quando for AAAA-MM
   (mensalidades) ou, para lançamentos avulsos ("Festa de Omolu"), o mês em
   que foi pago — assim nada fica de fora do consolidado. */
const categoriaDe = (p) => p.categoria || (p.tipo === 'mensalidade' ? 'fixo' : 'variavel');

function mesDoPagamento(p) {
  const ref = (p.referencia || '').slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(ref)) return ref;
  if (p.dataPagamento) return p.dataPagamento.slice(0, 7);
  return '';
}

app.get('/api/admin/relatorios/financeiro', admin, async (req, res) => {
  const pagamentos = await col('pagamentos').find({}).toArray();
  const gastos = await col('gastos').find({}).toArray();
  const membros = await col('membros').find({}).toArray();
  const soma = (l) => l.reduce((t, x) => t + (Number(x.valor) || 0), 0);
  const pct = (parte, total) => (total ? Math.round((100 * parte) / total) : 0);

  /* todos os meses que aparecem em recebimentos (referência AAAA-MM) ou gastos (data) */
  const meses = [...new Set([
    ...pagamentos.map(mesDoPagamento),
    ...gastos.map((g) => (g.data || '').slice(0, 7)),
  ])].filter((m) => /^\d{4}-\d{2}$/.test(m)).sort().reverse();

  const porMes = meses.map((mes) => {
    const pagsMes = pagamentos.filter((p) => mesDoPagamento(p) === mes);
    const mensalidades = pagsMes.filter((p) => p.tipo === 'mensalidade');
    const gastosMes = gastos.filter((g) => (g.data || '').slice(0, 7) === mes);
    const previsto = soma(pagsMes);
    const recebido = soma(pagsMes.filter((p) => p.status === 'pago'));
    const gastoCaixa = soma(gastosMes.filter((g) => g.pagoPor === 'caixa'));
    const gastoAdm = soma(gastosMes.filter((g) => g.pagoPor === 'administracao'));
    return {
      mes, previsto, recebido, pendente: previsto - recebido,
      percentualRecebido: pct(recebido, previsto),
      mensalidadesPagas: mensalidades.filter((p) => p.status === 'pago').length,
      mensalidadesTotal: mensalidades.length,
      percentualAdimplencia: pct(mensalidades.filter((p) => p.status === 'pago').length, mensalidades.length),
      receitaFixa: soma(pagsMes.filter((p) => categoriaDe(p) === 'fixo' && p.status === 'pago')),
      receitaVariavel: soma(pagsMes.filter((p) => categoriaDe(p) === 'variavel' && p.status === 'pago')),
      gastoFixo: soma(gastosMes.filter((g) => g.categoria === 'fixo')),
      gastoVariavel: soma(gastosMes.filter((g) => g.categoria === 'variavel')),
      gastoCaixa, gastoAdm,
      saldo: recebido - gastoCaixa,
      percentualGasto: pct(gastoCaixa, recebido),
    };
  });

  /* quem mais deve, para cobrança */
  const devedores = membros
    .filter((m) => m.papel !== 'admin')
    .map((m) => {
      const meus = pagamentos.filter((p) => p.membroId === m._id);
      const pendentes = meus.filter((p) => p.status === 'pendente');
      return {
        _id: m._id, nome: m.nome, email: m.email || '',
        pagos: meus.filter((p) => p.status === 'pago').length,
        total: meus.length,
        percentualEmDia: pct(meus.filter((p) => p.status === 'pago').length, meus.length),
        emAberto: soma(pendentes),
        mesesEmAberto: pendentes.map((p) => p.referencia).sort(),
      };
    })
    .filter((d) => d.total)
    .sort((a, b) => b.emAberto - a.emAberto || a.nome.localeCompare(b.nome));

  const recebidoTotal = soma(pagamentos.filter((p) => p.status === 'pago'));
  const gastoCaixaTotal = soma(gastos.filter((g) => g.pagoPor === 'caixa'));
  res.json({
    porMes, devedores,
    geral: {
      previsto: soma(pagamentos),
      recebido: recebidoTotal,
      pendente: soma(pagamentos.filter((p) => p.status === 'pendente')),
      percentualRecebido: pct(recebidoTotal, soma(pagamentos)),
      gastoCaixa: gastoCaixaTotal,
      gastoAdm: soma(gastos.filter((g) => g.pagoPor === 'administracao')),
      saldo: recebidoTotal - gastoCaixaTotal,
    },
  });
});

/* ===================================================================
   EXPORTAÇÃO — Excel (.xlsx) e CSV dos relatórios
   O PDF sai pelo próprio navegador ("Imprimir / salvar em PDF"),
   que respeita o layout dos cartazes e relatórios da tela.
   =================================================================== */
const XLSX = require('xlsx');

async function dadosRelatorio(tipo) {
  const membros = (await col('membros').find({}).toArray());
  const filhos = membros.filter((m) => m.papel !== 'admin');
  const gts = await col('gts').find({}).toArray();
  const nomeGt = (id) => gts.find((g) => g._id === id)?.nome || '';

  if (tipo === 'membros') {
    return {
      arquivo: 'membros',
      linhas: await (async () => {
        const base = await baseFrequencia();
        return membros.map((m) => {
        const f = resumoDaBase(base, m._id);
        return {
          Nome: m.nome, Usuário: m.usuario, Papel: m.papel, Ativo: m.ativo ? 'sim' : 'não',
          Grau: m.grau ?? '', Nascimento: m.nascimento || '', 'E-mail': m.email || '',
          Telefone: m.telefone || '', Endereço: m.endereco || '',
          'Orixá de frente': m.orixas?.frente || '', 'Orixá juntó': m.orixas?.junto || '',
          Padrinhos: padrinhosTexto(m.padrinhos).join(', '),
          Entidades: (m.entidades || []).map((e) => `${e.linha}: ${e.nome}`).join(' · '),
          GT: nomeGt(m.gtId),
          'Assiduidade %': f.percentual, 'Faltas não justificadas': f.faltasNaoJustificadas,
          Situação: f.situacao,
        };
        });
      })(),
    };
  }

  if (tipo === 'entidades') {
    const linhas = [];
    for (const m of membros) {
      for (const e of m.entidades || []) {
        linhas.push({ Linha: e.linha, Entidade: e.nome, Médium: m.nome, Grau: m.grau ?? '' });
      }
    }
    linhas.sort((a, b) => a.Linha.localeCompare(b.Linha) || a.Entidade.localeCompare(b.Entidade));
    return { arquivo: 'entidades', linhas };
  }

  if (tipo === 'frequencia') {
    const eventos = await col('eventos').find({ encerrada: true }).sort({ data: 1 }).toArray();
    const freq = await col('frequencia').find({}).toArray();
    return {
      arquivo: 'frequencia',
      linhas: await (async () => {
        const base = await baseFrequencia();
        return filhos.map((m) => {
        const f = resumoDaBase(base, m._id);
        const linha = { Membro: m.nome, Grau: m.grau ?? '' };
        for (const e of eventos) {
          linha[`${e.data} ${e.titulo}`.slice(0, 40)] =
            freq.some((x) => x.eventoId === e._id && x.membroId === m._id) ? 'P' : 'F';
        }
        linha['Presenças'] = f.compareceu;
        linha['Assiduidade %'] = f.percentual;
        linha['Faltas justificadas'] = f.faltasJustificadas;
        linha['Faltas não justificadas'] = f.faltasNaoJustificadas;
        linha['Situação'] = f.situacao;
        return linha;
        });
      })(),
    };
  }

  if (tipo === 'pagamentos') {
    const pagamentos = await col('pagamentos').find({}).sort({ referencia: -1 }).toArray();
    return {
      arquivo: 'pagamentos',
      linhas: pagamentos.map((p) => ({
        Membro: membros.find((m) => m._id === p.membroId)?.nome || '?',
        Referência: p.referencia, Tipo: p.tipo,
        Categoria: p.categoria || (p.tipo === 'mensalidade' ? 'fixo' : 'variavel'),
        Valor: p.valor, Situação: p.status,
        'Pago em': p.dataPagamento ? p.dataPagamento.slice(0, 10) : '',
      })),
    };
  }

  if (tipo === 'gastos') {
    const gastos = await col('gastos').find({}).sort({ data: -1 }).toArray();
    return {
      arquivo: 'gastos',
      linhas: gastos.map((g) => ({
        Data: g.data, Descrição: g.descricao, Categoria: g.categoria,
        'Pago por': g.pagoPor === 'administracao' ? 'administração (por fora)' : 'caixa',
        Valor: g.valor,
      })),
    };
  }

  /* 'financeiro' é montado na própria rota de exportação (consolidado por mês) */
  return null;
}

app.get('/api/admin/exportar/:tipo', admin, async (req, res) => {
  const { tipo } = req.params;
  const formato = req.query.formato === 'csv' ? 'csv' : 'xlsx';

  let dados;
  if (tipo === 'financeiro') {
    /* consolidado mês a mês, reaproveitando o mesmo cálculo da tela */
    const pagamentos = await col('pagamentos').find({}).toArray();
    const gastos = await col('gastos').find({}).toArray();
    const soma = (l) => l.reduce((t, x) => t + (Number(x.valor) || 0), 0);
    const meses = [...new Set([
      ...pagamentos.map(mesDoPagamento),
      ...gastos.map((g) => (g.data || '').slice(0, 7)),
    ])].filter((m) => /^\d{4}-\d{2}$/.test(m)).sort().reverse();
    dados = {
      arquivo: 'financeiro-por-mes',
      linhas: meses.map((mes) => {
        const pagsMes = pagamentos.filter((p) => mesDoPagamento(p) === mes);
        const gastosMes = gastos.filter((g) => (g.data || '').slice(0, 7) === mes);
        const previsto = soma(pagsMes);
        const recebido = soma(pagsMes.filter((p) => p.status === 'pago'));
        const gastoCaixa = soma(gastosMes.filter((g) => g.pagoPor === 'caixa'));
        return {
          Mês: mes, Previsto: previsto, Recebido: recebido, Pendente: previsto - recebido,
          '% recebido': previsto ? Math.round((100 * recebido) / previsto) : 0,
          'Gastos do caixa': gastoCaixa,
          'Gastos da administração': soma(gastosMes.filter((g) => g.pagoPor === 'administracao')),
          'Gastos fixos': soma(gastosMes.filter((g) => g.categoria === 'fixo')),
          'Gastos variáveis': soma(gastosMes.filter((g) => g.categoria === 'variavel')),
          Saldo: recebido - gastoCaixa,
        };
      }),
    };
  } else {
    dados = await dadosRelatorio(tipo);
  }
  if (!dados) return res.status(404).json({ erro: 'Relatório não encontrado.' });
  if (!dados.linhas.length) dados.linhas = [{ Aviso: 'Sem dados para este relatório.' }];

  const hoje = new Date().toISOString().slice(0, 10);
  const nome = `tuulli-${dados.arquivo}-${hoje}`;
  const planilha = XLSX.utils.json_to_sheet(dados.linhas);

  if (formato === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(planilha, { FS: ';' });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}.csv"`);
    return res.send('\ufeff' + csv); // BOM: acentos corretos no Excel
  }
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, dados.arquivo.slice(0, 28));
  const buffer = XLSX.write(livro, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nome}.xlsx"`);
  res.send(buffer);
});

/* --- indicações da casa (mostradas no site público, editadas pela administração) --- */
app.get('/api/public/indicacoes', async (req, res) => {
  res.json(await col('indicacoes').find({}).sort({ titulo: 1 }).toArray());
});
app.post('/api/admin/indicacoes', admin, async (req, res) => {
  const { titulo, descricao, link } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ erro: 'Dê um título à indicação.' });
  await col('indicacoes').insertOne({ titulo, descricao: descricao || '', link: link || '' });
  res.json({ ok: true });
});
app.delete('/api/admin/indicacoes/:id', admin, async (req, res) => {
  await col('indicacoes').deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

/* ---------------- fallback do SPA (React) ----------------
   Qualquer rota que não seja /api ou /uploads devolve o index.html
   do build do Vite (server/public), deixando o React Router assumir. */
const indexHtml = path.join(__dirname, 'public', 'index.html');
app.get(/^\/(?!api\/|uploads\/).*/, (req, res, next) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  res.status(503).send('Front ainda não construído. Rode "npm run build" na pasta web/ (ou use o modo dev do Vite).');
});

/* ---------------- inicialização ---------------- */
ready.then(seed).then(() => {
  app.listen(PORT, () => console.log(`\nTUULLI no ar: http://localhost:${PORT}\nLogin admin: admin / 123456\n`));
});
