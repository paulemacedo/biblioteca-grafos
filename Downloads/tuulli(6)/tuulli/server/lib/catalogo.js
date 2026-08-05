/**
 * Catálogo fixo da casa: linhas de entidade e orixás.
 *
 * Por que existe: se cada um digitar do seu jeito ("baiano", "Baianos",
 * "povo da bahia"), o relatório fica quebrado. Aqui a linha é sempre
 * escolhida de uma lista; o que o filho digita é só o NOME da entidade
 * ("Maria Padilha", "Vô Benedito").
 *
 * `normalizaLinha` ainda entende os apelidos mais comuns, para acertar
 * o que veio da planilha antiga ou de versões anteriores do sistema.
 */

const LINHAS = [
  'Caboclo',
  'Preto Velho',
  'Criança/Erê',
  'Baiano/Cangaço',
  'Boiadeiro',
  'Marinheiro',
  'Povo Cigano',
  'Malandragem',
  'Exu',
  'Pombogira',
  'Exu-Mirim',
  'Outras',
];

/* Qualidades e orixás tratados separadamente, como a casa trabalha:
   Omolu e Obaluaiê não se confundem, nem Oxaguiã e Oxalufã. */
const ORIXAS = [
  'Oxalá', 'Oxaguiã', 'Oxalufã',
  'Omolu', 'Obaluaiê',
  'Iemanjá', 'Oxum', 'Iansã', 'Xangô', 'Ogum', 'Oxóssi',
  'Nanã', 'Oxumarê', 'Ibejis', 'Logun Edé', 'Obá', 'Ewá',
  'Exu (Orixá)',
];

/* Grafias que aparecem nos formulários e devem cair no nome oficial.
   É o que faz "oxaguiã" e "oxaguian" virarem a mesma coisa. */
const APELIDOS_ORIXA = {
  oxaguia: 'Oxaguiã', oxaguian: 'Oxaguiã', oxaguiam: 'Oxaguiã', oxoguia: 'Oxaguiã',
  oxalufa: 'Oxalufã', oxalufan: 'Oxalufã', oxalufam: 'Oxalufã',
  omulu: 'Omolu', omolu: 'Omolu',
  obaluae: 'Obaluaiê', obaluaie: 'Obaluaiê', obaluaye: 'Obaluaiê', abaluaie: 'Obaluaiê', xapana: 'Obaluaiê',
  iansa: 'Iansã', oya: 'Iansã', oia: 'Iansã',
  iemanja: 'Iemanjá', yemanja: 'Iemanjá', janaina: 'Iemanjá',
  oxossi: 'Oxóssi', oxosse: 'Oxóssi', ode: 'Oxóssi',
  xango: 'Xangô', chango: 'Xangô',
  oxum: 'Oxum', osun: 'Oxum',
  ogum: 'Ogum', ogun: 'Ogum',
  nana: 'Nanã', nanaburuque: 'Nanã',
  oxumare: 'Oxumarê', ossumare: 'Oxumarê',
  ibeji: 'Ibejis', ibejis: 'Ibejis',
  logunede: 'Logun Edé', logumede: 'Logun Edé',
  oba: 'Obá', ewa: 'Ewá',
  oxala: 'Oxalá', obatala: 'Oxalá',
  exu: 'Exu (Orixá)',
};

const norm = (t) => (t || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '').trim();

/* apelidos → linha oficial (singular/plural, grafias alternativas) */
const APELIDOS = {
  caboclo: 'Caboclo', caboclos: 'Caboclo', cabocla: 'Caboclo', caboclas: 'Caboclo',
  pretovelho: 'Preto Velho', pretosvelhos: 'Preto Velho', pretavelha: 'Preto Velho', pretosevelhos: 'Preto Velho',
  crianca: 'Criança/Erê', criancas: 'Criança/Erê', ere: 'Criança/Erê', eres: 'Criança/Erê', criancaoueere: 'Criança/Erê',
  baiano: 'Baiano/Cangaço', baianos: 'Baiano/Cangaço', baiana: 'Baiano/Cangaço', cangaco: 'Baiano/Cangaço',
  baianoecangaco: 'Baiano/Cangaço', baianoeoucangaco: 'Baiano/Cangaço',
  boiadeiro: 'Boiadeiro', boiadeiros: 'Boiadeiro',
  marinheiro: 'Marinheiro', marinheiros: 'Marinheiro',
  cigano: 'Povo Cigano', ciganos: 'Povo Cigano', cigana: 'Povo Cigano', povocigano: 'Povo Cigano',
  malandro: 'Malandragem', malandros: 'Malandragem', malandragem: 'Malandragem',
  exu: 'Exu', exus: 'Exu',
  pombogira: 'Pombogira', pombagira: 'Pombogira', pombogiras: 'Pombogira', pombagiras: 'Pombogira',
  exumirim: 'Exu-Mirim', exusmirins: 'Exu-Mirim', exumirins: 'Exu-Mirim',
  outras: 'Outras', outros: 'Outras', outrasentidades: 'Outras',
};

