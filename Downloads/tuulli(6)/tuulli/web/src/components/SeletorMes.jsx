const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Escolha de mês/ano em listas, em vez do campo de data do navegador
 * (que no celular abre um calendário e mostra "2026-08" na tela).
 * O valor continua no formato 'AAAA-MM', que é o que o sistema usa.
 */
export default function SeletorMes({ valor, aoMudar, rotulo = 'Mês de referência', anos = 3 }) {
  const hoje = new Date();
  const [ano, mes] = (valor || hoje.toISOString().slice(0, 7)).split('-').map(Number);
  const anoAtual = hoje.getFullYear();
  const listaAnos = [];
  for (let a = anoAtual - anos; a <= anoAtual + 1; a++) listaAnos.push(a);

  const muda = (novoMes, novoAno) =>
    aoMudar(`${novoAno}-${String(novoMes).padStart(2, '0')}`);

  return (
    <div className="seletor-mes">
      {rotulo && <label>{rotulo}</label>}
      <div className="linha">
        <select value={mes} onChange={(e) => muda(Number(e.target.value), ano)} aria-label="Mês">
          {MESES.map((nome, i) => <option key={nome} value={i + 1}>{nome}</option>)}
        </select>
        <select value={ano} onChange={(e) => muda(mes, Number(e.target.value))} aria-label="Ano">
          {listaAnos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    </div>
  );
}

/* '2026-08' → 'agosto de 2026' (para títulos e avisos) */
export const mesPorExtenso = (ref) => {
  if (!/^\d{4}-\d{2}$/.test(ref || '')) return ref || '';
  const [a, m] = ref.split('-');
  return `${MESES[Number(m) - 1].toLowerCase()} de ${a}`;
};
