import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataBr } from '../api.js';
import { Tag } from '../components/Visual.jsx';

function useFilhos() {
  const [filhos, setFilhos] = useState([]);
  useEffect(() => {
    api('/api/admin/membros').then((ms) => setFilhos(ms.filter((m) => m.papel !== 'admin')));
  }, []);
  return filhos;
}

/* ------------------------------ Documentos ------------------------------ */
export function DocumentosAdmin() {
  const [docs, setDocs] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');

  const carrega = () => api('/api/documentos').then(setDocs);
  useEffect(() => { carrega(); }, []);

  async function publicar() {
    await api('/api/admin/documentos', { method: 'POST', body: JSON.stringify({ titulo, conteudo }) });
    setTitulo(''); setConteudo('');
    carrega();
  }

  return (
    <>
      <h1>Documentos</h1>
      <p className="sub">Publique documentos para assinatura dos filhos e acompanhe quem já assinou.</p>

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Novo documento</h3>
        <label>Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <label>Conteúdo</label>
        <textarea rows={5} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
        <p><button className="btn mini cheio" onClick={publicar}>Publicar para assinatura</button></p>
      </div>

      {docs.length ? docs.map((d) => (
        <div className="cartao" key={d._id} style={{ marginBottom: 16 }}>
          <h3>{d.titulo}</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--tinta-suave)' }}>{d.conteudo}</p>
          <p>
            <strong>{(d.assinaturas || []).length} assinatura(s):</strong>{' '}
            {(d.assinaturas || []).map((a) => `${a.nome} (${dataBr(a.data)})`).join(', ') || <em>nenhuma ainda</em>}
          </p>
        </div>
      )) : <p className="sub">Nenhum documento publicado.</p>}
    </>
  );
}

