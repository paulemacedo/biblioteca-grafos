import { useEffect, useState } from 'react';
import { api } from '../api.js';

/**
 * Perfil do filho.
 *
 * Entidades e padrinhos são escolhidos em listas fixas (não em texto livre):
 * a linha vem do catálogo da casa e o padrinho pode ser um membro cadastrado
 * ou um orixá — assim "baiano" e "baianos" não viram duas coisas diferentes
 * e os relatórios da administração fecham certo.
 */
export default function Perfil() {
  const [p, setP] = useState(null);
  const [catalogo, setCatalogo] = useState({ linhas: [], orixas: [] });
  const [membros, setMembros] = useState([]);
  const [ok, setOk] = useState('');
  const [okSenha, setOkSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');

  const [nascimento, setNascimento] = useState('');
  const [email, setEmail] = useState('');
  const [frente, setFrente] = useState('');
  const [junto, setJunto] = useState('');
  const [padOrixas, setPadOrixas] = useState([]);   // ['Oxum', ...]
  const [padPessoas, setPadPessoas] = useState([]); // [{ nome, membroId }]
  const [entidades, setEntidades] = useState([]);   // [{ linha, nome }]

  // campos de inclusão
  const [novaEnt, setNovaEnt] = useState({ linha: '', nome: '' });
  const [novoPadOrixa, setNovoPadOrixa] = useState('');
  const [novoPadMembro, setNovoPadMembro] = useState('');
  const [novoPadFora, setNovoPadFora] = useState('');

  useEffect(() => {
    api('/api/catalogo').then((c) => { setCatalogo(c); setNovaEnt((n) => ({ ...n, linha: c.linhas[0] || '' })); });
    api('/api/membros-nomes').then(setMembros);
    api('/api/perfil').then(carregaPerfil);
  }, []);

  function carregaPerfil(perfil) {
    setP(perfil);
    setNascimento(perfil.nascimento || '');
    setEmail(perfil.email || '');
    setFrente(perfil.orixas?.frente || '');
    setJunto(perfil.orixas?.junto || '');
    setPadOrixas(perfil.padrinhos?.orixas || []);
    setPadPessoas((perfil.padrinhos?.pessoas || []).map((x) =>
      typeof x === 'string' ? { nome: x, membroId: null } : x));
    setEntidades(perfil.entidades || []);
  }

  async function salvar() {
    await api('/api/perfil', {
      method: 'PUT',
      body: JSON.stringify({
        nascimento, email,
        orixas: { frente, junto },
        padrinhos: { orixas: padOrixas, pessoas: padPessoas },
        entidades,
      }),
    });
    setOk('Perfil salvo — a administração é avisada das alterações.');
    setTimeout(() => setOk(''), 4000);
    api('/api/perfil').then(carregaPerfil);
  }

  async function trocarSenha() {
    await api('/api/perfil/senha', {
      method: 'PUT',
      body: JSON.stringify({ atual: senhaAtual, nova: senhaNova }),
    });
    setOkSenha('Senha atualizada.');
    setSenhaAtual(''); setSenhaNova('');
  }

  /* --------- inclusões --------- */
  function addEntidade() {
    const nome = novaEnt.nome.trim();
    if (!nome) return;
    setEntidades((l) => [...l, { linha: novaEnt.linha || catalogo.linhas[0], nome }]);
    setNovaEnt((n) => ({ ...n, nome: '' }));
  }
  function addPadOrixa() {
    if (!novoPadOrixa || padOrixas.includes(novoPadOrixa)) return;
    setPadOrixas((l) => [...l, novoPadOrixa]);
    setNovoPadOrixa('');
  }
  function addPadMembro() {
    const m = membros.find((x) => x._id === novoPadMembro);
    if (!m || padPessoas.some((p2) => p2.membroId === m._id)) return;
    setPadPessoas((l) => [...l, { nome: m.nome, membroId: m._id }]);
    setNovoPadMembro('');
  }
  function addPadFora() {
    const nome = novoPadFora.trim();
    if (!nome) return;
    setPadPessoas((l) => [...l, { nome, membroId: null }]);
    setNovoPadFora('');
  }

  if (!p) return null;

  return (
    <>
      <h1>Meu perfil</h1>
      <p className="sub">{p.nome}</p>

      <div className="grade c2">
        <div className="cartao">
          <h3>Dados de santo</h3>
          <label>Data de nascimento</label>
          <input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
          <label>E-mail (para avisos da casa)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Orixá de frente</label>
          <select value={frente} onChange={(e) => setFrente(e.target.value)}>
            <option value="">— não informado —</option>
            {catalogo.orixas.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <label>Orixá juntó</label>
          <select value={junto} onChange={(e) => setJunto(e.target.value)}>
            <option value="">— não informado —</option>
            {catalogo.orixas.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <label>Grau (definido pela administração)</label>
          <input value={p.grau != null ? `${p.grau}º` : 'Ainda sem grau definido'} disabled />
          <label>Grupo de trabalho</label>
          <input value={p.gt ? p.gt.nome : 'Ainda sem grupo de trabalho'} disabled />
        </div>

        <div className="cartao">
          <h3>Minhas entidades</h3>
          <p className="sub" style={{ marginBottom: 10 }}>
            Escolha a linha na lista e escreva só o nome da entidade.
          </p>
          {entidades.length ? (
            <table style={{ marginBottom: 12 }}>
              <thead><tr><th>Linha</th><th>Entidade</th><th></th></tr></thead>
              <tbody>
                {entidades.map((e, i) => (
                  <tr key={i}>
                    <td>
                      <select
                        value={e.linha}
                        onChange={(ev) => setEntidades((l) => l.map((x, j) => (j === i ? { ...x, linha: ev.target.value } : x)))}
                        style={{ width: 'auto' }}
                      >
                        {catalogo.linhas.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        value={e.nome}
                        onChange={(ev) => setEntidades((l) => l.map((x, j) => (j === i ? { ...x, nome: ev.target.value } : x)))}
                      />
                    </td>
                    <td><button className="btn mini perigo" onClick={() => setEntidades((l) => l.filter((_, j) => j !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="sub">Nenhuma entidade cadastrada ainda.</p>}

          <div className="form-linha">
            <div>
              <label>Linha</label>
              <select value={novaEnt.linha} onChange={(e) => setNovaEnt((n) => ({ ...n, linha: e.target.value }))}>
                {catalogo.linhas.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Nome da entidade</label>
              <input
                value={novaEnt.nome}
                onChange={(e) => setNovaEnt((n) => ({ ...n, nome: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addEntidade()}
                placeholder="Ex.: Caboclo Pena Branca"
              />
            </div>
            <button className="btn mini" onClick={addEntidade}>+ Adicionar</button>
          </div>
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 20 }}>
        <h3>Meus padrinhos e madrinhas</h3>
        <div className="grade c2">
          <div>
            <label>Orixás</label>
            {padOrixas.length ? (
              <p>
                {padOrixas.map((o) => (
                  <span key={o} className="etiqueta">
                    {o} <a href="#" onClick={(ev) => { ev.preventDefault(); setPadOrixas((l) => l.filter((x) => x !== o)); }}>✕</a>
                  </span>
                ))}
              </p>
            ) : <p className="sub">Nenhum orixá indicado.</p>}
            <div className="form-linha">
              <div>
                <select value={novoPadOrixa} onChange={(e) => setNovoPadOrixa(e.target.value)}>
                  <option value="">Escolher orixá...</option>
                  {catalogo.orixas.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <button className="btn mini" onClick={addPadOrixa}>+ Adicionar</button>
            </div>
          </div>

          <div>
            <label>Pessoas</label>
            {padPessoas.length ? (
              <p>
                {padPessoas.map((x, i) => (
                  <span key={i} className="etiqueta">
                    {x.nome}{!x.membroId && <small> (fora da casa)</small>}{' '}
                    <a href="#" onClick={(ev) => { ev.preventDefault(); setPadPessoas((l) => l.filter((_, j) => j !== i)); }}>✕</a>
                  </span>
                ))}
              </p>
            ) : <p className="sub">Nenhuma pessoa indicada.</p>}
            <div className="form-linha">
              <div>
                <select value={novoPadMembro} onChange={(e) => setNovoPadMembro(e.target.value)}>
                  <option value="">Alguém da casa...</option>
                  {membros.map((m) => <option key={m._id} value={m._id}>{m.nome}</option>)}
                </select>
              </div>
              <button className="btn mini" onClick={addPadMembro}>+ Adicionar</button>
            </div>
            <div className="form-linha" style={{ marginTop: 8 }}>
              <div>
                <input
                  value={novoPadFora}
                  onChange={(e) => setNovoPadFora(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPadFora()}
                  placeholder="Ou alguém de fora da casa"
                />
              </div>
              <button className="btn mini" onClick={addPadFora}>+ Adicionar</button>
            </div>
          </div>
        </div>
      </div>

      <p>
        <button className="btn cheio" onClick={salvar}>Salvar perfil</button>
        <span className="aviso-ok" style={{ marginLeft: 12 }}>{ok}</span>
      </p>

      {(p.buzios || []).length > 0 && (
        <div className="cartao" style={{ marginTop: 10 }}>
          <h3>Meus jogos de búzios</h3>
          <p className="sub" style={{ marginBottom: 12 }}>Registrados pela administração, do mais recente ao mais antigo.</p>
          {p.buzios.map((b) => (
            <div key={b._id} className="resposta" style={{ margin: '0 0 10px' }}>
              <strong>{b.data.slice(0, 10).split('-').reverse().join('/')}</strong>
              <div style={{ whiteSpace: 'pre-wrap' }}>{b.texto}</div>
            </div>
          ))}
        </div>
      )}

      <div className="cartao" style={{ maxWidth: 460, marginTop: 10 }}>
        <h3>Trocar senha</h3>
        <label>Senha atual</label>
        <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
        <label>Nova senha</label>
        <input type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} />
        <p>
          <button className="btn mini" onClick={trocarSenha}>Atualizar senha</button>
          <span className="aviso-ok" style={{ marginLeft: 10 }}>{okSenha}</span>
        </p>
      </div>
    </>
  );
}
