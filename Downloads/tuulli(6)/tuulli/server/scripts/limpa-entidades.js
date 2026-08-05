/**
 * Remove das fichas as "entidades" que na verdade são respostas vazias
 * do formulário: "Não sei", "N", "S", "N/S", "-", "?" e afins.
 *
 * COMO USAR (a partir da pasta server/, com as variáveis do Atlas definidas):
 *   node scripts/limpa-entidades.js            → só mostra o que seria removido
 *   node scripts/limpa-entidades.js --limpar   → remove de verdade
 *
 * As entidades com nome de verdade não são tocadas.
 */
const { col, ready, flush } = require('../lib/db.js');
const { nomeVazio, normalizaLinha } = require('../lib/catalogo.js');

async function main() {
  const limpar = process.argv.includes('--limpar');
  await ready;

  const membros = await col('membros').find({}).toArray();
  const remover = [];   // { membro, linha, nome }
  const relinhar = [];  // linhas fora do catálogo, que serão padronizadas
  let comEntidades = 0;

  for (const m of membros) {
    const lista = m.entidades || [];
    if (lista.length) comEntidades++;
    for (const e of lista) {
      if (nomeVazio(e.nome)) { remover.push({ membro: m.nome, linha: e.linha, nome: e.nome }); continue; }
      const oficial = normalizaLinha(e.linha);
      if (oficial !== e.linha) relinhar.push({ membro: m.nome, de: e.linha, para: oficial, nome: e.nome });
    }
  }

  console.log(`\nMembros com entidades cadastradas: ${comEntidades}`);
  console.log(`\n=== SERÃO REMOVIDAS (${remover.length}) ===`);
  if (remover.length) {
    for (const r of remover) console.log(`  "${r.nome}"  (${r.linha}) — ${r.membro}`);
  } else console.log('  (nenhuma — está tudo limpo)');

  console.log(`\n=== LINHAS QUE SERÃO PADRONIZADAS (${relinhar.length}) ===`);
  if (relinhar.length) {
    for (const r of relinhar) console.log(`  "${r.de}" → "${r.para}"   (${r.nome} — ${r.membro})`);
  } else console.log('  (nenhuma)');

  if (!limpar) {
    console.log('\n===== APENAS CONFERÊNCIA — nada foi alterado =====');
    console.log('Rode com --limpar para remover de verdade.\n');
    process.exit(0);
  }

  let alterados = 0, removidas = 0;
  for (const m of membros) {
    const antes = m.entidades || [];
    const depois = antes
      .filter((e) => !nomeVazio(e.nome))
      .map((e) => ({ ...e, linha: normalizaLinha(e.linha) }));
    const mudou = depois.length !== antes.length
      || depois.some((e, i) => e.linha !== antes[i]?.linha);
    if (mudou) {
      await col('membros').updateOne({ _id: m._id }, { $set: { entidades: depois } });
      alterados++;
      removidas += antes.length - depois.length;
    }
  }

  flush();
  console.log(`\n===== LIMPEZA CONCLUÍDA =====`);
  console.log(`Fichas ajustadas: ${alterados} · Entidades removidas: ${removidas}`);
  console.log('\nQuem souber o nome depois é só cadastrar pelo perfil.\n');
  process.exit(0);
}

main().catch((e) => { console.error('Erro:', e.message); process.exit(1); });
