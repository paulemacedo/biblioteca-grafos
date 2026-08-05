/**
 * Popula o banco com dados de demonstração na primeira execução.
 * Apague data/db.json para recomeçar do zero.
 *
 * Os dados da casa (nome, dirigente, endereço) são reais; os filhos,
 * giras, pagamentos e demais registros são exemplos para demonstração
 * e podem ser apagados/editados pela administração.
 */
const { col } = require('./db');
const { hashSenha } = require('./auth');

async function seed() {
  if (await col('config').findOne({ _id: 'casa' })) return; // já populado

  console.log('[seed] Primeira execução — criando dados de demonstração...');

  await col('config').insertOne({
    _id: 'casa',
    nome: 'Templo de Umbanda Universalista Luz de Lion',
    sigla: 'TUULLI',
    slogan: 'Casa de Omolu — Zona Norte, Rio de Janeiro',
    selo: 'LUZ DE LION · CASA DE OMOLU · ATOTÔ · SARAVÁ · ',
    fundamentos:
      'O TUULLI é uma casa de Umbanda universalista, firmada nos fundamentos de Omolu, ' +
      'orixá regente do templo. Trabalhamos com caridade sem ver a quem, respeito às linhas ' +
      'de trabalho e estudo constante da doutrina. As giras são abertas ao público e a ' +
      'consulta é gratuita. Este texto é editável pela administração na área interna.',
    maeDeSanto: {
      nome: 'Mãe Karoline Miranda',
      texto:
        'Dirigente espiritual do Templo de Umbanda Universalista Luz de Lion, conduz as giras, ' +
        'os desenvolvimentos mediúnicos e a formação dos filhos da casa. ' +
        'Este texto de apresentação é editável pela administração.',
    },
    endereco:
      'R. Conselheiro Agostinho, 52 — Todos os Santos, Rio de Janeiro / RJ — CEP 20770-160',
    sede: 'na sede da União Espiritista de Umbanda do Brasil',
    horarios: 'Consulte a agenda de giras com a casa. Horários editáveis pela administração.',
    contatos: {
      whatsapp: '(21) 99999-0000',
      email: 'contato@tuulli.com.br',
      instagram: '@tuulli',
    },
  });

  /* ------------------------- Membros ------------------------- */
  const senha = hashSenha('123456');
  const membros = [
    {
      _id: 'adm', nome: 'Mãe Karoline Miranda', usuario: 'admin', senha,
      papel: 'admin', nascimento: '', grau: 7, email: 'mae@tuulli.com.br',
      orixas: { frente: 'Omolu', junto: '' },
      padrinhos: { orixas: [], pessoas: [] },
      entidades: [],
      ativo: true, gtId: null,
    },
    { nome: 'Ana Beatriz Souza', usuario: 'ana', papel: 'filho', nascimento: '1994-07-21', grau: 6, email: 'ana@exemplo.com',
      orixas: { frente: 'Iansã', junto: 'Ogum' },
      padrinhos: { orixas: ['Iansã'], pessoas: ['Mãe Karoline Miranda', 'Caboclo Sete Flechas (entidade)'] },
      entidades: [{ linha: 'Caboclo', nome: 'Cabocla Iara' }] },
    { nome: 'Bruno Ferreira Lima', usuario: 'bruno', papel: 'filho', nascimento: '1988-01-05', grau: 6, email: 'bruno@exemplo.com',
      orixas: { frente: 'Ogum', junto: 'Iemanjá' },
      padrinhos: { orixas: ['Ogum'], pessoas: ['Mãe Karoline Miranda'] },
      entidades: [{ linha: 'Exu', nome: 'Exu Tranca Ruas' }, { linha: 'Boiadeiro', nome: 'Boiadeiro Navizala' }] },
    { nome: 'Carla Mendes', usuario: 'carla', papel: 'filho', nascimento: '1999-11-30', grau: 4, email: 'carla@exemplo.com',
      orixas: { frente: 'Iemanjá', junto: 'Oxóssi' },
      padrinhos: { orixas: ['Iemanjá'], pessoas: ['Ana Beatriz Souza'] },
      entidades: [{ linha: 'Criança/Erê', nome: 'Mariazinha' }] },
    { nome: 'Diego Santana', usuario: 'diego', papel: 'filho', nascimento: '1991-04-17', grau: 5, email: 'diego@exemplo.com',
      orixas: { frente: 'Oxóssi', junto: 'Oxum' },
      padrinhos: { orixas: ['Oxóssi'], pessoas: ['Bruno Ferreira Lima'] },
      entidades: [{ linha: 'Caboclo', nome: 'Caboclo Pena Branca' }] },
    { nome: 'Elisa Rocha', usuario: 'elisa', papel: 'filho', nascimento: '1985-09-09', grau: 6, email: 'elisa@exemplo.com',
      orixas: { frente: 'Nanã', junto: 'Omolu' },
      padrinhos: { orixas: ['Nanã'], pessoas: ['Mãe Karoline Miranda'] },
      entidades: [{ linha: 'Preto Velho', nome: 'Vó Cambinda' }] },
    { nome: 'Fábio Nogueira', usuario: 'fabio', papel: 'filho', nascimento: '2000-12-02', grau: 3, email: 'fabio@exemplo.com',
      orixas: { frente: 'Xangô', junto: 'Iansã' },
      padrinhos: { orixas: ['Xangô'], pessoas: ['Elisa Rocha'] },
      entidades: [{ linha: 'Baiano/Cangaço', nome: 'Zé do Coco' }] },
  ];
  const ids = {};
  for (const m of membros) {
    const doc = { senha, ativo: true, gtId: null, ...m };
    const r = await col('membros').insertOne(doc);
    ids[m.usuario] = doc._id || r.insertedId;
  }

  /* ------------------------- GTs ------------------------- */
  const gts = [
    { nome: 'Consultas', descricao: 'Médiuns de consulta e cambonagem dos consulentes', liderId: ids.ana, fixos: [ids.elisa], membros: [ids.ana, ids.elisa] },
    { nome: 'Passes', descricao: 'Médiuns de passe', liderId: null, membros: [ids.diego] },
    { nome: 'Apoio à Curimba', descricao: 'Atabaques e pontos cantados', liderId: ids.bruno, fixos: [], membros: [ids.bruno] },
    { nome: 'Defumação', descricao: 'Preparo das ervas e defumação dos trabalhos', liderId: ids.carla, membros: [ids.carla] },
    { nome: 'Organização da Mesa', descricao: 'Organizar a mesa e servir as comidas', liderId: null, membros: [ids.fabio] },
    { nome: 'Limpeza', descricao: 'Cuidado com o terreiro antes e depois dos trabalhos', liderId: null, membros: [] },
  ];
  for (const g of gts) {
    const r = await col('gts').insertOne(g);
    for (const mid of g.membros) {
      await col('membros').updateOne({ _id: mid }, { $set: { gtId: g._id || r.insertedId } });
      await col('historicoGt').insertOne({ gtId: g._id || r.insertedId, membroId: mid, data: new Date().toISOString() });
    }
  }

  /* ------------------------- Eventos (calendário) ------------------------- */
  const hoje = new Date();
  const y = hoje.getFullYear(), mo = hoje.getMonth();
  const d = (dia, mesOffset = 0) => new Date(y, mo + mesOffset, dia).toISOString().slice(0, 10);
  const eventos = [
    { titulo: 'Gira de Caboclos', tipo: 'gira', data: d(-14 + hoje.getDate()), hora: '20:00', descricao: 'Gira pública com consulta', encerrada: true },
    { titulo: 'Gira de Pretos Velhos', tipo: 'gira', data: d(-7 + hoje.getDate()), hora: '20:00', descricao: 'Gira pública com consulta', encerrada: true },
    { titulo: 'Desenvolvimento mediúnico', tipo: 'desenvolvimento', data: d(hoje.getDate() + 1), hora: '16:00', descricao: 'Somente filhos da casa', encerrada: false },
    { titulo: 'Gira de Baianos', tipo: 'gira', data: d(hoje.getDate() + 5), hora: '20:00', descricao: 'Gira pública com consulta', encerrada: false },
    { titulo: 'Festa de Omolu — gira extra', tipo: 'gira_extra', data: d(12, 1), hora: '18:00', descricao: 'Celebração do orixá regente da casa, com contribuição extra', encerrada: false },
  ];
  const evIds = [];
  for (const e of eventos) {
    const r = await col('eventos').insertOne(e);
    evIds.push(e._id || r.insertedId);
  }

  /* ------------------------- Frequência ------------------------- */
  const presencas = {
    [evIds[0]]: [ids.ana, ids.bruno, ids.carla, ids.diego, ids.elisa],
    [evIds[1]]: [ids.ana, ids.bruno, ids.elisa, ids.fabio],
  };
  for (const [eventoId, lista] of Object.entries(presencas)) {
    for (const membroId of lista) {
      await col('frequencia').insertOne({ eventoId, membroId, data: new Date().toISOString() });
    }
  }

  /* ------------------------- Escala de exemplo ------------------------- */
  await col('escalas').insertOne({
    eventoId: evIds[3],
    funcoes: [
      { nome: 'Consultas — Consulentes', obs: '',
        membros: [
          { membroId: ids.admin, nota: '', cambonagem: 'Fixo' },
          { membroId: ids.ana, nota: 'Líder', cambonoId: ids.fabio },
          { membroId: ids.elisa, nota: 'Fixo', cambonagem: 'Fixo' },
        ] },
      { nome: 'Passes', obs: '', membros: [{ membroId: ids.diego, nota: '' }] },
      { nome: 'Apoio à Curimba', obs: '', membros: [{ membroId: ids.bruno, nota: '' }] },
      { nome: 'Defumação', obs: 'Preparar ervas / defumar', membros: [{ membroId: ids.carla, nota: '' }] },
      { nome: 'Organização da Mesa', obs: 'Organizar a mesa e servir as comidas', membros: [{ membroId: ids.fabio, nota: '' }] },
    ],
  });

  /* ------------------------- Pagamentos ------------------------- */
  const mesRef = `${y}-${String(mo + 1).padStart(2, '0')}`;
  for (const u of ['ana', 'bruno', 'carla', 'diego', 'elisa', 'fabio']) {
    await col('pagamentos').insertOne({
      membroId: ids[u], tipo: 'mensalidade', referencia: mesRef, valor: 50,
      status: ['ana', 'bruno', 'elisa'].includes(u) ? 'pago' : 'pendente',
      dataPagamento: ['ana', 'bruno', 'elisa'].includes(u) ? new Date().toISOString() : null,
    });
  }
  await col('pagamentos').insertOne({
    membroId: ids.ana, tipo: 'gira_extra', referencia: 'Festa de Omolu', valor: 30,
    status: 'pago', dataPagamento: new Date().toISOString(),
  });

  /* ------------------------- FAQ ------------------------- */
  await col('faq').insertOne({
    autorId: ids.carla, titulo: 'Qual roupa devo usar na gira de desenvolvimento?',
    texto: 'Sou nova na casa e queria confirmar se é branco total ou se pode ter detalhes coloridos.',
    data: new Date().toISOString(),
    respostas: [
      { autorId: ids.ana, texto: 'Branco total, Carla! Guias só as que a Mãe Karoline autorizou.', data: new Date().toISOString() },
    ],
  });

  /* ------------------------- Documentos ------------------------- */
  await col('documentos').insertOne({
    titulo: 'Termo de compromisso do filho da casa',
    conteudo:
      'Eu, filho(a) do Templo de Umbanda Universalista Luz de Lion — TUULLI, comprometo-me a ' +
      'zelar pelos fundamentos, respeitar a hierarquia espiritual, manter assiduidade nas giras ' +
      'e desenvolvimentos e contribuir com o meu grupo de trabalho. Declaro estar ciente do ' +
      'regimento interno do templo.',
    data: new Date().toISOString(),
    assinaturas: [{ membroId: ids.ana, nome: 'Ana Beatriz Souza', data: new Date().toISOString() }],
  });

  /* ------------------------- Certificados ------------------------- */
  await col('certificados').insertOne({
    membroId: ids.ana, titulo: 'Curso de Fundamentos da Umbanda — Módulo I',
    descricao: 'Concluiu com aproveitamento o Módulo I do curso de fundamentos, com carga horária de 24 horas.',
    data: d(hoje.getDate() - 20),
  });

  /* ------------------------- Justificativas de falta ------------------------- */
  // Carla e Diego faltaram à Gira de Pretos Velhos (evIds[1])
  await col('justificativas').insertOne({
    eventoId: evIds[1], membroId: ids.carla,
    motivo: 'trabalho', texto: 'Peguei plantão de última hora.',
    status: 'pendente', data: new Date().toISOString(),
  });
  await col('justificativas').insertOne({
    eventoId: evIds[1], membroId: ids.diego,
    motivo: 'doenca', texto: 'Estava gripado, com febre.',
    status: 'aceita', data: new Date().toISOString(), respostaData: new Date().toISOString(),
  });

  /* ------------------------- Jogos de búzios ------------------------- */
  await col('buzios').insertOne({
    membroId: ids.ana, data: d(hoje.getDate() - 40),
    texto: 'Confirmação de Iansã na frente com Ogum de juntó. Orientado banho de ervas quentes e firmeza semanal.',
  });
  await col('buzios').insertOne({
    membroId: ids.ana, data: d(hoje.getDate() - 5),
    texto: 'Caminho aberto para o desenvolvimento com a Cabocla Iara. Reforçar presença nas giras de caboclo.',
  });

  /* ------------------------- Gastos da casa ------------------------- */
  await col('gastos').insertOne({ descricao: 'Aluguel do galpão', categoria: 'fixo', valor: 400, data: d(5), pagoPor: 'caixa' });
  await col('gastos').insertOne({ descricao: 'Velas e ervas para as giras do mês', categoria: 'variavel', valor: 85.5, data: d(8), pagoPor: 'caixa' });
  await col('gastos').insertOne({ descricao: 'Flores da Festa de Omolu (adiantado pela Mãe Karol)', categoria: 'variavel', valor: 120, data: d(15), pagoPor: 'administracao' });

  /* ------------------------- Feedback de GT ------------------------- */
  await col('gts').updateOne({ nome: 'Consultas' }, { $push: { feedbacks: {
    id: 'fb1', texto: 'Cambonagem muito atenta na última gira — consulentes elogiaram o acolhimento.',
    data: new Date().toISOString(),
  } } });

  /* ------------------------- Indicações do site ------------------------- */
  await col('indicacoes').insertOne({
    titulo: 'Casa de ervas do Mercadão de Madureira',
    descricao: 'Onde a casa indica comprar ervas e defumadores. (Exemplo editável pela administração.)',
    link: '',
  });

  console.log('[seed] Pronto. Login admin: admin / 123456 — filhos: ana, bruno, carla, diego, elisa, fabio (senha 123456)');
}

module.exports = { seed };
