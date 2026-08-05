/* Cartazes: calendário anual e quadros de escala por gira */

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const grauTexto = (g) => (g == null || g === '' ? '—' : `${g}º`);

/* ---------------------- Cartaz do calendário ---------------------- */
export function CalendarioCartaz({ eventos, ano, sigla, avisos }) {
  const doAno = eventos.filter((e) => e.data?.startsWith(String(ano)));
  const porMes = MESES.map((nome, i) => ({
    nome,
    itens: doAno
      .filter((e) => Number(e.data.slice(5, 7)) === i + 1)
      .sort((a, b) => a.data.localeCompare(b.data)),
  })).filter((m) => m.itens.length);

  return (
    <div className="cartaz-cal">
      <div className="cab">
        <h2 className="tit">
          Calendário do {sigla || 'TUULLI'}
          <span className="ano">{ano}</span>
        </h2>
        <img className="logo" src="/assets/logo.jpg" alt="" />
      </div>

      {porMes.length ? (
        <div className="meses">
          {porMes.map((m) => (
            <div className="mes" key={m.nome}>
              <h3>{m.nome}</h3>
              <ul>
                {m.itens.map((e) => (
                  <li key={e._id}>
                    <strong>{e.data.slice(8, 10)}</strong> — {e.titulo}
                    {e.hora ? `, ${e.hora}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {avisos && (
            <div className="mes avisos">
              <h3>Atenção</h3>
              {avisos.split('\n').filter(Boolean).map((l, i) => <p key={i}>— {l}</p>)}
            </div>
          )}
        </div>
      ) : (
        <p className="escala-vazia">Nenhum evento cadastrado para {ano} ainda.</p>
      )}
    </div>
  );
}

/* ---------------------- Quadros de escala ---------------------- */
const CORES = ['#1d4f8a', '#4a90d9', '#0f7f8b', '#1e5a38', '#8a5a1e', '#c34a5a', '#5b4a8a'];

export function EscalaQuadros({ titulo, subtitulo, funcoes }) {
  return (
    <>
      <div className="escala-cab">{titulo}</div>
      {subtitulo && <p className="escala-sub">{subtitulo}</p>}
      {funcoes.length ? (
        <div className="quadros">
          {funcoes.map((f, i) => (
            <div className="quadro" key={i}>
              <div className="funcao" style={{ background: CORES[i % CORES.length] }}>{f.nome}</div>
              {f.todos ? (
                <table>
                  <tbody>
                    <tr><td style={{ textAlign: 'center', fontWeight: 700, padding: '14px 10px' }}>Todos</td></tr>
                  </tbody>
                </table>
              ) : (() => {
                const temNota = f.membros.some((m) => m.nota);
                const temCambono = f.membros.some((m) => m.cambonoNome || m.cambonagem);
                const colunas = 2 + (temNota ? 1 : 0) + (temCambono ? 1 : 0);
                return (
                  <table>
                    <thead>
                      <tr>
                        <th>Médium</th><th>Grau</th>
                        {temCambono && <th>Cambonagem</th>}
                        {temNota && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {f.membros.map((m, j) => (
                        <tr key={j}>
                          <td>{m.nome}</td>
                          <td>{grauTexto(m.grau)}</td>
                          {temCambono && <td>{m.cambonoNome || m.cambonagem || '—'}</td>}
                          {temNota && <td>{m.nota}</td>}
                        </tr>
                      ))}
                      {!f.membros.length && <tr><td colSpan={colunas}><em>Ninguém alocado</em></td></tr>}
                    </tbody>
                  </table>
                );
              })()}
              {f.obs && <div className="obs">{f.obs}</div>}
              <div className="conta">{f.todos ? 'Todos' : f.membros.length}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="escala-vazia">A escala desta gira ainda não foi montada pela administração.</p>
      )}
    </>
  );
}
