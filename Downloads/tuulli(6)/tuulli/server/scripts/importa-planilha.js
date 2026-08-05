#!/usr/bin/env node
/**
 * Importa a planilha de cadastro dos filhos (exportada do Microsoft Forms)
 * para o banco do sistema — o local (data/db.json) ou o MongoDB Atlas.
 *
 * COMO USAR
 * 1. Rode a partir da pasta server/ apontando para a planilha
 *    (aceita .xlsx do Excel/Forms direto, ou .csv):
 *        node scripts/importa-planilha.js caminho/para/planilha.xlsx
 *    Para importar direto no MongoDB Atlas, defina a variável antes:
 *        MONGODB_URI="mongodb+srv://..." node scripts/importa-planilha.js planilha.xlsx
 *    Para só conferir o que seria importado, sem gravar nada:
 *        node scripts/importa-planilha.js planilha.xlsx --simular
 * 2. O script mostra os logins criados (senha inicial: mudar123)
 *    e grava a lista completa em scripts/logins-importados.csv.
 *
 * Colunas reconhecidas (as demais são guardadas na "ficha" do membro):
 *   Nome Completo · Data de Nascimento · Endereço de email · Endereço ·
 *   Telefone para contato · Grau Atual · Orixás de Cabeça · Padrinho e Madrinha ·
 *   Caboclo (a) · Preto Velho (a) · Criança ou Erê · Povo Cigano · Exu ·
 *   Pombogira · Malandragem · Exu-Mirim · Baiano e/ou Cangaço · Outras Entidades ·
 *   Entidade Chefe de Coroa · Cultivo ... · Data Iniciação · Já é batizado? ·
 *   Data de Batismo · Padrinho e Madrinha de Batismo · Deseja se rebatizar ... ·
 *   Novo Padrinho e Madrinha ... · Trabalhos realizados:
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
process.chdir(path.join(__dirname, '..')); // roda a partir de server/
const { col, ready, flush } = require('../lib/db.js');
const { hashSenha } = require('../lib/auth.js');
const { normalizaLinha, normalizaOrixa } = require('../lib/catalogo.js');

/* ----------------------- leitura da planilha -----------------------
   .xlsx / .xls saem do Excel e do Microsoft Forms; .csv também serve. */
function leArquivo(arquivo) {
  if (/\.(xlsx|xlsm|xls)$/i.test(arquivo)) {
    const livro = XLSX.readFile(arquivo, { cellDates: true });
    const aba = livro.Sheets[livro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(aba, { header: 1, raw: true, defval: '' })
      .map((l) => l.map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? '').trim())))
      .filter((l) => l.some((c) => c));
  }
  let texto = fs.readFileSync(arquivo, 'utf8');
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1); // remove BOM
  return parseCsv(texto);
}

/* ----------------------- leitura do CSV ----------------------- */
function parseCsv(texto) {
  // detecta separador: Excel em português usa ';'
  const primeira = texto.split(/\r?\n/, 1)[0];
  const sep = (primeira.match(/;/g) || []).length >= (primeira.match(/,/g) || []).length ? ';' : ',';
  const linhas = [];
  let linha = [], campo = '', dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentro) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else dentro = false;
      } else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((x) => x.trim())) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); if (linha.some((x) => x.trim())) linhas.push(linha); }
  return linhas;
}

/* acha o índice da coluna cujo cabeçalho contém o trecho (sem acentos, minúsculo) */
const norm = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const achaColuna = (cabecalho, ...trechos) =>
  cabecalho.findIndex((c) => trechos.every((t) => norm(c).includes(norm(t))));

