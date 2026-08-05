import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, dataBr, dinheiro } from '../api.js';
import { Tag } from '../components/Visual.jsx';
import { grauTexto } from '../components/Cartazes.jsx';

/* Perfil completo de um membro, aberto a partir da aba Membros */
export default function PerfilMembro() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [edita, setEdita] = useState({});
  const [ok, setOk] = useState('');
  const [buzio, setBuzio] = useState({ data: '', texto: '' });

  const carrega = () => api('/api/admin/membros/' + id).then((d) => {
    setM(d);
    setEdita({ nome: d.nome, nascimento: d.nascimento || '', email: d.email || '', grau: d.grau ?? '' });
  });
  useEffect(() => { carrega(); }, [id]);

  async function salvar() {
    await api('/api/admin/membros/' + id, { method: 'PUT', body: JSON.stringify(edita) });
    setOk('Dados salvos.');
    setTimeout(() => setOk(''), 2500);
    carrega();
  }
  async function novoBuzio() {
    if (!buzio.data) return alert('Informe a data do jogo.');
    await api(`/api/admin/membros/${id}/buzios`, { method: 'POST', body: JSON.stringify(buzio) });
    setBuzio({ data: '', texto: '' });
    carrega();
  }
  async function apagarBuzio(bid) {
    if (!confirm('Apagar este registro de jogo?')) return;
    await api('/api/admin/buzios/' + bid, { method: 'DELETE' });
    carrega();
  }

  if (!m) return null;
  const f = m.frequencia;

  return (
    <>
      <p className="nao-imprimir"><Link to="/admin/membros">← Voltar aos membros</Link></p>
      <h1>{m.nome}</h1>
      <p className="sub">
        {m.papel === 'admin' ? 'Administração' : 'Filho(a) da casa'} · usuário <strong>{m.usuario}</strong> · grau {grauTexto(m.grau)}
        {m.gtNome ? <> · GT atual: <strong>{m.gtNome}</strong></> : ' · sem GT no momento'}
      </p>

      <div className="grade c3" style={{ marginBottom: 20 }}>
        <div className="cartao"><div className="num">{f.percentual}%</div><div className="rotulo">Assiduidade ({f.compareceu}/{f.total} giras)</div></div>
        <div className="cartao"><div className="num">{f.faltasNaoJustificadas}</div><div className="rotulo">Faltas não justificadas</div></div>
        <div className="cartao">
          <div className="num">
            {f.situacao === 'ok' && <Tag cor="verde">Regular</Tag>}
            {f.situacao === 'advertencia' && <Tag cor="amarela">Advertência</Tag>}
            {f.situacao === 'suspensao' && <Tag cor="vermelha">Suspensão</Tag>}
          </div>
          <div className="rotulo">Situação disciplinar</div>
        </div>
      </div>

      <div className="grade c2">
        <div className="cartao">
          <h3>Dados (editáveis pela administração)</h3>
          <label>Nome</label>
          <input value={edita.nome || ''} onChange={(e) => setEdita((x) => ({ ...x, nome: e.target.value }))} />
          <label>Nascimento</label>
          <input type="date" value={edita.nascimento} onChange={(e) => setEdita((x) => ({ ...x, nascimento: e.target.value }))} />
          <label>E-mail</label>
          <input type="email" value={edita.email} onChange={(e) => setEdita((x) => ({ ...x, email: e.target.value }))} />
          <label>Grau</label>
          <input type="number" min="0" value={edita.grau} onChange={(e) => setEdita((x) => ({ ...x, grau: e.target.value }))} style={{ maxWidth: 120 }} />
          <p>
            <button className="btn mini cheio" onClick={salvar}>Salvar</button>
            <span className="aviso-ok" style={{ marginLeft: 10 }}>{ok}</span>
          </p>
        </div>

        <div className="cartao">
          <h3>Dados de santo</h3>
          <p style={{ margin: '4px 0' }}><strong>Orixá de frente:</strong> {m.orixas?.frente || '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Orixá juntó:</strong> {m.orixas?.junto || '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Padrinhos (orixás):</strong> {(m.padrinhos?.orixas || []).join(', ') || '—'}</p>
          <p style={{ margin: '4px 0' }}><strong>Padrinhos (pessoas):</strong>{' '}
            {(m.padrinhos?.pessoas || []).map((x) => (typeof x === 'string' ? x : x.nome)).join(', ') || '—'}
          </p>
          <p style={{ margin: '4px 0' }}><strong>Entidades:</strong>{' '}
            {(m.entidades || []).length ? m.entidades.map((e) => `${e.linha} — ${e.nome}`).join(' · ') : '—'}
          </p>
          <p className="sub" style={{ marginTop: 10 }}>Esses dados o próprio filho edita no perfil dele.</p>
        </div>
      </div>

      <div className="grade c2" style={{ marginTop: 20 }}>
        <div className="cartao">
          <h3>Histórico de GTs</h3>
          {m.historicoGts.length ? (
            <table>
              <thead><tr><th>Quando</th><th>GT</th></tr></thead>
              <tbody>
                {m.historicoGts.map((h, i) => (
                  <tr key={i}><td>{dataBr(h.data)}</td><td>{h.gtNome}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="sub">Nunca foi alocado(a) em um GT.</p>}
        </div>

        <div className="cartao">
          <h3>Pagamentos</h3>
          {m.pagamentos.length ? (
            <div className="tabela-rolagem">
              <table>
                <thead><tr><th>Referência</th><th>Tipo</th><th>Valor</th><th>Situação</th></tr></thead>
                <tbody>
                  {m.pagamentos.map((p) => (
                    <tr key={p._id}>
                      <td>{p.referencia}</td>
                      <td>{p.tipo === 'mensalidade' ? 'Mensalidade' : p.tipo === 'gira_extra' ? 'Gira extra' : 'Outro'}</td>
                      <td>{dinheiro(p.valor)}</td>
                      <td>{p.status === 'pago' ? <Tag cor="verde">Pago</Tag> : <Tag cor="vermelha">Pendente</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="sub">Nenhum lançamento.</p>}
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 20 }}>
        <h3>Jogos de búzios</h3>
        <p className="sub" style={{ marginBottom: 12 }}>
          Registros que aparecem no perfil do filho, organizados por data (mais recente primeiro).
        </p>
        {m.buzios.map((b) => (
          <div className="resposta" key={b._id} style={{ margin: '0 0 10px' }}>
            <strong>{dataBr(b.data)}</strong>{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); apagarBuzio(b._id); }} title="Apagar">✕</a>
            <div style={{ whiteSpace: 'pre-wrap' }}>{b.texto}</div>
          </div>
        ))}
        <div className="form-linha" style={{ marginTop: 10 }}>
          <div><label>Data do jogo</label><input type="date" value={buzio.data} onChange={(e) => setBuzio((b) => ({ ...b, data: e.target.value }))} /></div>
          <div style={{ flex: 2 }}>
            <label>Anotações do jogo</label>
            <textarea rows={2} value={buzio.texto} onChange={(e) => setBuzio((b) => ({ ...b, texto: e.target.value }))} />
          </div>
          <button className="btn mini cheio" onClick={novoBuzio}>Registrar jogo</button>
        </div>
      </div>

      {m.certificados.length > 0 && (
        <div className="cartao" style={{ marginTop: 20 }}>
          <h3>Certificados emitidos</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {m.certificados.map((c) => (
              <li key={c._id}>
                <Link to={'/certificado/' + c._id} target="_blank" rel="noopener noreferrer">{c.titulo}</Link> — {dataBr(c.data)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
