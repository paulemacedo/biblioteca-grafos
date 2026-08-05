/**
 * Limpa os dados de DEMONSTRAÇÃO criados na primeira execução do sistema
 * (os filhos ana/bruno/carla/diego/elisa/fabio, as giras de exemplo, os
 * pagamentos, gastos, búzios, certificados e afins).
 *
 * O que é PRESERVADO:
 *   - os membros importados da planilha e os que você cadastrou à mão;
 *   - o login de administração (admin);
 *   - a configuração da casa (endereço, textos do site) e as fotos enviadas.
 *
 * COMO USAR (a partir da pasta server/):
 *   node scripts/limpar-demo.js --simular     → só mostra o que seria apagado
 *   node scripts/limpar-demo.js               → apaga de verdade
 *
 * Para o MongoDB Atlas, defina as variáveis antes, como na importação:
 *   $env:MONGODB_URI="mongodb+srv://..."; $env:MONGODB_DB="tuulli"
 */
const { col, ready, flush } = require('../lib/db.js');

/* usuários criados pelo seed de demonstração */
const USUARIOS_DEMO = ['ana', 'bruno', 'carla', 'diego', 'elisa', 'fabio'];

/* coleções que só contêm movimento (giras, presenças, dinheiro...).
   Como a casa ainda não lançou nada de verdade, todas são zeradas. */
const COLECOES_MOVIMENTO = [
  'eventos', 'frequencia', 'escalas', 'justificativas',
  'pagamentos', 'gastos', 'buzios', 'certificados',
  'gts', 'historicoGt', 'notificacoes',
  'documentos', 'apostilas', 'faq', 'indicacoes',
];

async function main() {
  const simular = process.argv.includes('--simular');
  await ready;

  const membros = await col('membros').find({}).toArray();
  const demo = membros.filter((m) => USUARIOS_DEMO.includes(m.usuario));
  const ficam = membros.filter((m) => !USUARIOS_DEMO.includes(m.usuario));

  console.log('\n=== MEMBROS ===');
  console.log(`Serão apagados (${demo.length}): ${demo.map((m) => m.usuario).join(', ') || 'nenhum'}`);
  console.log(`Serão mantidos (${ficam.length}): ${ficam.map((m) => m.usuario).join(', ')}`);

  console.log('\n=== REGISTROS DE MOVIMENTO ===');
  const contagens = {};
  for (const nome of COLECOES_MOVIMENTO) {
    const total = (await col(nome).find({}).toArray()).length;
    contagens[nome] = total;
    if (total) console.log(`  ${nome}: ${total} registro(s)`);
  }
  const totalMovimento = Object.values(contagens).reduce((a, b) => a + b, 0);
  if (!totalMovimento) console.log('  (nada a apagar)');

  if (simular) {
    console.log('\n===== SIMULAÇÃO — nada foi apagado =====');
    console.log('Rode sem --simular para apagar de verdade.\n');
    process.exit(0);
  }

  for (const m of demo) await col('membros').deleteOne({ _id: m._id });
  for (const nome of COLECOES_MOVIMENTO) await col(nome).deleteMany({});

  /* zera o vínculo de GT que os membros mantidos pudessem ter */
  for (const m of ficam) {
    if (m.gtId) await col('membros').updateOne({ _id: m._id }, { $set: { gtId: null } });
  }

  flush();
  console.log('\n===== LIMPEZA CONCLUÍDA =====');
  console.log(`Membros apagados: ${demo.length} · Membros mantidos: ${ficam.length}`);
  console.log(`Registros de movimento apagados: ${totalMovimento}`);
  console.log('\nPróximos passos: recriar os GTs da casa, o calendário real e as mensalidades do mês.\n');
  process.exit(0);
}

main().catch((e) => { console.error('Erro na limpeza:', e.message); process.exit(1); });