/* ----------------------- conversões ----------------------- */
function converteData(txt) {
  const t = String(txt ?? '').trim();
  if (!t || norm(t) === 'nao') return '';
  // número de série do Excel (ex.: 44471) — dias desde 30/12/1899
  if (/^\d{4,5}(\.\d+)?$/.test(t)) {
    const serial = Number(t);
    if (serial > 20000 && serial < 60000) {
      const base = Date.UTC(1899, 11, 30);
      return new Date(base + serial * 86400000).toISOString().slice(0, 10);
    }
  }
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/); // já ISO
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/); // dd/mm/aaaa (padrão brasileiro)
  if (m) {
    let [, d, mo, a] = m;
    if (a.length === 2) a = (Number(a) > 30 ? '19' : '20') + a;
    return `${a}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}
const extraiGrau = (txt) => {
  const m = (txt || '').match(/(\d+)/);
  return m ? Number(m[1]) : null;
};
function separaOrixas(txt) {
  // "Iansã e Ogum", "Oxóssi com Iemanjá", "Xangô / Oxum"...
  const partes = (txt || '').split(/\s+e\s+|\s+com\s+|\/|,|;/i).map((x) => x.trim()).filter(Boolean);
  return { frente: partes[0] || '', junto: partes.slice(1).join(' e ') || '' };
}
const separaLista = (txt) =>
  (txt || '').split(/\s+e\s+|\/|,|;|\n/i).map((x) => x.trim()).filter((x) => x && norm(x) !== 'nao');
const vazio = (txt) => !txt || !txt.trim() || ['nao', 'nao tem', 'nao possui', '-', 'x'].includes(norm(txt));

function usuarioDe(nome, existentes) {
  const partes = norm(nome).replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  let base = partes[0] || 'membro';
  if (existentes.has(base) && partes[1]) base = partes[0] + '.' + partes[1];
  let u = base, n = 2;
  while (existentes.has(u)) u = base + n++;
  existentes.add(u);
  return u;
}

/* ----------------------- importação ----------------------- */
async function main() {
  let arquivo = process.argv[2];
  if (!arquivo) {
    console.log('Uso: node scripts/importa-planilha.js caminho/para/planilha.xlsx [--simular]');
    process.exit(1);
  }
  /* procura o arquivo em vários lugares: como foi digitado, na pasta onde o
     script está (server/scripts), na pasta server/ e na raiz do projeto.
     Assim funciona mesmo quando o terminal está em outro diretório. */
  const candidatos = [
    arquivo,
    path.resolve(process.cwd(), arquivo),
    path.resolve(__dirname, arquivo),
    path.resolve(__dirname, '..', arquivo),
    path.resolve(__dirname, '..', '..', arquivo),
  ];
  const encontrado = candidatos.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } });

  if (!encontrado) {
    console.log('\nArquivo não encontrado: ' + arquivo);
    console.log('Procurei em:');
    for (const p of candidatos) console.log('  - ' + p);
    /* ajuda: mostra as planilhas que existem por perto */
    const pastas = [process.cwd(), __dirname, path.resolve(__dirname, '..')];
    const achadas = [];
    for (const dir of pastas) {
      try {
        for (const f of fs.readdirSync(dir)) {
          if (/\.(xlsx|xlsm|xls|csv)$/i.test(f)) achadas.push(path.join(dir, f));
        }
      } catch { /* pasta inacessível, ignora */ }
    }
    if (achadas.length) {
      console.log('\nPlanilhas que encontrei por perto (copie o caminho e use):');
      for (const f of [...new Set(achadas)]) console.log('  ' + f);
    }
    console.log('');
    process.exit(1);
  }
  if (encontrado !== arquivo) console.log('Usando: ' + encontrado);
  arquivo = encontrado;
  const simular = process.argv.includes('--simular');
  const linhas = leArquivo(arquivo);
  if (linhas.length < 2) { console.log('Planilha vazia ou não reconhecida.'); process.exit(1); }
  const cab = linhas[0];

  // mapeamento das colunas (por trecho do cabeçalho, tolerante a variações)
  const c = {
    nomeCompleto: achaColuna(cab, 'nome completo'),
    nome: achaColuna(cab, 'nome'),
    nascimento: achaColuna(cab, 'nascimento'),
    email: achaColuna(cab, 'endereco de email'),
    email2: achaColuna(cab, 'email'),
    endereco: cab.findIndex((x) => norm(x) === 'endereco'),
    telefone: achaColuna(cab, 'telefone'),
    grau: achaColuna(cab, 'grau'),
    orixas: achaColuna(cab, 'orixas de cabeca'),
    padrinhos: cab.findIndex((x) => norm(x).startsWith('padrinho e madrinha') && !norm(x).includes('batismo')),
    chefeCoroa: achaColuna(cab, 'chefe de coroa'),
    cultivo: achaColuna(cab, 'cultivo'),
    dataIniciacao: achaColuna(cab, 'data iniciacao'),
    batizado: achaColuna(cab, 'ja e batizado'),
    dataBatismo: achaColuna(cab, 'data de batismo'),
    padrinhosBatismo: achaColuna(cab, 'padrinho e madrinha de batismo'),
    rebatismo: achaColuna(cab, 'rebatizar'),
    novosPadrinhos: achaColuna(cab, 'novo padrinho'),
    trabalhos: achaColuna(cab, 'trabalhos realizados'),
  };
  const LINHAS_ENTIDADE = [
    ['Caboclo', achaColuna(cab, 'caboclo')],
    ['Preto Velho', achaColuna(cab, 'preto velho')],
    ['Criança/Erê', achaColuna(cab, 'crianca ou ere')],
    ['Povo Cigano', achaColuna(cab, 'povo cigano')],
    ['Exu', cab.findIndex((x) => norm(x) === 'exu')],
    ['Pombogira', achaColuna(cab, 'pombogira')],
    ['Malandragem', achaColuna(cab, 'malandragem')],
    ['Exu-Mirim', achaColuna(cab, 'exu-mirim')],
    ['Baiano/Cangaço', achaColuna(cab, 'baiano')],
    ['Outras', achaColuna(cab, 'outras entidades')],
  ];
  const pega = (linha, idx) => (idx >= 0 ? (linha[idx] || '').trim() : '');

  await ready;
  const existentes = await col('membros').find({}).toArray();
  const usuarios = new Set(existentes.map((m) => m.usuario));
  const emails = new Set(existentes.map((m) => norm(m.email || '')).filter(Boolean));
  const nomes = new Set(existentes.map((m) => norm(m.nome)));

  const criados = [], pulados = [];
  for (const linha of linhas.slice(1)) {
    const nome = pega(linha, c.nomeCompleto) || pega(linha, c.nome);
    if (!nome) continue;
    const email = pega(linha, c.email) || pega(linha, c.email2);
    if (nomes.has(norm(nome)) || (email && emails.has(norm(email)))) {
      pulados.push(nome);
      continue;
    }

    const entidades = [];
    for (const [linhaNome, idx] of LINHAS_ENTIDADE) {
      const valor = pega(linha, idx);
      if (vazio(valor)) continue;
      for (const nomeEnt of separaLista(valor)) entidades.push({ linha: normalizaLinha(linhaNome), nome: nomeEnt });
    }

    const usuario = usuarioDe(nome, usuarios);
    const membro = {
      nome,
      usuario,
      senha: hashSenha('mudar123'),
      papel: 'filho',
      ativo: true,
      gtId: null,
      nascimento: converteData(pega(linha, c.nascimento)),
      email: email || '',
      telefone: pega(linha, c.telefone),
      endereco: pega(linha, c.endereco),
      grau: extraiGrau(pega(linha, c.grau)),
      orixas: (() => {
        const o = separaOrixas(pega(linha, c.orixas));
        return { frente: normalizaOrixa(o.frente), junto: normalizaOrixa(o.junto) };
      })(),
      padrinhos: { orixas: [], pessoas: separaLista(pega(linha, c.padrinhos)).map((n) => ({ nome: n, membroId: null })) },
      entidades,
      ficha: {
        entidadeChefeDeCoroa: pega(linha, c.chefeCoroa),
        cultivo: pega(linha, c.cultivo),
        dataIniciacao: converteData(pega(linha, c.dataIniciacao)) || pega(linha, c.dataIniciacao),
        batizado: pega(linha, c.batizado),
        dataBatismo: converteData(pega(linha, c.dataBatismo)) || pega(linha, c.dataBatismo),
        padrinhosBatismo: pega(linha, c.padrinhosBatismo),
        rebatismo2026: pega(linha, c.rebatismo),
        novosPadrinhos: pega(linha, c.novosPadrinhos),
        trabalhos: pega(linha, c.trabalhos),
      },
    };
    if (!simular) await col('membros').insertOne(membro);
    nomes.add(norm(nome));
    if (email) emails.add(norm(email));
    criados.push({ nome, usuario });
  }

  flush(); // garante a gravação no banco local antes de encerrar
  console.log('\n===== ' + (simular ? 'SIMULAÇÃO (nada foi gravado)' : 'IMPORTAÇÃO CONCLUÍDA') + ' =====');
  console.log(`Criados: ${criados.length} · Pulados (já existiam): ${pulados.length}\n`);
  if (criados.length) {
    console.log('LOGINS CRIADOS (senha inicial: mudar123 — peça para trocarem no primeiro acesso):');
    for (const m of criados) console.log(`  ${m.usuario.padEnd(20)} ${m.nome}`);
  }
  if (pulados.length) console.log('\nJá existiam (não alterados): ' + pulados.join(', '));
  if (criados.length && !simular) {
    const csv = 'usuario;senha;nome\n' + criados.map((m) => `${m.usuario};mudar123;${m.nome}`).join('\n');
    const saida = path.join(__dirname, 'logins-importados.csv');
    fs.writeFileSync(saida, '\ufeff' + csv, 'utf8');
    console.log(`\nLista de logins salva em: ${saida}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error('Erro na importação:', e.message); process.exit(1); });
