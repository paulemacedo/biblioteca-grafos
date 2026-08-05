import { useEffect, useState } from 'react';
import { api, dataBr } from '../api.js';
import Exportar from '../components/Exportar.jsx';
import { Busca, useBusca, chave, EscolheMembro } from '../components/Busca.jsx';
import { Tag } from '../components/Visual.jsx';

const ROTULOS = { doenca: 'Doença', trabalho: 'Trabalho', filhos: 'Filhos', acidente: 'Acidente', outro: 'Outro' };

export default function Justificativas() {
  const [justs, setJusts] = useState([]);
  const [membros, setMembros] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState({ membroId: '', eventoId: '', motivo: 'doenca', texto: '' });
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [termo, setTermo] = useState('');

  const carrega = () => api('/api/admin/justificativas').then(setJusts);
  useEffect(() => {
    carrega();
    api('/api/admin/membros').then((ms) => setMembros(ms.filter((m) => m.papel !== 'admin' && m.ativo)));
    api('/api/eventos').then((evs) => setEventos(evs.filter((e) => e.encerrada)));
  }, []);

  /* a administração lança a justificativa que o filho avisou pessoalmente,
     no WhatsApp, etc. — já entra como aceita */
  async function lancar() {
    setErro(''); setOk('');
    if (!form.membroId) return setErro('Escolha o filho ou a filha na busca acima.');
    try {
      await api('/api/admin/justificativas', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          membroId: form.membroId,
          eventoId: form.eventoId || eventos[0]?._id,
        }),
      });
      setOk('Justificativa registrada e aceita.');
      setForm((f) => ({ ...f, texto: '' }));
      setTimeout(() => setOk(''), 3000);
      carrega();
    } catch (e) {
      setErro(e.message || 'Não foi possível registrar.');
    }
  }

  async function decidir(id, status) {
    await api('/api/admin/justificativas/' + id, { method: 'PUT', body: JSON.stringify({ status }) });
    carrega();
  }

  const visiveis = justs.filter((j) => chave(j.membroNome).includes(chave(termo).trim()));
  const pendentes = visiveis.filter((j) => j.status === 'pendente');
  const decididas = visiveis.filter((j) => j.status !== 'pendente');

  const Linha = ({ j }) => (
    <tr>
      <td><strong>{j.membroNome}</strong></td>
      <td>{j.evento ? `${j.evento.titulo} (${dataBr(j.evento.data)})` : '—'}</td>
      <td>{ROTULOS[j.motivo] || j.motivo}</td>
      <td style={{ maxWidth: 280 }}>{j.texto || <em>sem detalhes</em>}</td>
      <td>
        {j.status === 'pendente' && <Tag cor="amarela">Pendente</Tag>}
        {j.status === 'aceita' && <Tag cor="verde">Aceita</Tag>}
        {j.status === 'recusada' && <Tag cor="vermelha">Recusada</Tag>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {j.status !== 'aceita' && <button className="btn mini cheio" onClick={() => decidir(j._id, 'aceita')}>Aceitar</button>}{' '}
        {j.status !== 'recusada' && <button className="btn mini perigo" onClick={() => decidir(j._id, 'recusada')}>Recusar</button>}
      </td>
    </tr>
  );

  return (
    <>
      <h1>Justificativas de falta</h1>
      <p className="sub">
        Faltas justificadas e aceitas não contam para a regra de disciplina
        (2 faltas não justificadas = advertência; 3 = suspensão).
      </p>
      <p><Exportar tipo="frequencia" rotulo="Baixar frequência" /></p>

      <div className="cartao" style={{ marginBottom: 22 }}>
        <h3>Lançar justificativa</h3>
        <p className="sub" style={{ marginTop: -4 }}>
          Quem registra é sempre a administração — o filho avisa a casa e você lança aqui.
        </p>
        <div className="form-linha">
          <div>
            <EscolheMembro
              membros={membros}
              rotulo="Filho(a)"
              aoEscolher={(id) => setForm((f) => ({ ...f, membroId: id }))}
            />
            <small style={{ color: 'var(--tinta-suave)' }}>
              {form.membroId
                ? `Selecionado: ${membros.find((m) => m._id === form.membroId)?.nome}`
                : 'Digite parte do nome e escolha na lista'}
            </small>
          </div>
          <div>
            <label>Gira</label>
            <select value={form.eventoId || eventos[0]?._id || ''} onChange={(e) => setForm((f) => ({ ...f, eventoId: e.target.value }))}>
              {eventos.map((e) => <option key={e._id} value={e._id}>{dataBr(e.data)} — {e.titulo}</option>)}
            </select>
          </div>
          <div>
            <label>Motivo</label>
            <select value={form.motivo} onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}>
              {Object.entries(ROTULOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label>Observação (opcional)</label>
            <input value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} />
          </div>
          <button className="btn mini cheio" onClick={lancar}>Registrar como aceita</button>
        </div>
        <div className="erro">{erro}</div>
        <span className="aviso-ok">{ok}</span>
      </div>

      <Busca valor={termo} aoMudar={setTermo} total={justs.length}
             mostrando={justs.filter((j) => chave(j.membroNome).includes(chave(termo).trim())).length}
             placeholder="Buscar justificativa por nome..." />

      <h3 style={{ marginTop: 8 }}>Aguardando decisão ({pendentes.length})</h3>
      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Filho(a)</th><th>Gira</th><th>Motivo</th><th>Detalhes</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {pendentes.length ? pendentes.map((j) => <Linha j={j} key={j._id} />)
              : <tr><td colSpan={6}><em>Nenhuma justificativa aguardando.</em></td></tr>}
          </tbody>
        </table>
      </div>

      {decididas.length > 0 && (
        <>
          <h3 style={{ marginTop: 26 }}>Já decididas</h3>
          <div className="tabela-rolagem">
            <table>
              <thead><tr><th>Filho(a)</th><th>Gira</th><th>Motivo</th><th>Detalhes</th><th>Situação</th><th></th></tr></thead>
              <tbody>{decididas.map((j) => <Linha j={j} key={j._id} />)}</tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
