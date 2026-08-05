import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataBr, dinheiro } from '../api.js';
import { Tag } from '../components/Visual.jsx';
import Exportar from '../components/Exportar.jsx';
import { Busca, useBusca, chave } from '../components/Busca.jsx';
import SeletorMes, { mesPorExtenso } from '../components/SeletorMes.jsx';

const mesAtual = () => new Date().toISOString().slice(0, 7);
const CatTag = ({ c }) => (c === 'fixo' ? <Tag>Fixo</Tag> : <Tag cor="amarela">Variável</Tag>);

function useFilhos() {
  const [filhos, setFilhos] = useState([]);
  useEffect(() => {
    api('/api/admin/membros').then((ms) => setFilhos(ms.filter((m) => m.papel !== 'admin')));
  }, []);
  return filhos;
}

/* mês de competência de um recebimento (mensalidade usa a referência;
   lançamento avulso usa o mês em que foi pago) — mesma regra do servidor */
export const mesDoPagamento = (p) => {
  const ref = (p.referencia || '').slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(ref)) return ref;
  return p.dataPagamento ? p.dataPagamento.slice(0, 7) : '';
};

export default function Financeiro() {
  const [aba, setAba] = useState('mensalidades');
  const [mes, setMes] = useState(mesAtual());
  const [tudo, setTudo] = useState(false); // false = só o mês escolhido

  const periodo = { mes, tudo };
  const rotuloPeriodo = tudo ? 'todo o período' : mesPorExtenso(mes);

  return (
    <>
      <h1>Financeiro</h1>
      <p className="sub">Mensalidades, outras receitas e gastos da casa — separando o que é fixo e o que é variável.</p>

      <div className="abas">
        {[['mensalidades', 'Mensalidades'], ['receitas', 'Outras receitas'], ['gastos', 'Gastos'], ['resumo', 'Resumo'], ['relatorios', 'Relatórios']].map(([v, r]) => (
          <button key={v} className={'btn mini' + (aba === v ? ' cheio' : '')} onClick={() => setAba(v)}>{r}</button>
        ))}
      </div>

      {aba !== 'relatorios' && (
        <div className="periodo nao-imprimir">
          <div className="botoes">
            <button className={'btn mini' + (!tudo ? ' cheio' : '')} onClick={() => setTudo(false)}>Por mês</button>
            <button className={'btn mini' + (tudo ? ' cheio' : '')} onClick={() => setTudo(true)}>Visão total</button>
          </div>
          {!tudo && <SeletorMes valor={mes} aoMudar={setMes} rotulo="" />}
          <span className="rotulo-periodo">Mostrando: <strong>{rotuloPeriodo}</strong></span>
        </div>
      )}

      {aba === 'mensalidades' && <Mensalidades periodo={periodo} />}
      {aba === 'receitas' && <OutrasReceitas periodo={periodo} />}
      {aba === 'gastos' && <Gastos periodo={periodo} />}
      {aba === 'resumo' && <Resumo periodo={periodo} />}
      {aba === 'relatorios' && <Relatorios />}
    </>
  );
}

