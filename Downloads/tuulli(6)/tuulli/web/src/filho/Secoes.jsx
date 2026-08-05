import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataBr } from '../api.js';
import { Tag, TagTipo } from '../components/Visual.jsx';
import { CalendarioCartaz } from '../components/Cartazes.jsx';

/* ------------------------------ Calendário ------------------------------ */
export function Calendario() {
  const [eventos, setEventos] = useState([]);
  const [visao, setVisao] = useState('lista'); // 'lista' | 'cartaz'
  const [ano, setAno] = useState(new Date().getFullYear());
  const [sigla, setSigla] = useState('TUULLI');

  useEffect(() => {
    api('/api/eventos').then(setEventos);
    fetch('/api/public/info').then((r) => r.json()).then((i) => setSigla(i.sigla || i.nome));
  }, []);

  const anos = [...new Set(eventos.map((e) => Number(e.data?.slice(0, 4))).filter(Boolean))].sort();

  return (
    <>
      <div className="nao-imprimir">
        <h1>Calendário</h1>
        <p className="sub">Giras, desenvolvimentos e festas da casa.</p>
        <div className="abas">
          <button className={'btn mini' + (visao === 'lista' ? ' cheio' : '')} onClick={() => setVisao('lista')}>Lista</button>
          <button className={'btn mini' + (visao === 'cartaz' ? ' cheio' : '')} onClick={() => setVisao('cartaz')}>Cartaz do ano</button>
          {visao === 'cartaz' && (
            <>
              <select value={ano} onChange={(e) => setAno(Number(e.target.value))} style={{ width: 'auto' }}>
                {(anos.length ? anos : [ano]).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button className="btn mini" onClick={() => window.print()}>Imprimir</button>
            </>
          )}
        </div>
      </div>

      {visao === 'cartaz' ? (
        <CalendarioCartaz eventos={eventos} ano={ano} sigla={sigla} />
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr><th>Data</th><th>Hora</th><th>Evento</th><th>Tipo</th><th>Situação</th><th>Escala</th></tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e._id}>
                  <td>{dataBr(e.data)}</td>
                  <td>{e.hora}</td>
                  <td><strong>{e.titulo}</strong><br /><small>{e.descricao}</small></td>
                  <td><TagTipo tipo={e.tipo} /></td>
                  <td>{e.encerrada ? <Tag>Encerrada</Tag> : <Tag cor="verde">Agendada</Tag>}</td>
                  <td><Link className="btn mini" to={`/escala/${e._id}`}>Ver escala</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Apostilas ------------------------------ */
export function Apostilas() {
  const [apostilas, setApostilas] = useState(null);
  useEffect(() => { api('/api/apostilas').then(setApostilas); }, []);
  if (!apostilas) return null;
  return (
    <>
      <h1>Apostilas</h1>
      <p className="sub">Materiais de estudo publicados pela administração.</p>
      {apostilas.length ? (
        <div className="grade c2">
          {apostilas.map((a) => (
            <div className="cartao" key={a._id}>
              <h3>{a.titulo}</h3>
              <p style={{ margin: '0 0 12px', color: 'var(--tinta-suave)' }}>{a.descricao}</p>
              <a className="btn mini cheio" href={`/api/apostilas/${a._id}/arquivo`}>Baixar PDF</a>
            </div>
          ))}
        </div>
      ) : (
        <p className="sub">Nenhuma apostila publicada ainda. A administração fará o envio por aqui.</p>
      )}
    </>
  );
}

/* ------------------------------ Frequência ------------------------------ */
const ROTULOS_MOTIVO = {
  doenca: 'Doença', trabalho: 'Trabalho', filhos: 'Filhos',
  acidente: 'Acidente', outro: 'Outro',
};

export function MinhaFrequencia() {
  const [f, setF] = useState(null);
  useEffect(() => { api('/api/minha-frequencia').then(setF); }, []);
  if (!f) return null;

  const statusJust = (j) => {
    if (!j) return <span style={{ color: 'var(--tinta-suave)' }}>—</span>;
    if (j.status === 'aceita') return <Tag cor="verde">Justificada ({ROTULOS_MOTIVO[j.motivo] || j.motivo})</Tag>;
    if (j.status === 'recusada') return <Tag cor="vermelha">Justificativa não aceita</Tag>;
    return <Tag cor="amarela">Em análise pela administração</Tag>;
  };

  return (
    <>
      <h1>Minha frequência</h1>
      <p className="sub">
        Sua presença nas giras já encerradas. <strong>Faltou?</strong> Avise a administração
        (pessoalmente ou pelo grupo) — é a casa que registra a justificativa aqui.
        Regra: <strong>2 faltas não justificadas geram advertência e 3 geram suspensão</strong>.
      </p>

      <div className="grade c3" style={{ marginBottom: 22 }}>
        <div className="cartao"><div className="num">{f.compareceu}/{f.total}</div><div className="rotulo">Presenças</div></div>
        <div className="cartao"><div className="num">{f.percentual}%</div><div className="rotulo">Assiduidade</div></div>
        <div className="cartao">
          <div className="num">{f.faltasNaoJustificadas}</div>
          <div className="rotulo">
            Faltas não justificadas —{' '}
            {f.situacao === 'ok' && <Tag cor="verde">Situação regular</Tag>}
            {f.situacao === 'advertencia' && <Tag cor="amarela">Advertência</Tag>}
            {f.situacao === 'suspensao' && <Tag cor="vermelha">Suspensão</Tag>}
          </div>
        </div>
      </div>

      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Data</th><th>Gira</th><th>Presença</th><th>Justificativa</th></tr></thead>
          <tbody>
            {f.lista.map((l) => (
              <tr key={l.eventoId}>
                <td>{dataBr(l.data)}</td>
                <td>{l.titulo}</td>
                <td>{l.presente ? <Tag cor="verde">Presente</Tag> : <Tag cor="vermelha">Ausente</Tag>}</td>
                <td>{l.presente ? '—' : statusJust(l.justificativa)}</td>
              </tr>
            ))}
            {!f.lista.length && <tr><td colSpan={4}><em>Nenhuma gira encerrada ainda.</em></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ------------------------------ FAQ ------------------------------ */
export function Faq() {
  const [posts, setPosts] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [respostas, setRespostas] = useState({}); // id do post -> texto digitado

  const carrega = () => api('/api/faq').then(setPosts);
  useEffect(() => { carrega(); }, []);

  async function publicar() {
    await api('/api/faq', { method: 'POST', body: JSON.stringify({ titulo, texto }) });
    setTitulo(''); setTexto('');
    carrega();
  }
  async function responder(id) {
    await api(`/api/faq/${id}/respostas`, { method: 'POST', body: JSON.stringify({ texto: respostas[id] || '' }) });
    setRespostas((r) => ({ ...r, [id]: '' }));
    carrega();
  }

  return (
    <>
      <h1>Mural de dúvidas</h1>
      <p className="sub">Espaço da comunidade: pergunte e ajude os irmãos de casa.</p>
      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Nova dúvida</h3>
        <label>Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Resuma sua dúvida" />
        <label>Detalhes (opcional)</label>
        <textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <p><button className="btn mini cheio" onClick={publicar}>Publicar</button></p>
      </div>
      {posts.map((p) => (
        <div className="cartao pergunta" key={p._id}>
          <h3>{p.titulo}</h3>
          <div className="meta">por {p.autor} em {dataBr(p.data)}</div>
          <div>{p.texto}</div>
          {(p.respostas || []).map((r, i) => (
            <div className="resposta" key={i}><strong>{r.autor}:</strong> {r.texto}</div>
          ))}
          <div className="form-linha" style={{ marginTop: 12 }}>
            <div>
              <input
                placeholder="Escreva uma resposta..."
                value={respostas[p._id] || ''}
                onChange={(e) => setRespostas((r) => ({ ...r, [p._id]: e.target.value }))}
              />
            </div>
            <button className="btn mini" onClick={() => responder(p._id)}>Responder</button>
          </div>
        </div>
      ))}
    </>
  );
}

/* ------------------------------ Certificados ------------------------------ */
export function Certificados() {
  const [certs, setCerts] = useState(null);
  useEffect(() => { api('/api/certificados').then(setCerts); }, []);
  if (!certs) return null;
  return (
    <>
      <h1>Certificados</h1>
      <p className="sub">Certificados emitidos em seu nome pela administração.</p>
      {certs.length ? (
        <div className="grade c2">
          {certs.map((c) => (
            <div className="cartao" key={c._id}>
              <h3>{c.titulo}</h3>
              <p style={{ color: 'var(--tinta-suave)', margin: '0 0 12px' }}>Emitido em {dataBr(c.data)}</p>
              <Link className="btn mini cheio" to={`/certificado/${c._id}`} target="_blank" rel="noopener noreferrer">
                Ver e imprimir
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="sub">Você ainda não tem certificados emitidos. Eles aparecem aqui quando a administração emitir.</p>
      )}
    </>
  );
}

/* ------------------------------ Documentos ------------------------------ */
export function Documentos() {
  const [docs, setDocs] = useState(null);
  const [nomes, setNomes] = useState({});
  const carrega = () => api('/api/documentos').then(setDocs);
  useEffect(() => { carrega(); }, []);

  async function assinar(id) {
    const nome = (nomes[id] || '').trim();
    if (!nome) return alert('Digite seu nome completo para assinar.');
    await api(`/api/documentos/${id}/assinar`, { method: 'POST', body: JSON.stringify({ nome }) });
    carrega();
  }

  if (!docs) return null;
  return (
    <>
      <h1>Documentos</h1>
      <p className="sub">Documentos da casa aguardando sua assinatura.</p>
      {docs.length ? docs.map((d) => (
        <div className="cartao" key={d._id} style={{ marginBottom: 16 }}>
          <h3>{d.titulo}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{d.conteudo}</p>
          {d.jaAssinei ? (
            <Tag cor="verde">Você já assinou este documento</Tag>
          ) : (
            <div className="form-linha">
              <div>
                <input
                  placeholder="Digite seu nome completo para assinar"
                  value={nomes[d._id] || ''}
                  onChange={(e) => setNomes((n) => ({ ...n, [d._id]: e.target.value }))}
                />
              </div>
              <button className="btn mini cheio" onClick={() => assinar(d._id)}>Assinar</button>
            </div>
          )}
        </div>
      )) : <p className="sub">Nenhum documento aguardando assinatura.</p>}
    </>
  );
}
