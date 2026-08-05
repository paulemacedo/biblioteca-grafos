import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataBr } from '../api.js';
import { Tag, TagTipo } from '../components/Visual.jsx';
import { grauTexto } from '../components/Cartazes.jsx';
import Exportar from '../components/Exportar.jsx';
import { Busca, useBusca, chave } from '../components/Busca.jsx';

/* Hook simples: lista de membros usada por várias seções */
function useMembros() {
  const [membros, setMembros] = useState([]);
  const carrega = () => api('/api/admin/membros').then(setMembros);
  useEffect(() => { carrega(); }, []);
  return { membros, recarrega: carrega };
}

/* ------------------------------ Membros ------------------------------ */
export function Membros() {
  const { membros, recarrega } = useMembros();
  const { termo, setTermo, filtrada } = useBusca(
    membros,
    (m) => `${m.nome} ${m.usuario} ${m.email || ''} ${m.gtNome || ''} ${m.orixas?.frente || ''}`
  );
  const [form, setForm] = useState({ nome: '', usuario: '', senha: '', nascimento: '', grau: '', email: '', papel: 'filho' });
  const [graus, setGraus] = useState({}); // edição inline do grau: id -> valor
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function criar() {
    await api('/api/admin/membros', { method: 'POST', body: JSON.stringify(form) });
    setForm({ nome: '', usuario: '', senha: '', nascimento: '', grau: '', email: '', papel: 'filho' });
    recarrega();
  }
  async function alternar(m) {
    await api('/api/admin/membros/' + m._id, {
      method: 'PUT',
      body: JSON.stringify({ ativo: !m.ativo, papel: m.papel }),
    });
    recarrega();
  }
  async function salvaGrau(m) {
    const valor = graus[m._id];
    if (valor === undefined || valor === String(m.grau ?? '')) return;
    await api('/api/admin/membros/' + m._id, { method: 'PUT', body: JSON.stringify({ grau: valor }) });
    recarrega();
  }

  return (
    <>
      <h1>Membros</h1>
      <p className="sub">Cadastro dos filhos da casa e da administração. O grau é editável direto na tabela — clique no nome para abrir o perfil completo.</p>

      <Aniversariantes membros={membros} />

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Novo membro</h3>
        <div className="form-linha">
          <div><label>Nome completo</label><input value={form.nome} onChange={set('nome')} /></div>
          <div><label>Usuário</label><input value={form.usuario} onChange={set('usuario')} /></div>
          <div><label>Senha inicial</label><input value={form.senha} onChange={set('senha')} /></div>
          <div><label>Nascimento</label><input type="date" value={form.nascimento} onChange={set('nascimento')} /></div>
          <div><label>E-mail</label><input type="email" value={form.email} onChange={set('email')} /></div>
          <div style={{ maxWidth: 90 }}><label>Grau</label><input type="number" min="0" value={form.grau} onChange={set('grau')} /></div>
          <div>
            <label>Papel</label>
            <select value={form.papel} onChange={set('papel')}>
              <option value="filho">Filho da casa</option>
              <option value="admin">Administração</option>
            </select>
          </div>
          <button className="btn mini cheio" onClick={criar}>Cadastrar</button>
        </div>
      </div>

      <Busca valor={termo} aoMudar={setTermo} total={membros.length} mostrando={filtrada.length}
             placeholder="Buscar por nome, usuário, e-mail, GT ou orixá..." />

      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr><th>Nome</th><th>Usuário</th><th>Grau</th><th>Nascimento</th><th>Orixás</th><th>GT</th><th>Papel</th><th>Situação</th><th></th></tr>
          </thead>
          <tbody>
            {filtrada.map((m) => (
              <tr key={m._id}>
                <td><Link to={'/admin/membros/' + m._id}><strong>{m.nome}</strong></Link></td>
                <td>{m.usuario}</td>
                <td>
                  <input
                    type="number" min="0"
                    style={{ width: 64 }}
                    value={graus[m._id] ?? (m.grau ?? '')}
                    onChange={(e) => setGraus((g) => ({ ...g, [m._id]: e.target.value }))}
                    onBlur={() => salvaGrau(m)}
                    title="Grau do médium (salva ao sair do campo)"
                  />
                </td>
                <td>{dataBr(m.nascimento)}</td>
                <td>{m.orixas?.frente || '—'}{m.orixas?.junto ? ' / ' + m.orixas.junto : ''}</td>
                <td>{m.gtNome || '—'}</td>
                <td>{m.papel === 'admin' ? <Tag cor="amarela">Admin</Tag> : <Tag>Filho</Tag>}</td>
                <td>{m.ativo ? <Tag cor="verde">Ativo</Tag> : <Tag cor="vermelha">Inativo</Tag>}</td>
                <td>
                  {m.papel !== 'admin' && (
                    <button className="btn mini" onClick={() => alternar(m)}>{m.ativo ? 'Desativar' : 'Reativar'}</button>
                  )}
                </td>
              </tr>
            ))}
            {!filtrada.length && <tr><td colSpan={9}><em>Ninguém encontrado com esse termo.</em></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* Aniversariantes do mês (lembrete) */
function Aniversariantes({ membros }) {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const doMes = membros
    .filter((m) => m.nascimento && Number(m.nascimento.slice(5, 7)) === mes)
    .sort((a, b) => a.nascimento.slice(8, 10).localeCompare(b.nascimento.slice(8, 10)));
  if (!doMes.length) return null;
  return (
    <div className="banner-pendencia" style={{ background: '#f2f8ef', borderColor: '#cfe3c6', borderLeftColor: 'var(--mata)' }}>
      🎂 <strong>Aniversariantes do mês:</strong>{' '}
      {doMes.map((m, i) => {
        const dia = Number(m.nascimento.slice(8, 10));
        const eHoje = dia === hoje.getDate();
        return (
          <span key={m._id}>
            {i > 0 && ' · '}
            {m.nome.split(' ')[0]} (dia {dia}){eHoje && ' — é HOJE! 🎉'}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------- Calendário + marcação de presenças ------------------- */
export function CalendarioAdmin() {
  const { membros } = useMembros();
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState({ titulo: '', tipo: 'gira', data: '', hora: '', descricao: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // painel de presenças
  const [freqEvento, setFreqEvento] = useState(null); // { _id, titulo }
  const [marcados, setMarcados] = useState(new Set());
  const [okFreq, setOkFreq] = useState('');

  const carrega = () => api('/api/eventos').then(setEventos);
  useEffect(() => { carrega(); }, []);

  async function criar() {
    await api('/api/admin/eventos', { method: 'POST', body: JSON.stringify(form) });
    setForm({ titulo: '', tipo: 'gira', data: '', hora: '', descricao: '' });
    carrega();
  }
  async function excluir(id) {
    if (!confirm('Excluir este evento e suas presenças?')) return;
    await api('/api/admin/eventos/' + id, { method: 'DELETE' });
    if (freqEvento?._id === id) setFreqEvento(null);
    carrega();
  }
  async function abrirPresencas(e) {
    const presentes = await api(`/api/admin/eventos/${e._id}/frequencia`);
    setMarcados(new Set(presentes));
    setFreqEvento(e);
    setOkFreq('');
  }
  function alterna(id) {
    setMarcados((s) => {
      const novo = new Set(s);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }
  async function salvarPresencas() {
    await api(`/api/admin/eventos/${freqEvento._id}/frequencia`, {
      method: 'POST',
      body: JSON.stringify({ membroIds: [...marcados] }),
    });
    setOkFreq('Presenças salvas — gira registrada como encerrada.');
    carrega();
  }

  const filhosAtivos = membros.filter((m) => m.papel !== 'admin' && m.ativo);

  return (
    <>
      <h1>Calendário e presenças</h1>
      <p className="sub">Monte a agenda e, depois da gira, marque quem esteve presente.</p>

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Novo evento</h3>
        <div className="form-linha">
          <div><label>Título</label><input value={form.titulo} onChange={set('titulo')} /></div>
          <div>
            <label>Tipo</label>
            <select value={form.tipo} onChange={set('tipo')}>
              <option value="gira">Gira</option>
              <option value="gira_extra">Gira extra</option>
              <option value="desenvolvimento">Desenvolvimento</option>
            </select>
          </div>
          <div><label>Data</label><input type="date" value={form.data} onChange={set('data')} /></div>
          <div><label>Hora</label><input type="time" value={form.hora} onChange={set('hora')} /></div>
          <div><label>Descrição</label><input value={form.descricao} onChange={set('descricao')} /></div>
          <button className="btn mini cheio" onClick={criar}>Agendar</button>
        </div>
      </div>

      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Data</th><th>Evento</th><th>Tipo</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e._id}>
                <td>{dataBr(e.data)} {e.hora}</td>
                <td><strong>{e.titulo}</strong><br /><small>{e.descricao}</small></td>
                <td><TagTipo tipo={e.tipo} /></td>
                <td>{e.encerrada ? <Tag>Encerrada</Tag> : <Tag cor="verde">Agendada</Tag>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn mini" onClick={() => abrirPresencas(e)}>Presenças</button>{' '}
                  <button className="btn mini perigo" onClick={() => excluir(e._id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {freqEvento && (
        <div className="cartao" style={{ marginTop: 22 }}>
          <h3>Presenças — {freqEvento.titulo}</h3>
          <p className="sub" style={{ marginBottom: 0 }}>
            Marque os filhos presentes. Ao salvar, a gira é registrada como encerrada e alimenta os relatórios.
          </p>
          <div className="lista-checagem">
            {filhosAtivos.map((m) => (
              <label key={m._id}>
                <input type="checkbox" checked={marcados.has(m._id)} onChange={() => alterna(m._id)} />
                {m.nome}
              </label>
            ))}
          </div>
          <button className="btn cheio" onClick={salvarPresencas}>Salvar presenças</button>
          <div className="aviso-ok">{okFreq}</div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ GTs ------------------------------ */
export function Gts() {
  const { membros, recarrega } = useMembros();
  const [gts, setGts] = useState([]);
  const [selecao, setSelecao] = useState({}); // gtId -> membroId escolhido no select
  const [feedbacks, setFeedbacks] = useState({}); // gtId -> texto do feedback sendo escrito
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const carrega = () => api('/api/admin/gts').then(setGts);
  useEffect(() => { carrega(); }, []);

  const filhosAtivos = membros.filter((m) => m.papel !== 'admin' && m.ativo);

  async function criar() {
    await api('/api/admin/gts', { method: 'POST', body: JSON.stringify({ nome, descricao }) });
    setNome(''); setDescricao('');
    carrega();
  }
  async function alocar(gtId, lider) {
    const membroId = selecao[gtId] || filhosAtivos[0]?._id;
    if (!membroId) return;
    await api(`/api/admin/gts/${gtId}/membros`, { method: 'POST', body: JSON.stringify({ membroId, lider }) });
    recarrega(); carrega();
  }
  async function remover(gtId, membroId) {
    await api(`/api/admin/gts/${gtId}/membros/${membroId}`, { method: 'DELETE' });
    recarrega(); carrega();
  }
  /* fixo = entra em toda gira (ex.: cambonagem fixa); os demais entram por rodízio */
  async function excluirGt(gt) {
    if (!confirm(`Excluir o GT "${gt.nome}"? Os membros ficam sem GT; as escalas já salvas não mudam.`)) return;
    await api('/api/admin/gts/' + gt._id, { method: 'DELETE' });
    recarrega(); carrega();
  }
  async function alternarFixo(gtId, membroId, fixo) {
    await api(`/api/admin/gts/${gtId}/fixos/${membroId}`, { method: 'PUT', body: JSON.stringify({ fixo }) });
    carrega();
  }
  async function darFeedback(gtId) {
    const texto = feedbacks[gtId]?.trim();
    if (!texto) return;
    await api(`/api/admin/gts/${gtId}/feedback`, { method: 'POST', body: JSON.stringify({ texto }) });
    setFeedbacks((f) => ({ ...f, [gtId]: '' }));
    carrega();
  }
  async function apagarFeedback(gtId, fid) {
    await api(`/api/admin/gts/${gtId}/feedback/${fid}`, { method: 'DELETE' });
    carrega();
  }

  return (
    <>
      <h1>Grupos de trabalho</h1>
      <p className="sub">
        Cada GT é uma função da gira. O <strong>líder</strong> e quem estiver marcado como
        <strong> fixo</strong> entram em toda gira (é o caso de uma cambonagem fixa); os demais
        da equipe entram por rodízio, escolhidos gira a gira em <em>Sugestão de alocação</em>.
      </p>

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Novo GT</h3>
        <div className="form-linha">
          <div><label>Nome</label><input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><label>Descrição</label><input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
          <button className="btn mini cheio" onClick={criar}>Criar GT</button>
        </div>
      </div>

      <div className="grade c2">
        {gts.map((g) => (
          <div className="cartao" key={g._id}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span>{g.nome}</span>
              <button className="btn mini perigo" onClick={() => excluirGt(g)}>Excluir GT</button>
            </h3>
            <p style={{ color: 'var(--tinta-suave)', margin: '0 0 8px' }}>{g.descricao}</p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Líder:</strong> {g.liderNome || <em>sem líder definido</em>}
            </p>
            <div>
              {g.membrosDetalhe.length ? g.membrosDetalhe.map((m) => (
                <span key={m._id} className={`tag ${m.lider ? 'amarela' : m.fixo ? 'verde' : 'cinza'}`} style={{ margin: 2 }}>
                  {m.nome}
                  {m.lider ? ' · líder' : m.fixo ? ' · fixo' : ' · rodízio'}{' '}
                  {!m.lider && (
                    <a
                      href="#"
                      title={m.fixo ? 'Deixar entrar por rodízio' : 'Marcar como fixo (entra em toda gira)'}
                      style={{ textDecoration: 'none' }}
                      onClick={(e) => { e.preventDefault(); alternarFixo(g._id, m._id, !m.fixo); }}
                    >{m.fixo ? '⇄' : '📌'}</a>
                  )}{' '}
                  <a
                    href="#"
                    title="Remover da equipe do GT"
                    style={{ textDecoration: 'none' }}
                    onClick={(e) => { e.preventDefault(); remover(g._id, m._id); }}
                  >✕</a>
                </span>
              )) : <em style={{ color: 'var(--tinta-suave)' }}>Sem membros ainda</em>}
            </div>
            <div className="form-linha" style={{ marginTop: 12 }}>
              <div>
                <select
                  value={selecao[g._id] || filhosAtivos[0]?._id || ''}
                  onChange={(e) => setSelecao((s) => ({ ...s, [g._id]: e.target.value }))}
                >
                  {filhosAtivos.map((m) => <option key={m._id} value={m._id}>{m.nome}</option>)}
                </select>
              </div>
              <button className="btn mini" onClick={() => alocar(g._id, false)}>+ Na equipe</button>
              <button className="btn mini cheio" onClick={() => alocar(g._id, true)}>+ Como líder</button>
            </div>

            <div style={{ marginTop: 14, borderTop: '1px solid var(--linha)', paddingTop: 10 }}>
              <strong style={{ fontSize: 14 }}>Feedback do GT</strong>
              {(g.feedbacks || []).slice().reverse().map((fb) => (
                <div className="resposta" key={fb.id} style={{ margin: '8px 0 0' }}>
                  <small style={{ color: 'var(--tinta-suave)' }}>{dataBr(fb.data)}</small> — {fb.texto}{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); apagarFeedback(g._id, fb.id); }} title="Apagar">✕</a>
                </div>
              ))}
              <div className="form-linha" style={{ marginTop: 8 }}>
                <div>
                  <input
                    placeholder="Anotar feedback sobre o grupo..."
                    value={feedbacks[g._id] || ''}
                    onChange={(e) => setFeedbacks((f) => ({ ...f, [g._id]: e.target.value }))}
                  />
                </div>
                <button className="btn mini" onClick={() => darFeedback(g._id)}>Registrar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* --------------- Sugestão de alocação (por gira) --------------- */
export function Sugestoes() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState('');
  const [s, setS] = useState(null);
  const [aviso, setAviso] = useState('');
  const [busca, setBusca] = useState({}); // gtId -> termo
  const [verTodos, setVerTodos] = useState({}); // gtId -> mostrar lista inteira

  useEffect(() => {
    api('/api/eventos').then((evs) => {
      setEventos(evs);
      const proximo = evs.find((e) => !e.encerrada) || evs[0];
      if (proximo) setEventoId(proximo._id);
    });
  }, []);

  const carrega = (id = eventoId) => {
    if (!id) return;
    api(`/api/admin/eventos/${id}/sugestao`).then(setS);
  };
  useEffect(() => { carrega(); }, [eventoId]);

  async function alocar(gtId, membroId, nome, gtNome) {
    const r = await api(`/api/admin/eventos/${eventoId}/escala/alocar`, {
      method: 'POST', body: JSON.stringify({ gtId, membroId }),
    });
    setAviso(r?.tambemEm?.length
      ? `${nome} escalado(a) em ${gtNome} — também está em ${r.tambemEm.join(', ')} nesta gira.`
      : `${nome} escalado(a) em ${gtNome} nesta gira.`);
    setTimeout(() => setAviso(''), 3000);
    carrega();
  }
  async function tirar(membroId, nome) {
    await api(`/api/admin/eventos/${eventoId}/escala/membros/${membroId}`, { method: 'DELETE' });
    setAviso(`${nome} saiu da escala desta gira.`);
    setTimeout(() => setAviso(''), 3000);
    carrega();
  }

  if (!s) return (
    <>
      <h1>Sugestão de alocação</h1>
      <p className="sub">Escolha uma gira para ver as sugestões.</p>
    </>
  );

  const Situacao = ({ v }) => (
    v === 'suspensao' ? <Tag cor="vermelha">Suspensão</Tag>
      : v === 'advertencia' ? <Tag cor="amarela">Advertência</Tag>
      : <Tag cor="verde">Regular</Tag>
  );

  return (
    <>
      <h1>Sugestão de alocação</h1>
      <p className="sub">{s.criterio}</p>

      <div className="form-linha" style={{ marginBottom: 16 }}>
        <div style={{ flex: 2 }}>
          <label>Gira</label>
          <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {eventos.map((e) => (
              <option key={e._id} value={e._id}>{dataBr(e.data)} — {e.titulo}</option>
            ))}
          </select>
        </div>
        <Link className="btn mini" to="/admin/escalas">Abrir editor da escala</Link>
      </div>
      <p className="aviso-ok">{aviso}</p>

      {s.gts.map((gt) => {
        const escalados = gt.jaEscalados;
        return (
          <div className="cartao" key={gt._id} style={{ marginBottom: 18 }}>
            <h3>{gt.nome}</h3>
            {gt.descricao && <p className="sub" style={{ marginTop: -6 }}>{gt.descricao}</p>}

            <p style={{ margin: '8px 0' }}>
              <strong>Fixos:</strong>{' '}
              {gt.fixos.length ? gt.fixos.map((f, i) => (
                <span key={f._id}>
                  {i > 0 && ' · '}
                  {f.nome} <small>({grauTexto(f.grau)}{f._id === gt.liderId ? ', líder' : ''})</small>
                  {escalados.includes(f._id)
                    ? <Tag cor="verde"> na escala</Tag>
                    : <button className="btn mini" style={{ marginLeft: 6 }} onClick={() => alocar(gt._id, f._id, f.nome, gt.nome)}>escalar</button>}
                </span>
              )) : <em>nenhum fixo definido (defina em Grupos de trabalho)</em>}
            </p>

            <div className="busca nao-imprimir">
              <input
                type="search"
                value={busca[gt._id] || ''}
                onChange={(e) => setBusca((b) => ({ ...b, [gt._id]: e.target.value }))}
                placeholder={`Buscar médium para ${gt.nome}...`}
              />
              <button className="btn mini" onClick={() => setVerTodos((v) => ({ ...v, [gt._id]: !v[gt._id] }))}>
                {verTodos[gt._id] ? 'Mostrar só os 6 primeiros' : `Ver todos (${gt.candidatos.length})`}
              </button>
            </div>

            <div className="tabela-rolagem">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Médium</th><th>Grau</th><th>Vezes neste GT</th>
                    <th>Última vez</th><th>Presença</th><th>Disciplina</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const t = chave(busca[gt._id] || '').trim();
                    const achados = t ? gt.candidatos.filter((c) => chave(c.nome).includes(t)) : gt.candidatos;
                    return verTodos[gt._id] || t ? achados : achados.slice(0, 6);
                  })().map((c, i) => (
                    <tr key={c._id} style={c.situacao === 'suspensao' ? { opacity: 0.6 } : undefined}>
                      <td>{i + 1}</td>
                      <td>
                        <Link to={'/admin/membros/' + c._id}><strong>{c.nome}</strong></Link>{' '}
                        {c.daEquipe && <Tag>equipe do GT</Tag>}{' '}
                        {c.jaNaGiraEm?.length > 0 && <Tag cor="amarela">já em {c.jaNaGiraEm.join(', ')}</Tag>}
                      </td>
                      <td>{grauTexto(c.grau)}</td>
                      <td>{c.vezesNesteGt}</td>
                      <td>{c.ultimaVezNesteGt ? dataBr(c.ultimaVezNesteGt) : <em>nunca</em>}</td>
                      <td>{c.compareceu}/{c.totalGiras} ({c.percentual}%)</td>
                      <td><Situacao v={c.situacao} /></td>
                      <td>
                        <button className="btn mini cheio" onClick={() => alocar(gt._id, c._id, c.nome, gt.nome)}>
                          Escalar nesta gira
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {escalados.length > 0 && (
              <p style={{ marginTop: 10 }}>
                <strong>Já nesta gira:</strong>{' '}
                {escalados.map((id) => {
                  const p = [...gt.fixos, ...gt.candidatos].find((x) => x._id === id);
                  return (
                    <span className="etiqueta" key={id}>
                      {p?.nome || 'membro'}{' '}
                      <a href="#" onClick={(e) => { e.preventDefault(); tirar(id, p?.nome || ''); }}>✕</a>
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

/* --------------------- Relatório de frequência --------------------- */
export function RelatorioFrequencia() {
  const [r, setR] = useState(null);
  const [situacao, setSituacao] = useState('todas');
  const [termo, setTermo] = useState('');
  useEffect(() => { api('/api/admin/relatorios/frequencia').then(setR); }, []);
  if (!r) return null;
  const corPct = (p) => (p >= 75 ? 'verde' : p >= 50 ? 'amarela' : 'vermelha');
  const alvo = chave(termo).trim();
  const linhas = r.membros.filter((m) =>
    (situacao === 'todas' || m.situacao === situacao)
    && (!alvo || chave(m.nome).includes(alvo)));
  return (
    <>
      <h1>Relatório de frequência</h1>
      <p className="sub">Grade de presenças por gira encerrada e percentual de assiduidade de cada filho.</p>
      <p><Exportar tipo="frequencia" rotulo="Baixar frequência" /></p>
      <Busca valor={termo} aoMudar={setTermo} total={r.membros.length} mostrando={linhas.length} />
      <div className="abas nao-imprimir">
        {[['todas', 'Todos'], ['ok', 'Regulares'], ['advertencia', 'Advertência'], ['suspensao', 'Suspensão']].map(([v, rot]) => (
          <button key={v} className={'btn mini' + (situacao === v ? ' cheio' : '')} onClick={() => setSituacao(v)}>{rot}</button>
        ))}
      </div>
      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr>
              <th>Membro</th>
              {r.eventos.map((e) => <th key={e._id} title={e.titulo}>{dataBr(e.data)}</th>)}
              <th>Total</th><th>%</th><th>Faltas just.</th><th>Faltas NÃO just.</th><th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((m) => (
              <tr key={m._id}>
                <td><Link to={'/admin/membros/' + m._id}><strong>{m.nome}</strong></Link></td>
                {m.presencas.map((p, j) => <td key={j}>{p ? '✔' : '·'}</td>)}
                <td>{m.total}</td>
                <td><Tag cor={corPct(m.percentual)}>{m.percentual}%</Tag></td>
                <td>{m.faltasJustificadas}</td>
                <td>{m.faltasNaoJustificadas}</td>
                <td>
                  {m.situacao === 'ok' && <Tag cor="verde">Regular</Tag>}
                  {m.situacao === 'advertencia' && <Tag cor="amarela">Advertência</Tag>}
                  {m.situacao === 'suspensao' && <Tag cor="vermelha">Suspensão</Tag>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