/* ---------------------------- Mensalidades ---------------------------- */
function Mensalidades({ periodo }) {
  const { mes, tudo } = periodo;
  const [valor, setValor] = useState(50);
  const [pags, setPags] = useState([]);
  const [aviso, setAviso] = useState('');
  const [termo, setTermo] = useState('');
  const [soPendentes, setSoPendentes] = useState(false);

  /* ao abrir o mês, gera as pendências que faltarem: todo filho ativo
     já aparece como pendente assim que o mês é visto */
  async function carrega(m = mes, v = valor, atualizarValor = false) {
    /* na visão total não geramos nada: só listamos o histórico */
    if (!tudo) {
      const r = await api('/api/admin/pagamentos/gerar-mes', {
        method: 'POST', body: JSON.stringify({ mes: m, valor: v, atualizarValor }),
      });
      const partes = [];
      if (r.criadas) partes.push(`${r.criadas} mensalidade(s) gerada(s)`);
      if (r.atualizadas) partes.push(`${r.atualizadas} com valor atualizado para ${dinheiro(Number(v))}`);
      if (r.duplicadasRemovidas) partes.push(`${r.duplicadasRemovidas} duplicidade(s) removida(s)`);
      setAviso(partes.length ? partes.join(' · ') + ` em ${mesPorExtenso(m)}.` : '');
    } else setAviso('');
    const todos = await api('/api/admin/pagamentos');
    setPags(todos.filter((p) => p.tipo === 'mensalidade' && (tudo || p.referencia === m)));
  }
  useEffect(() => { carrega(); }, [mes, tudo]);

  /* aplica o valor digitado a todas as mensalidades pendentes do mês */
  async function aplicarValor() {
    await carrega(mes, valor, true);
  }

  async function alternar(p) {
    await api('/api/admin/pagamentos/' + p._id, {
      method: 'PUT',
      body: JSON.stringify({ status: p.status === 'pago' ? 'pendente' : 'pago' }),
    });
    carrega();
  }

  const pagos = pags.filter((p) => p.status === 'pago');
  const pendentes = pags.filter((p) => p.status === 'pendente');

  const emailCobranca = (p) =>
    `mailto:${p.membroEmail}?subject=${encodeURIComponent(`Mensalidade ${p.referencia} — TUULLI`)}` +
    `&body=${encodeURIComponent(
      `Axé, ${p.membroNome.split(' ')[0]}!\n\nPassando para lembrar que a mensalidade de ${p.referencia} ` +
      `(${dinheiro(p.valor)}) está em aberto. Qualquer dificuldade, fale com a administração.\n\nSaravá!\nTUULLI`
    )}`;
  const emailTodos = () => {
    const comEmail = pendentes.filter((p) => p.membroEmail);
    return `mailto:?bcc=${comEmail.map((p) => p.membroEmail).join(',')}` +
      `&subject=${encodeURIComponent(`Mensalidade ${mes} — TUULLI`)}` +
      `&body=${encodeURIComponent(
        `Axé, família!\n\nLembrete: a mensalidade de ${mes} está em aberto. ` +
        `Qualquer dificuldade, fale com a administração.\n\nSaravá!\nTUULLI`
      )}`;
  };

  return (
    <>
      <div className="form-linha" style={{ marginBottom: 14 }}>
        {!tudo && (
          <>
            <div style={{ maxWidth: 160 }}>
              <label>Valor da mensalidade (R$)</label>
              <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <button className="btn mini cheio" onClick={aplicarValor} title="Aplica a todas as mensalidades pendentes deste mês">
              Aplicar valor ao mês
            </button>
          </>
        )}
        {pendentes.some((p) => p.membroEmail) && (
          <a className="btn mini" href={emailTodos()}>✉ E-mail de cobrança para todos os pendentes</a>
        )}
        <Exportar tipo="pagamentos" rotulo="Baixar pagamentos" />
      </div>
      <div className="aviso-ok" style={{ marginBottom: 8 }}>{aviso}</div>

      <div className="grade c3" style={{ marginBottom: 18 }}>
        <div className="cartao"><div className="num">{dinheiro(pagos.reduce((s, p) => s + p.valor, 0))}</div><div className="rotulo">Recebido{tudo ? ' (total)' : ` em ${mesPorExtenso(mes)}`}</div></div>
        <div className="cartao"><div className="num">{dinheiro(pendentes.reduce((s, p) => s + p.valor, 0))}</div><div className="rotulo">Pendente{tudo ? ' (total)' : ` em ${mesPorExtenso(mes)}`}</div></div>
        <div className="cartao"><div className="num">{pagos.length}/{pags.length}</div><div className="rotulo">{tudo ? 'Mensalidades quitadas' : 'Filhos em dia'}</div></div>
      </div>

      <Busca valor={termo} aoMudar={setTermo} total={pags.length}
             mostrando={pags.filter((p) => chave(p.membroNome).includes(chave(termo))).length} />
      <p className="nao-imprimir">
        <button className={'btn mini' + (soPendentes ? ' cheio' : '')} onClick={() => setSoPendentes((v) => !v)}>
          {soPendentes ? 'Mostrando só pendentes' : `Ver só pendentes (${pendentes.length})`}
        </button>
      </p>

      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Filho(a)</th>{tudo && <th>Mês</th>}<th>Assiduidade</th><th>Valor</th><th>Categoria</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {pags
              .filter((p) => chave(p.membroNome).includes(chave(termo).trim()))
              .filter((p) => !soPendentes || p.status === 'pendente')
              .sort((a, b) => (b.referencia || '').localeCompare(a.referencia || '') || a.membroNome.localeCompare(b.membroNome)).map((p) => (
              <tr key={p._id}>
                <td><strong>{p.membroNome}</strong></td>
                {tudo && <td>{mesPorExtenso(p.referencia)}</td>}
                <td>
                  {p.giras
                    ? <Tag cor={p.assiduidade >= 75 ? 'verde' : p.assiduidade >= 50 ? 'amarela' : 'vermelha'}>{p.assiduidade}%</Tag>
                    : <span style={{ color: 'var(--tinta-suave)' }} title="Ainda não há giras encerradas">—</span>}
                </td>
                <td>{dinheiro(p.valor)}</td>
                <td><CatTag c={p.categoria} /></td>
                <td>{p.status === 'pago' ? <Tag cor="verde">Pago em {dataBr(p.dataPagamento)}</Tag> : <Tag cor="vermelha">Pendente</Tag>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn mini" onClick={() => alternar(p)}>{p.status === 'pago' ? 'Marcar pendente' : 'Marcar pago'}</button>{' '}
                  {p.status === 'pendente' && p.membroEmail && (
                    <a className="btn mini" href={emailCobranca(p)} title="Abrir e-mail de cobrança">✉</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sub" style={{ marginTop: 10 }}>
        Os botões ✉ abrem seu aplicativo de e-mail já com a mensagem de cobrança pronta.
        O filho também vê a pendência automaticamente ao entrar na área dele.
      </p>
    </>
  );
}

/* ---------------------------- Outras receitas ---------------------------- */
function OutrasReceitas({ periodo }) {
  const { mes, tudo } = periodo;
  const filhos = useFilhos();
  const [pags, setPags] = useState([]);
  const [form, setForm] = useState({ membroId: '', tipo: 'gira_extra', categoria: 'variavel', referencia: '', valor: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const carrega = () => api('/api/admin/pagamentos').then((todos) => setPags(
    todos.filter((p) => p.tipo !== 'mensalidade' && (tudo || mesDoPagamento(p) === mes))
  ));
  useEffect(() => { carrega(); }, [mes, tudo]);

  async function lancar() {
    await api('/api/admin/pagamentos', {
      method: 'POST',
      body: JSON.stringify({ ...form, membroId: form.membroId || filhos[0]?._id }),
    });
    setForm((f) => ({ ...f, referencia: '', valor: '' }));
    carrega();
  }
  async function alternar(p) {
    await api('/api/admin/pagamentos/' + p._id, {
      method: 'PUT',
      body: JSON.stringify({ status: p.status === 'pago' ? 'pendente' : 'pago' }),
    });
    carrega();
  }
  async function excluir(id) {
    if (!confirm('Excluir este lançamento?')) return;
    await api('/api/admin/pagamentos/' + id, { method: 'DELETE' });
    carrega();
  }

  return (
    <>
      <div className="cartao" style={{ marginBottom: 18 }}>
        <h3>Novo lançamento (gira extra, festa, contribuição...)</h3>
        <div className="form-linha">
          <div>
            <label>Membro</label>
            <select value={form.membroId || filhos[0]?._id || ''} onChange={set('membroId')}>
              {filhos.map((m) => <option key={m._id} value={m._id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select value={form.tipo} onChange={set('tipo')}>
              <option value="gira_extra">Gira extra</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label>Fixo ou variável?</label>
            <select value={form.categoria} onChange={set('categoria')}>
              <option value="variavel">Variável</option>
              <option value="fixo">Fixo</option>
            </select>
          </div>
          <div><label>Referência</label><input value={form.referencia} onChange={set('referencia')} placeholder="Festa de Omolu" /></div>
          <div><label>Valor (R$)</label><input type="number" step="0.01" value={form.valor} onChange={set('valor')} /></div>
          <button className="btn mini cheio" onClick={lancar}>Lançar</button>
        </div>
      </div>

      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Membro</th><th>Referência</th><th>Categoria</th><th>Valor</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {pags.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.membroNome}</strong></td>
                <td>{p.referencia}</td>
                <td><CatTag c={p.categoria} /></td>
                <td>{dinheiro(p.valor)}</td>
                <td>{p.status === 'pago' ? <Tag cor="verde">Pago em {dataBr(p.dataPagamento)}</Tag> : <Tag cor="vermelha">Pendente</Tag>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn mini" onClick={() => alternar(p)}>{p.status === 'pago' ? 'Marcar pendente' : 'Marcar pago'}</button>{' '}
                  <button className="btn mini perigo" onClick={() => excluir(p._id)}>✕</button>
                </td>
              </tr>
            ))}
            {!pags.length && (
              <tr><td colSpan={6}><em>
                Nenhum lançamento {tudo ? 'além das mensalidades.' : `em ${mesPorExtenso(mes)}.`}
              </em></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------------------- Gastos ---------------------------- */
function Gastos({ periodo }) {
  const { mes, tudo } = periodo;
  const [gastos, setGastos] = useState([]);
  const [form, setForm] = useState({ descricao: '', categoria: 'variavel', valor: '', data: '', pagoPor: 'caixa', recorrente: false });
  const mesGasto = mes;
  const [avisoGasto, setAvisoGasto] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const carrega = () => api('/api/admin/gastos').then((todos) => setGastos(
    todos.filter((g) => tudo || (g.data || '').slice(0, 7) === mes)
  ));
  useEffect(() => { carrega(); }, [mes, tudo]);

  async function lancar() {
    await api('/api/admin/gastos', { method: 'POST', body: JSON.stringify(form) });
    setForm({ descricao: '', categoria: 'variavel', valor: '', data: '', pagoPor: 'caixa', recorrente: false });
    carrega();
  }
  async function excluir(id) {
    if (!confirm('Excluir este gasto?')) return;
    await api('/api/admin/gastos/' + id, { method: 'DELETE' });
    carrega();
  }
  async function alternarRecorrente(g) {
    await api('/api/admin/gastos/' + g._id, { method: 'PUT', body: JSON.stringify({ recorrente: !g.recorrente }) });
    carrega();
  }
  /* lança no mês escolhido os gastos marcados como "todo mês" (aluguel, luz...) */
  async function lancarDoMes() {
    const r = await api('/api/admin/gastos/gerar-mes', { method: 'POST', body: JSON.stringify({ mes: mesGasto }) });
    setAvisoGasto(r.recorrentes
      ? `${r.criados} lançamento(s) criado(s) em ${mesPorExtenso(mesGasto)} (de ${r.recorrentes} gasto(s) marcados como todo mês).`
      : 'Nenhum gasto está marcado como "todo mês" ainda — marque com o 📌 na lista abaixo.');
    setTimeout(() => setAvisoGasto(''), 6000);
    carrega();
  }

  const doCaixa = gastos.filter((g) => g.pagoPor === 'caixa');
  const daAdm = gastos.filter((g) => g.pagoPor === 'administracao');

  return (
    <>
      <div className="cartao" style={{ marginBottom: 18 }}>
        <h3>Novo gasto</h3>
        <div className="form-linha">
          <div style={{ flex: 2 }}><label>Descrição</label><input value={form.descricao} onChange={set('descricao')} placeholder="Aluguel, velas, ervas, flores..." /></div>
          <div>
            <label>Fixo ou variável?</label>
            <select value={form.categoria} onChange={set('categoria')}>
              <option value="variavel">Variável</option>
              <option value="fixo">Fixo</option>
            </select>
          </div>
          <div><label>Valor (R$)</label><input type="number" step="0.01" value={form.valor} onChange={set('valor')} /></div>
          <div><label>Data</label><input type="date" value={form.data} onChange={set('data')} /></div>
          <div>
            <label>Quem pagou?</label>
            <select value={form.pagoPor} onChange={set('pagoPor')}>
              <option value="caixa">Caixa da casa</option>
              <option value="administracao">Administração (próprio dinheiro)</option>
            </select>
          </div>
          <div>
            <label>Repete todo mês?</label>
            <select value={form.recorrente ? 'sim' : 'nao'} onChange={(e) => setForm((f) => ({ ...f, recorrente: e.target.value === 'sim' }))}>
              <option value="nao">Não</option>
              <option value="sim">Sim (aluguel, luz...)</option>
            </select>
          </div>
          <button className="btn mini cheio" onClick={lancar}>Lançar gasto</button>
        </div>
      </div>

      <div className="cartao" style={{ marginBottom: 18 }}>
        <h3>Gastos de todo mês</h3>
        <p className="sub" style={{ marginTop: -4 }}>
          O aluguel do espaço, por exemplo: marque uma vez com 📌 e depois lance o mês inteiro com um clique.
        </p>
        <div className="form-linha">
          <button className="btn mini cheio" onClick={lancarDoMes} disabled={tudo}
                  title={tudo ? 'Escolha "Por mês" acima para lançar' : ''}>
            Lançar gastos fixos de {mesPorExtenso(mesGasto)}
          </button>
        </div>
        <span className="aviso-ok">{avisoGasto}</span>
      </div>

      <p><Exportar tipo="gastos" rotulo="Baixar gastos" /></p>

      <div className="grade c3" style={{ marginBottom: 18 }}>
        <div className="cartao"><div className="num">{dinheiro(doCaixa.reduce((s, g) => s + g.valor, 0))}</div><div className="rotulo">Gastos do caixa{tudo ? ' (total)' : ''}</div></div>
        <div className="cartao"><div className="num">{dinheiro(daAdm.reduce((s, g) => s + g.valor, 0))}</div><div className="rotulo">Administração pagou por fora</div></div>
        <div className="cartao"><div className="num">{dinheiro(gastos.filter((g) => g.categoria === 'fixo').reduce((s, g) => s + g.valor, 0))}</div><div className="rotulo">Total em gastos fixos</div></div>
      </div>

      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Todo mês</th><th>Quem pagou</th><th>Valor</th><th></th></tr></thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g._id}>
                <td>{dataBr(g.data)}</td>
                <td><strong>{g.descricao}</strong></td>
                <td><CatTag c={g.categoria} /></td>
                <td>
                  <button
                    className={'btn mini' + (g.recorrente ? ' cheio' : '')}
                    onClick={() => alternarRecorrente(g)}
                    title={g.recorrente ? 'Deixar de repetir todo mês' : 'Marcar como gasto de todo mês'}
                  >
                    {g.recorrente ? '📌 Todo mês' : 'Marcar'}
                  </button>
                </td>
                <td>{g.pagoPor === 'administracao' ? <Tag cor="amarela">Administração</Tag> : <Tag>Caixa</Tag>}</td>
                <td>{dinheiro(g.valor)}</td>
                <td><button className="btn mini perigo" onClick={() => excluir(g._id)}>✕</button></td>
              </tr>
            ))}
            {!gastos.length && (
              <tr><td colSpan={7}><em>
                Nenhum gasto lançado {tudo ? 'ainda.' : `em ${mesPorExtenso(mes)}.`}
              </em></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------------------- Resumo ---------------------------- */
function Resumo({ periodo }) {
  const { mes, tudo } = periodo;
  const [pags, setPags] = useState([]);
  const [gastos, setGastos] = useState([]);
  useEffect(() => {
    api('/api/admin/pagamentos').then((t) => setPags(t.filter((p) => tudo || mesDoPagamento(p) === mes)));
    api('/api/admin/gastos').then((t) => setGastos(t.filter((g) => tudo || (g.data || '').slice(0, 7) === mes)));
  }, [mes, tudo]);

  const soma = (lista) => lista.reduce((s, x) => s + x.valor, 0);
  const recebido = soma(pags.filter((p) => p.status === 'pago'));
  const pendente = soma(pags.filter((p) => p.status === 'pendente'));
  const gastoCaixa = soma(gastos.filter((g) => g.pagoPor === 'caixa'));
  const gastoAdm = soma(gastos.filter((g) => g.pagoPor === 'administracao'));

  return (
    <>
      <div className="grade c3" style={{ marginBottom: 18 }}>
        <div className="cartao"><div className="num">{dinheiro(recebido)}</div>
          <div className="rotulo">Recebido {tudo ? '(todo o período)' : `em ${mesPorExtenso(mes)}`}</div></div>
        <div className="cartao"><div className="num">{dinheiro(pendente)}</div><div className="rotulo">A receber (pendente)</div></div>
        <div className="cartao"><div className="num">{dinheiro(recebido - gastoCaixa)}</div><div className="rotulo">Saldo do caixa (recebido − gastos do caixa)</div></div>
      </div>
      <div className="grade c3">
        <div className="cartao"><div className="num">{dinheiro(gastoCaixa)}</div><div className="rotulo">Gastos pagos pelo caixa</div></div>
        <div className="cartao"><div className="num">{dinheiro(gastoAdm)}</div><div className="rotulo">Administração pagou do próprio bolso</div></div>
        <div className="cartao">
          <div className="num">{dinheiro(soma(pags.filter((p) => (p.categoria || 'fixo') === 'fixo')))} / {dinheiro(soma(pags.filter((p) => p.categoria === 'variavel')))}</div>
          <div className="rotulo">Receitas fixas / variáveis</div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------- Relatórios ---------------------------- */
function Relatorios() {
  const [r, setR] = useState(null);
  useEffect(() => { api('/api/admin/relatorios/financeiro').then(setR); }, []);
  if (!r) return null;

  const corPct = (p) => (p >= 80 ? 'verde' : p >= 50 ? 'amarela' : 'vermelha');
  const mesBr = (m) => {
    const [a, mm] = m.split('-');
    const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${nomes[Number(mm) - 1]}/${a}`;
  };

  return (
    <>
      <p><Exportar tipo="financeiro" rotulo="Baixar consolidado" /></p>

      <div className="grade c3" style={{ marginBottom: 18 }}>
        <div className="cartao">
          <div className="num">{r.geral.percentualRecebido}%</div>
          <div className="rotulo">Do previsto já recebido ({dinheiro(r.geral.recebido)} de {dinheiro(r.geral.previsto)})</div>
        </div>
        <div className="cartao"><div className="num">{dinheiro(r.geral.pendente)}</div><div className="rotulo">Em aberto</div></div>
        <div className="cartao"><div className="num">{dinheiro(r.geral.saldo)}</div><div className="rotulo">Saldo do caixa</div></div>
      </div>

      <h3>Mês a mês</h3>
      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr>
              <th>Mês</th><th>Previsto</th><th>Recebido</th><th>% recebido</th>
              <th>Mensalidades pagas</th><th>% adimplência</th>
              <th>Gastos caixa</th><th>Gastos adm.</th><th>Saldo do mês</th>
            </tr>
          </thead>
          <tbody>
            {r.porMes.map((m) => (
              <tr key={m.mes}>
                <td><strong>{mesBr(m.mes)}</strong></td>
                <td>{dinheiro(m.previsto)}</td>
                <td>{dinheiro(m.recebido)}</td>
                <td><Tag cor={corPct(m.percentualRecebido)}>{m.percentualRecebido}%</Tag></td>
                <td>{m.mensalidadesPagas}/{m.mensalidadesTotal}</td>
                <td><Tag cor={corPct(m.percentualAdimplencia)}>{m.percentualAdimplencia}%</Tag></td>
                <td>{dinheiro(m.gastoCaixa)}</td>
                <td>{dinheiro(m.gastoAdm)}</td>
                <td style={{ color: m.saldo < 0 ? 'var(--ponto)' : undefined }}>{dinheiro(m.saldo)}</td>
              </tr>
            ))}
            {!r.porMes.length && <tr><td colSpan={9}><em>Sem movimento lançado ainda.</em></td></tr>}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 26 }}>Fixo x variável, por mês</h3>
      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr><th>Mês</th><th>Receita fixa</th><th>Receita variável</th><th>Gasto fixo</th><th>Gasto variável</th><th>% do recebido que virou gasto</th></tr>
          </thead>
          <tbody>
            {r.porMes.map((m) => (
              <tr key={m.mes}>
                <td><strong>{mesBr(m.mes)}</strong></td>
                <td>{dinheiro(m.receitaFixa)}</td>
                <td>{dinheiro(m.receitaVariavel)}</td>
                <td>{dinheiro(m.gastoFixo)}</td>
                <td>{dinheiro(m.gastoVariavel)}</td>
                <td><Tag cor={m.percentualGasto > 100 ? 'vermelha' : m.percentualGasto > 80 ? 'amarela' : 'verde'}>{m.percentualGasto}%</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 26 }}>Situação por filho</h3>
      <BuscaDevedores r={r} />
    </>
  );
}

/* Situação por filho, com busca (a casa tem dezenas de membros) */
function BuscaDevedores({ r }) {
  const { termo, setTermo, filtrada } = useBusca(r.devedores, (d) => d.nome);
  const corPct = (p) => (p >= 80 ? 'verde' : p >= 50 ? 'amarela' : 'vermelha');
  return (
    <>
      <Busca valor={termo} aoMudar={setTermo} total={r.devedores.length} mostrando={filtrada.length} />
      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Filho(a)</th><th>Pagos</th><th>% em dia</th><th>Em aberto</th><th>Meses em aberto</th></tr></thead>
          <tbody>
            {filtrada.map((d) => (
              <tr key={d._id}>
                <td><Link to={'/admin/membros/' + d._id}><strong>{d.nome}</strong></Link></td>
                <td>{d.pagos}/{d.total}</td>
                <td><Tag cor={corPct(d.percentualEmDia)}>{d.percentualEmDia}%</Tag></td>
                <td>{dinheiro(d.emAberto)}</td>
                <td>{d.mesesEmAberto.join(', ') || '—'}</td>
              </tr>
            ))}
            {!filtrada.length && <tr><td colSpan={5}><em>Ninguém encontrado.</em></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