/* ------------------------------ Certificados ------------------------------ */
export function CertificadosAdmin() {
  const filhos = useFilhos();
  const [form, setForm] = useState({ membroId: '', titulo: '', descricao: '', data: '' });
  const [ok, setOk] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [emitidos, setEmitidos] = useState([]);
  const carrega = () => api('/api/admin/certificados').then(setEmitidos);
  useEffect(() => { carrega(); }, []);

  async function emitir() {
    await api('/api/admin/certificados', {
      method: 'POST',
      body: JSON.stringify({ ...form, membroId: form.membroId || filhos[0]?._id }),
    });
    setForm((f) => ({ ...f, titulo: '', descricao: '' }));
    setOk('Certificado emitido — já está disponível na área do filho.');
    setTimeout(() => setOk(''), 3500);
    carrega();
  }

  return (
    <>
      <h1>Certificados</h1>
      <p className="sub">Emita certificados de cursos e formações. O filho imprime pela área dele.</p>
      <div className="cartao" style={{ maxWidth: 640 }}>
        <h3>Emitir certificado</h3>
        <label>Membro</label>
        <select value={form.membroId || filhos[0]?._id || ''} onChange={set('membroId')}>
          {filhos.map((m) => <option key={m._id} value={m._id}>{m.nome}</option>)}
        </select>
        <label>Título (curso / formação)</label>
        <input value={form.titulo} onChange={set('titulo')} />
        <label>Descrição</label>
        <textarea rows={3} value={form.descricao} onChange={set('descricao')} />
        <label>Data (opcional)</label>
        <input type="date" value={form.data} onChange={set('data')} />
        <p>
          <button className="btn mini cheio" onClick={emitir}>Emitir</button>
          <span className="aviso-ok" style={{ marginLeft: 10 }}>{ok}</span>
        </p>
      </div>

      <h3 style={{ marginTop: 26 }}>Certificados emitidos</h3>
      <p className="sub">
        A coluna “retirada” mostra quando o filho abriu o certificado no site pela primeira vez —
        a casa também recebe um aviso em Notificações.
      </p>
      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Filho(a)</th><th>Título</th><th>Emitido em</th><th>Retirada no site</th><th></th></tr></thead>
          <tbody>
            {emitidos.map((c) => (
              <tr key={c._id}>
                <td><Link to={'/admin/membros/' + c.membroId}><strong>{c.membroNome}</strong></Link></td>
                <td>{c.titulo}</td>
                <td>{dataBr(c.data)}</td>
                <td>
                  {c.vistoEm
                    ? <Tag cor="verde">Retirado em {dataBr(c.vistoEm.slice(0, 10))}</Tag>
                    : <Tag cor="amarela">Ainda não retirado</Tag>}
                </td>
                <td><Link className="btn mini" to={'/certificado/' + c._id} target="_blank" rel="noopener noreferrer">Ver</Link></td>
              </tr>
            ))}
            {!emitidos.length && <tr><td colSpan={5}><em>Nenhum certificado emitido ainda.</em></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ------------------------------ Apostilas ------------------------------ */
export function ApostilasAdmin() {
  const [apostilas, setApostilas] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const arquivoRef = useRef(null);

  const carrega = () => api('/api/apostilas').then(setApostilas);
  useEffect(() => { carrega(); }, []);

  async function enviar() {
    const f = arquivoRef.current?.files[0];
    if (!f) return alert('Escolha o arquivo PDF.');
    const fd = new FormData();
    fd.append('titulo', titulo);
    fd.append('descricao', descricao);
    fd.append('arquivo', f);
    await api('/api/admin/apostilas', { method: 'POST', body: fd });
    setTitulo(''); setDescricao('');
    arquivoRef.current.value = '';
    carrega();
  }
  async function excluir(id) {
    if (!confirm('Excluir esta apostila?')) return;
    await api('/api/admin/apostilas/' + id, { method: 'DELETE' });
    carrega();
  }

  return (
    <>
      <h1>Apostilas</h1>
      <p className="sub">Envie os PDFs de estudo. Eles ficam disponíveis para download na área dos filhos.</p>

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Nova apostila</h3>
        <div className="form-linha">
          <div><label>Título</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div><label>Descrição</label><input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
          <div><label>Arquivo PDF</label><input type="file" accept="application/pdf" ref={arquivoRef} /></div>
          <button className="btn mini cheio" onClick={enviar}>Enviar</button>
        </div>
      </div>

      <table>
        <thead><tr><th>Título</th><th>Descrição</th><th>Publicada em</th><th></th></tr></thead>
        <tbody>
          {apostilas.length ? apostilas.map((a) => (
            <tr key={a._id}>
              <td><strong>{a.titulo}</strong></td>
              <td>{a.descricao}</td>
              <td>{dataBr(a.data)}</td>
              <td>
                <a className="btn mini" href={`/api/apostilas/${a._id}/arquivo`}>Baixar</a>{' '}
                <button className="btn mini perigo" onClick={() => excluir(a._id)}>Excluir</button>
              </td>
            </tr>
          )) : <tr><td colSpan={4}>Nenhuma apostila enviada.</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ------------------------------ Galeria ------------------------------ */
export function GaleriaAdmin() {
  const [fotos, setFotos] = useState([]);
  const [legenda, setLegenda] = useState('');
  const fotoRef = useRef(null);

  const carrega = () => api('/api/public/galeria').then(setFotos);
  useEffect(() => { carrega(); }, []);

  async function enviar() {
    const f = fotoRef.current?.files[0];
    if (!f) return alert('Escolha a imagem.');
    const fd = new FormData();
    fd.append('legenda', legenda);
    fd.append('foto', f);
    await api('/api/admin/galeria', { method: 'POST', body: fd });
    setLegenda('');
    fotoRef.current.value = '';
    carrega();
  }
  async function excluir(id) {
    if (!confirm('Excluir esta foto do site?')) return;
    await api('/api/admin/galeria/' + id, { method: 'DELETE' });
    carrega();
  }

  return (
    <>
      <h1>Galeria do site</h1>
      <p className="sub">As fotos enviadas aqui aparecem na página pública.</p>

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Nova foto</h3>
        <div className="form-linha">
          <div><label>Legenda</label><input value={legenda} onChange={(e) => setLegenda(e.target.value)} /></div>
          <div><label>Imagem</label><input type="file" accept="image/*" ref={fotoRef} /></div>
          <button className="btn mini cheio" onClick={enviar}>Publicar</button>
        </div>
      </div>

      {fotos.length ? (
        <div className="galeria">
          {fotos.map((f) => (
            <figure key={f._id}>
              <img src={`/uploads/galeria/${f.arquivo}`} alt={f.legenda} />
              <figcaption>
                {f.legenda} —{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); excluir(f._id); }}>excluir</a>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : <p className="sub">Nenhuma foto publicada ainda.</p>}
    </>
  );
}

/* ------------------------------ Página pública ------------------------------ */
export function PaginaPublica() {
  const [c, setC] = useState(null);
  const [ok, setOk] = useState('');

  useEffect(() => { api('/api/public/info').then(setC); }, []);

  const set = (k) => (e) => setC((v) => ({ ...v, [k]: e.target.value }));
  const setMae = (k) => (e) => setC((v) => ({ ...v, maeDeSanto: { ...v.maeDeSanto, [k]: e.target.value } }));
  const setContato = (k) => (e) => setC((v) => ({ ...v, contatos: { ...v.contatos, [k]: e.target.value } }));

  async function salvar() {
    await api('/api/admin/config', { method: 'PUT', body: JSON.stringify(c) });
    setOk('Página pública atualizada.');
    setTimeout(() => setOk(''), 3000);
  }

  if (!c) return null;
  return (
    <>
      <h1>Página pública</h1>
      <p className="sub">Tudo que os consulentes veem no site é editado aqui.</p>

      <div className="grade c2">
        <div className="cartao">
          <h3>Identidade</h3>
          <label>Nome da casa</label>
          <input value={c.nome} onChange={set('nome')} />
          <label>Sigla</label>
          <input value={c.sigla || ''} onChange={set('sigla')} />
          <label>Slogan</label>
          <input value={c.slogan} onChange={set('slogan')} />
          <label>Inscrição do selo (texto que gira em volta da logo)</label>
          <input value={c.selo || ''} onChange={set('selo')} />
          <label>Fundamentos</label>
          <textarea rows={6} value={c.fundamentos} onChange={set('fundamentos')} />
          <label>Horários</label>
          <textarea rows={2} value={c.horarios} onChange={set('horarios')} />
        </div>

        <div className="cartao">
          <h3>Dirigente, endereço e contatos</h3>
          <label>Nome da dirigente</label>
          <input value={c.maeDeSanto?.nome || ''} onChange={setMae('nome')} />
          <label>Apresentação da dirigente</label>
          <textarea rows={4} value={c.maeDeSanto?.texto || ''} onChange={setMae('texto')} />
          <label>Endereço</label>
          <input value={c.endereco} onChange={set('endereco')} />
          <label>Complemento da sede (ex.: "na sede da União Espiritista de Umbanda do Brasil")</label>
          <input value={c.sede || ''} onChange={set('sede')} />
          <label>WhatsApp</label>
          <input value={c.contatos?.whatsapp || ''} onChange={setContato('whatsapp')} />
          <label>E-mail</label>
          <input value={c.contatos?.email || ''} onChange={setContato('email')} />
          <label>Instagram</label>
          <input value={c.contatos?.instagram || ''} onChange={setContato('instagram')} />
        </div>
      </div>

      <p>
        <button className="btn cheio" onClick={salvar}>Salvar página pública</button>
        <span className="aviso-ok" style={{ marginLeft: 12 }}>{ok}</span>
      </p>

      <Indicacoes />
    </>
  );
}

/* Indicações mostradas no site (só a administração cadastra) */
function Indicacoes() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState({ titulo: '', descricao: '', link: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const carrega = () => api('/api/public/indicacoes').then(setLista);
  useEffect(() => { carrega(); }, []);

  async function criar() {
    await api('/api/admin/indicacoes', { method: 'POST', body: JSON.stringify(form) });
    setForm({ titulo: '', descricao: '', link: '' });
    carrega();
  }
  async function excluir(id) {
    if (!confirm('Excluir esta indicação do site?')) return;
    await api('/api/admin/indicacoes/' + id, { method: 'DELETE' });
    carrega();
  }

  return (
    <div className="cartao" style={{ marginTop: 24 }}>
      <h3>Indicações da casa (aparecem no site público)</h3>
      <div className="form-linha">
        <div><label>Título</label><input value={form.titulo} onChange={set('titulo')} /></div>
        <div style={{ flex: 2 }}><label>Descrição</label><input value={form.descricao} onChange={set('descricao')} /></div>
        <div><label>Link (opcional)</label><input value={form.link} onChange={set('link')} placeholder="https://..." /></div>
        <button className="btn mini cheio" onClick={criar}>Publicar indicação</button>
      </div>
      <table style={{ marginTop: 14 }}>
        <tbody>
          {lista.map((i) => (
            <tr key={i._id}>
              <td><strong>{i.titulo}</strong><br /><small>{i.descricao}</small></td>
              <td style={{ width: 60 }}><button className="btn mini perigo" onClick={() => excluir(i._id)}>✕</button></td>
            </tr>
          ))}
          {!lista.length && <tr><td><em>Nenhuma indicação publicada.</em></td></tr>}
        </tbody>
      </table>
    </div>
  );
}
