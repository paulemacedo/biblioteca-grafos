/**
 * Revisa e padroniza os ORIXÁS já cadastrados.
 *
 * Serve para o caso clássico: no formulário uns escreveram "oxaguiã",
 * outros "oxaguian", e o relatório fica dividido em dois grupos.
 *
 * COMO USAR (a partir da pasta server/, com as variáveis do Atlas definidas):
 *   node scripts/padroniza-orixas.js            → só mostra o que existe hoje
 *   node scripts/padroniza-orixas.js --corrigir  → grava a forma oficial
 *
 * O que NÃO for reconhecido aparece na lista "precisam de decisão sua" e
 * não é alterado — nesses casos, ajuste pelo perfil do membro no sistema.
 */
const { col, ready, flush } = require('../lib/db.js');
const { normalizaOrixa, orixaConhecido, ORIXAS } = require('../lib/catalogo.js');

async function main() {
  const corrigir = process.argv.includes('--corrigir');
  await ready;

  const membros = await col('membros').find({}).toArray();

  const variacoes = new Map(); // texto original -> { oficial, quem: [] }
  const registra = (texto, nome, campo) => {
    if (!texto) return;
    const oficial = normalizaOrixa(texto);
    const chave = `${texto}`;
    if (!variacoes.has(chave)) variacoes.set(chave, { oficial, quem: [] });
    variacoes.get(chave).quem.push(`${nome} (${campo})`);
  };

  for (const m of membros) {
    registra(m.orixas?.frente, m.nome, 'frente');
    registra(m.orixas?.junto, m.nome, 'juntó');
  }

  const iguais = [], aCorrigir = [], desconhecidos = [];
  for (const [texto, info] of variacoes) {
    if (!orixaConhecido(texto)) desconhecidos.push([texto, info]);
    else if (texto === info.oficial) iguais.push([texto, info]);
    else aCorrigir.push([texto, info]);
  }

  console.log('\n=== JÁ PADRONIZADOS ===');
  if (iguais.length) {
    for (const [t, i] of iguais) console.log(`  ${t} — ${i.quem.length} registro(s)`);
  } else console.log('  (nenhum)');

  console.log('\n=== SERÃO PADRONIZADOS ===');
  if (aCorrigir.length) {
    for (const [t, i] of aCorrigir) {
      console.log(`  "${t}"  →  "${i.oficial}"   [${i.quem.join(', ')}]`);
    }
  } else console.log('  (nenhum — está tudo certo)');

  console.log('\n=== PRECISAM DE DECISÃO SUA (não reconhecidos) ===');
  if (desconhecidos.length) {
    for (const [t, i] of desconhecidos) console.log(`  "${t}"   [${i.quem.join(', ')}]`);
    console.log('\n  Corrija esses pelo perfil do membro, escolhendo na lista.');
    console.log('  Orixás do catálogo: ' + ORIXAS.join(', '));
  } else console.log('  (nenhum)');

  if (!corrigir) {
    console.log('\n===== APENAS CONFERÊNCIA — nada foi alterado =====');
    console.log('Rode com --corrigir para gravar a forma oficial.\n');
    process.exit(0);
  }

  let alterados = 0;
  for (const m of membros) {
    const frente = m.orixas?.frente || '';
    const junto = m.orixas?.junto || '';
    const novaFrente = orixaConhecido(frente) ? normalizaOrixa(frente) : frente;
    const novoJunto = orixaConhecido(junto) ? normalizaOrixa(junto) : junto;
    if (novaFrente !== frente || novoJunto !== junto) {
      await col('membros').updateOne(
        { _id: m._id },
        { $set: { orixas: { ...(m.orixas || {}), frente: novaFrente, junto: novoJunto } } }
      );
      alterados++;
    }
  }

  flush();
  console.log(`\n===== PADRONIZAÇÃO CONCLUÍDA =====`);
  console.log(`Membros alterados: ${alterados}\n`);
  process.exit(0);
}

main().catch((e) => { console.error('Erro:', e.message); process.exit(1); });
