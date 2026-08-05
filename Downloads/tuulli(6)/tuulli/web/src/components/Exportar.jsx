/**
 * Botões de download dos relatórios.
 *
 * Excel e CSV saem prontos do servidor (rota /api/admin/exportar/:tipo).
 * O PDF sai pela impressão do próprio navegador — que já respeita o
 * layout da tela e permite "Salvar como PDF" no diálogo de impressão.
 */
export default function Exportar({ tipo, pdf = true, rotulo = 'Baixar' }) {
  const baixar = (formato) => {
    window.location.href = `/api/admin/exportar/${tipo}?formato=${formato}`;
  };
  return (
    <span className="nao-imprimir" style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn mini" onClick={() => baixar('xlsx')} title="Abre no Excel">
        ⬇ {rotulo} em Excel
      </button>
      <button className="btn mini" onClick={() => baixar('csv')} title="Formato aberto (CSV)">
        ⬇ CSV
      </button>
      {pdf && (
        <button className="btn mini" onClick={() => window.print()} title="Use 'Salvar como PDF' no diálogo de impressão">
          ⬇ PDF / imprimir
        </button>
      )}
    </span>
  );
}