function normalizaLinha(texto) {
  const n = norm(texto);
  if (!n) return 'Outras';
  const oficial = LINHAS.find((l) => norm(l) === n);
  if (oficial) return oficial;
  if (APELIDOS[n]) return APELIDOS[n];
  const parcial = Object.keys(APELIDOS).find((k) => n.includes(k) || k.includes(n));
  return parcial ? APELIDOS[parcial] : 'Outras';
}

function normalizaOrixa(texto) {
  const n = norm(texto);
  if (!n) return '';
  const oficial = ORIXAS.find((o) => norm(o) === n);
  if (oficial) return oficial;
  if (APELIDOS_ORIXA[n]) return APELIDOS_ORIXA[n];
  /* casa pelo começo do nome: "oxagui..." → Oxaguiã */
  const parcial = Object.keys(APELIDOS_ORIXA)
    .sort((a, b) => b.length - a.length)
    .find((k) => n.startsWith(k) || k.startsWith(n));
  return parcial ? APELIDOS_ORIXA[parcial] : (texto || '').trim();
}

/* true quando o texto corresponde a um orixá do catálogo */
const orixaConhecido = (t) => ORIXAS.includes(normalizaOrixa(t));

/* Respostas que, na prática, significam "não informado".
   Vinham do formulário e poluíam os relatórios de entidades. */
const RESPOSTAS_VAZIAS = new Set([
  'naosei', 'nsei', 'naisei', 'naosei2', 'aindanaosei', 'aindanao', 'naoseiainda',
  'nao', 'naotem', 'naotenho', 'naohatem', 'semnome', 'seminformacao', 'naoinformado',
  'nenhum', 'nenhuma', 'nada', 'naodescobri', 'naoconheco', 'desconhecido',
  'ns', 'nsa', 'na', 'ne', 'x', 'xx', 'xxx', '-', '--', '?', '??', '...', '.',
  'naotwm', 'naotem2', 'naoseiaindanao', 'sn',
]);

/* nome de entidade que não diz nada: descartado dos relatórios */
function nomeVazio(texto) {
  const t = String(texto || '').trim();
  if (!t) return true;
  const n = norm(t);
  if (!n) return true;
  if (RESPOSTAS_VAZIAS.has(n)) return true;
  /* uma letra só ("N", "S") não é nome de entidade — mas "Zé" é */
  if (n.length <= 1) return true;
  /* começa com "não sei", "ainda não", "não descobri"... */
  if (/^(naosei|aindanao|naodescobri|naoconheco|naotenho|naotem|semnome)/.test(n)) return true;
  return false;
}

/* entidades sempre gravadas como { linha (do catálogo), nome } */
function normalizaEntidades(lista) {
  return (lista || [])
    .map((e) => ({ linha: normalizaLinha(e.linha), nome: String(e.nome || '').trim() }))
    .filter((e) => e.nome && !nomeVazio(e.nome));
}

/* padrinhos: { orixas: [...], pessoas: [{ nome, membroId|null }] } */
function normalizaPadrinhos(p) {
  const orixas = (p?.orixas || []).map(normalizaOrixa).filter(Boolean);
  const pessoas = (p?.pessoas || []).map((x) =>
    typeof x === 'string'
      ? { nome: x.trim(), membroId: null }          // formato antigo (texto livre)
      : { nome: String(x.nome || '').trim(), membroId: x.membroId || null }
  ).filter((x) => x.nome);
  return { orixas, pessoas };
}

/* nomes de padrinhos como texto simples (relatórios e comparações) */
const padrinhosTexto = (p) => [
  ...(p?.orixas || []),
  ...(p?.pessoas || []).map((x) => (typeof x === 'string' ? x : x.nome)),
];

module.exports = {
  LINHAS, ORIXAS, APELIDOS_ORIXA, orixaConhecido, nomeVazio,
  normalizaLinha, normalizaOrixa,
  normalizaEntidades, normalizaPadrinhos, padrinhosTexto,
};
