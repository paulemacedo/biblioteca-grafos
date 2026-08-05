import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataBr } from '../api.js';
import { EscalaQuadros, grauTexto } from '../components/Cartazes.jsx';
import { EscolheMembro, chave } from '../components/Busca.jsx';

/**
 * Escala da gira.
 *
 * O GT define a FUNÇÃO na gira, não um grupo fixo: entram sempre o líder e
 * quem a casa marcou como fixo; o restante é escalado gira a gira, com
 * sugestão por rodízio. Em Consultas, cada médium pode ter a cambonagem
 * indicada (outro médium escalado ou "Fixo").
 */
export default function Escalas() {
  const [eventos, setEventos] = useState([]);
  const [membros, setMembros] = useState([]);
  const [gts, setGts] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [funcoes, setFuncoes] = useState([]);
  const [sugestao, setSugestao] = useState(null);
  const [ok, setOk] = useState('');
  const [verPrevia, setVerPrevia] = useState(false);
  const [porGt, setPorGt] = useState(2);

  useEffect(() => {
    api('/api/eventos').then((evs) => {
      setEventos(evs);
      const proximo = evs.find((e) => !e.encerrada) || evs[0];
      if (proximo) setEventoId(proximo._id);
    });
    api('/api/admin/membros').then((ms) => setMembros(ms.filter((m) => m.ativo)));
    api('/api/admin/gts').then(setGts);
  }, []);

  const carrega = (id = eventoId) => {
    if (!id) return;
    api(`/api/eventos/${id}/escala`).then((d) => {
      setFuncoes(d.funcoes.map((f) => ({
        nome: f.nome, obs: f.obs, gtId: f.gtId || null, todos: !!f.todos,
        membros: f.membros.map((m) => ({
          membroId: m.membroId, nota: m.nota,
          cambonoId: m.cambonoId || '', cambonagem: m.cambonagem || '',
        })),
      })));
    });
    api(`/api/admin/eventos/${id}/sugestao`).then(setSugestao);
  };
  useEffect(() => { carrega(); }, [eventoId]);

  const evento = eventos.find((e) => e._id === eventoId);
  const nomeDe = (id) => membros.find((m) => m._id === id)?.nome || '?';
  const grauDe = (id) => membros.find((m) => m._id === id)?.grau ?? null;
  const naEscala = new Set(funcoes.flatMap((f) => f.membros.map((m) => m.membroId)));

  /* --------- edição --------- */
  const mudaFuncao = (i, campo, valor) =>
    setFuncoes((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
  const removeFuncao = (i) => setFuncoes((fs) => fs.filter((_, j) => j !== i));
  const addFuncao = (gt) =>
    setFuncoes((fs) => [...fs, { nome: gt?.nome || '', obs: '', gtId: gt?._id || null, todos: false, membros: [] }]);

  /* a mesma pessoa pode servir em mais de um GT na mesma gira — só avisamos */
  const addMembro = (i, membroId) => {
    if (!membroId) return;
    setFuncoes((fs) => {
      const outras = fs.filter((f, j) => j !== i && f.membros.some((m) => m.membroId === membroId));
      if (outras.length) {
        setOk(`${nomeDe(membroId)} agora também está em "${fs[i].nome}" (já estava em ${outras.map((f) => f.nome).join(', ')}).`);
      }
      return fs.map((f, j) => {
        if (j !== i || f.membros.some((m) => m.membroId === membroId)) return f;
        return { ...f, membros: [...f.membros, { membroId, nota: '', cambonoId: '', cambonagem: '' }] };
      });
    });
  };

  /* função que vale para a casa inteira — no cartaz aparece "Todos" */
  const alternarTodos = (i) =>
    setFuncoes((fs) => fs.map((f, j) => (j === i ? { ...f, todos: !f.todos, membros: !f.todos ? [] : f.membros } : f)));
  const mudaMembro = (i, k, campo, valor) =>
    setFuncoes((fs) => fs.map((f, j) => (j === i
      ? { ...f, membros: f.membros.map((m, l) => (l === k ? { ...m, [campo]: valor } : m)) }
      : f)));
  const removeMembro = (i, k) =>
    setFuncoes((fs) => fs.map((f, j) => (j === i ? { ...f, membros: f.membros.filter((_, l) => l !== k) } : f)));

  /* --------- sugestões --------- */
  async function montarTudo() {
    if (!confirm('Montar a escala inteira desta gira? Isso substitui o que estiver montado agora.')) return;
    await api(`/api/admin/eventos/${eventoId}/escala/sugerir-tudo`, {
      method: 'POST', body: JSON.stringify({ porGt }),
    });
    carrega();
    setOk('Escala montada com os fixos + rodízio. Ajuste o que quiser e salve.');
    setTimeout(() => setOk(''), 5000);
  }

  /* põe fixos e sugeridos de UM GT na função correspondente (sem salvar ainda) */
  function puxarGt(gt, quantos) {
    const info = sugestao?.gts.find((g) => g._id === gt._id);
    if (!info) return;
    const escolhidos = [
      ...info.fixos.map((f) => ({ id: f._id, nota: f._id === info.liderId ? 'Líder' : 'Fixo' })),
      ...info.candidatos.filter((c) => !naEscala.has(c._id)).slice(0, quantos).map((c) => ({ id: c._id, nota: '' })),
    ];
    setFuncoes((fs) => {
      const idx = fs.findIndex((f) => f.gtId === gt._id || f.nome === gt.nome);
      const base = idx >= 0 ? fs : [...fs, { nome: gt.nome, obs: gt.descricao || '', gtId: gt._id, membros: [] }];
      const alvo = idx >= 0 ? idx : base.length - 1;
      return base.map((f, j) => {
        if (j !== alvo) return f;
        const jaTem = new Set(f.membros.map((m) => m.membroId));
        const novos = escolhidos
          .filter((e) => !jaTem.has(e.id))
          .map((e) => ({ membroId: e.id, nota: e.nota, cambonoId: '', cambonagem: '' }));
        return { ...f, gtId: gt._id, membros: [...f.membros, ...novos] };
      });
    });
  }

  async function salvar() {
    await api(`/api/admin/eventos/${eventoId}/escala`, {
      method: 'PUT',
      body: JSON.stringify({ funcoes }),
    });
    setOk('Escala salva — já visível para os filhos no calendário.');
    setTimeout(() => setOk(''), 4000);
    carrega();
  }

  const previa = funcoes.map((f) => ({
    ...f,
    todos: !!f.todos,
    membros: f.membros.map((m) => ({
      nome: nomeDe(m.membroId), grau: grauDe(m.membroId), nota: m.nota,
      cambonoNome: m.cambonoId ? nomeDe(m.cambonoId) : '', cambonagem: m.cambonagem,
    })),
  }));

  return (
    <>
      <h1>Escala da gira</h1>
      <p className="sub">
        Cada GT é uma função da gira. Líder e fixos entram sempre; os demais são
        escalados gira a gira, com sugestão por rodízio.
      </p>

      <div className="form-linha" style={{ marginBottom: 18 }}>
        <div style={{ flex: 2 }}>
          <label>Gira / evento</label>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((e) => (
              <option key={e._id} value={e._id}>{dataBr(e.data)} — {e.titulo}</option>
            ))}
          </select>
        </div>
        <div style={{ maxWidth: 190 }}>
          <label>Dinâmicos por GT</label>
          <input type="number" min="0" max="10" value={porGt} onChange={(e) => setPorGt(e.target.value)} />
        </div>
        <button className="btn mini cheio" onClick={montarTudo} disabled={!eventoId}>
          ✨ Montar escala sugerida
        </button>
        <button className="btn mini" onClick={() => setVerPrevia((v) => !v)}>
          {verPrevia ? 'Voltar à edição' : 'Pré-visualizar quadro'}
        </button>
        {eventoId && (
          <Link className="btn mini" to={`/escala/${eventoId}`} target="_blank" rel="noopener noreferrer">
            Abrir cartaz para imprimir
          </Link>
        )}
      </div>
      <p className="aviso-ok">{ok}</p>

      {(() => {
        const contagem = {};
        for (const f of funcoes) for (const m of f.membros) (contagem[m.membroId] ??= []).push(f.nome);
        const multiplos = Object.entries(contagem).filter(([, fs]) => fs.length > 1);
        if (!multiplos.length) return null;
        return (
          <div className="banner-pendencia nao-imprimir">
            👥 Em mais de uma função nesta gira:{' '}
            {multiplos.map(([id, fs], i) => (
              <span key={id}>{i > 0 && ' · '}<strong>{nomeDe(id)}</strong> ({fs.join(' + ')})</span>
            ))}
          </div>
        );
      })()}

      {verPrevia && evento ? (
        <EscalaQuadros
          titulo={evento.titulo}
          subtitulo={`${dataBr(evento.data)}${evento.hora ? ' · ' + evento.hora : ''}`}
          funcoes={previa}
        />
      ) : (
        <>
          {funcoes.map((f, i) => {
            const info = sugestao?.gts.find((g) => g._id === f.gtId || g.nome === f.nome);
            return (
              <div className="cartao" key={i} style={{ marginBottom: 16 }}>
                <div className="form-linha">
                  <div style={{ flex: 2 }}>
                    <label>Função (GT)</label>
                    <input value={f.nome} onChange={(e) => mudaFuncao(i, 'nome', e.target.value)} />
                  </div>
                  <div style={{ flex: 3 }}>
                    <label>Observação (aparece no quadro)</label>
                    <input value={f.obs} onChange={(e) => mudaFuncao(i, 'obs', e.target.value)} placeholder="Ex.: Preparar ervas / defumar" />
                  </div>
                  <button
                    className={'btn mini' + (f.todos ? ' cheio' : '')}
                    onClick={() => alternarTodos(i)}
                    title="A casa inteira participa desta função"
                  >
                    {f.todos ? '✓ Todos' : 'Escalar todos'}
                  </button>
                  <button className="btn mini perigo" onClick={() => removeFuncao(i)}>Remover função</button>
                </div>

                {f.todos && (
                  <p className="sub" style={{ marginTop: 10 }}>
                    Esta função vale para <strong>todos os médiuns</strong> — no cartaz aparece
                    apenas “Todos”, sem listar nome por nome.
                  </p>
                )}

                {!f.todos && <div className="tabela-rolagem">
                  <table style={{ marginTop: 12 }}>
                    <thead>
                      <tr><th>Médium</th><th>Grau</th><th>Cambonagem</th><th>Nota</th><th></th></tr>
                    </thead>
                    <tbody>
                      {f.membros.map((m, k) => (
                        <tr key={m.membroId}>
                          <td><strong>{nomeDe(m.membroId)}</strong></td>
                          <td>{grauTexto(grauDe(m.membroId))}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {m.cambonoId ? (
                              <span className="etiqueta">
                                {nomeDe(m.cambonoId)}{' '}
                                <a href="#" onClick={(ev) => { ev.preventDefault(); mudaMembro(i, k, 'cambonoId', ''); }}>✕</a>
                              </span>
                            ) : (
                              <span style={{ display: 'inline-block', minWidth: 190, verticalAlign: 'top' }}>
                                <EscolheMembro
                                  membros={membros}
                                  rotulo=""
                                  aoEscolher={(id) => mudaMembro(i, k, 'cambonoId', id)}
                                />
                              </span>
                            )}{' '}
                            <input
                              value={m.cambonagem}
                              onChange={(e) => mudaMembro(i, k, 'cambonagem', e.target.value)}
                              placeholder="ou: Fixo"
                              style={{ maxWidth: 110, display: 'inline-block' }}
                            />
                          </td>
                          <td>
                            <input
                              value={m.nota}
                              onChange={(e) => mudaMembro(i, k, 'nota', e.target.value)}
                              style={{ maxWidth: 130 }}
                              placeholder="Líder / Fixo"
                            />
                          </td>
                          <td><button className="btn mini perigo" onClick={() => removeMembro(i, k)}>✕</button></td>
                        </tr>
                      ))}
                      {!f.membros.length && <tr><td colSpan={5}><em>Ninguém escalado nesta função</em></td></tr>}
                    </tbody>
                  </table>
                </div>}

                {!f.todos && <div className="form-linha" style={{ marginTop: 12 }}>
                  <div style={{ minWidth: 240 }}>
                    <EscolheMembro
                      membros={membros}
                      jaEscolhidos={f.membros.map((m) => m.membroId)}
                      aoEscolher={(id) => addMembro(i, id)}
                    />
                  </div>
                  {info && (
                    <button className="btn mini" onClick={() => puxarGt(info, porGt)}>
                      ✨ Puxar fixos + {porGt} sugerido(s)
                    </button>
                  )}
                </div>}

                {!f.todos && info && info.candidatos.length > 0 && (
                  <p className="sub" style={{ marginTop: 8 }}>
                    Rodízio sugerido:{' '}
                    {info.candidatos.filter((c) => !naEscala.has(c._id)).slice(0, 4).map((c, n) => (
                      <span key={c._id}>
                        {n > 0 && ' · '}
                        <a href="#" onClick={(ev) => { ev.preventDefault(); addMembro(i, c._id); }}>
                          {c.nome}
                        </a>{' '}
                        <small>
                          ({c.vezesNesteGt}× neste GT, {c.percentual}% de presença
                          {c.jaNaGiraEm?.length ? `, já em ${c.jaNaGiraEm.join('/')}` : ''}
                          {c.situacao === 'suspensao' ? ', SUSPENSO' : c.situacao === 'advertencia' ? ', advertido' : ''})
                        </small>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            );
          })}

          <div className="form-linha" style={{ marginBottom: 12 }}>
            <button className="btn mini" onClick={() => addFuncao(null)}>+ Função avulsa</button>
            <div>
              <select defaultValue="" onChange={(e) => {
                const gt = gts.find((g) => g._id === e.target.value);
                if (gt) addFuncao(gt);
                e.target.value = '';
              }}>
                <option value="" disabled>+ Função a partir de um GT...</option>
                {gts.map((g) => <option key={g._id} value={g._id}>{g.nome}</option>)}
              </select>
            </div>
          </div>

          <p>
            <button className="btn cheio" onClick={salvar} disabled={!eventoId}>Salvar escala</button>
            <span className="aviso-ok" style={{ marginLeft: 12 }}>{ok}</span>
          </p>
        </>
      )}
    </>
  );
}
