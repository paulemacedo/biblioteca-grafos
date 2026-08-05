import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { grauTexto } from '../components/Cartazes.jsx';
import Exportar from '../components/Exportar.jsx';
import { Busca, useBusca, chave } from '../components/Busca.jsx';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/* agrupa uma lista por chave; devolve [[chave, itens]] do maior para o menor */
const agrupa = (itens, chaveDe) => {
  const g = {};
  for (const i of itens) {
    const k = chaveDe(i) || '(não informado)';
    (g[k] = g[k] || []).push(i);
  }
  return Object.entries(g).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
};

export default function RelatorioMembros() {
  const [membros, setMembros] = useState([]);
  const [filtro, setFiltro] = useState({ orixa: '', linha: '', grau: '' });
  const [termo, setTermo] = useState('');

  useEffect(() => { api('/api/admin/membros').then((ms) => setMembros(ms.filter((m) => m.ativo))); }, []);

  const opcoes = useMemo(() => ({
    orixas: [...new Set(membros.map((m) => m.orixas?.frente).filter(Boolean))].sort(),
    linhas: [...new Set(membros.flatMap((m) => (m.entidades || []).map((e) => e.linha)))].sort(),
    graus: [...new Set(membros.map((m) => m.grau).filter((g) => g != null))].sort((a, b) => a - b),
  }), [membros]);

  /* aplica os filtros escolhidos + busca por nome */
  const filtrados = useMemo(() => {
    const t = chave(termo).trim();
    return membros.filter((m) =>
      (!filtro.orixa || m.orixas?.frente === filtro.orixa)
      && (!filtro.linha || (m.entidades || []).some((e) => e.linha === filtro.linha))
      && (!filtro.grau || String(m.grau) === filtro.grau)
      && (!t || chave(m.nome).includes(t))
    );
  }, [membros, filtro, termo]);

  const limpar = () => { setFiltro({ orixa: '', linha: '', grau: '' }); setTermo(''); };
  const temFiltro = filtro.orixa || filtro.linha || filtro.grau || termo;

  const mesAtual = new Date().getMonth() + 1;
  const aniversariantes = MESES.map((nome, i) => ({
    nome, mes: i + 1,
    lista: filtrados
      .filter((m) => m.nascimento && Number(m.nascimento.slice(5, 7)) === i + 1)
      .sort((a, b) => a.nascimento.slice(8, 10).localeCompare(b.nascimento.slice(8, 10))),
  })).filter((m) => m.lista.length);

  /* entidades dos membros filtrados, para as contagens por linha */
  const entidades = filtrados.flatMap((m) => (m.entidades || []).map((e) => ({ ...e, dono: m.nome, donoId: m._id })));
  const porLinha = agrupa(entidades, (e) => e.linha);

  const NomeLink = ({ m }) => <Link to={'/admin/membros/' + m._id}>{m.nome}</Link>;

  return (
    <>
      <h1>Relatório de membros</h1>
      <p className="sub">
        Aniversários, orixás, entidades, padrinhos e graus — com filtros para
        responder perguntas como “quantos malandros a casa tem?”.
      </p>
      <p>
        <Exportar tipo="membros" rotulo="Baixar membros" />{' '}
        <Exportar tipo="entidades" pdf={false} rotulo="Baixar entidades" />
      </p>

      {/* -------------------- filtros -------------------- */}
      <div className="filtros nao-imprimir">
        <div>
          <label>Orixá de frente</label>
          <select value={filtro.orixa} onChange={(e) => setFiltro((f) => ({ ...f, orixa: e.target.value }))}>
            <option value="">Todos</option>
            {opcoes.orixas.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label>Linha de entidade</label>
          <select value={filtro.linha} onChange={(e) => setFiltro((f) => ({ ...f, linha: e.target.value }))}>
            <option value="">Todas</option>
            {opcoes.linhas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label>Grau</label>
          <select value={filtro.grau} onChange={(e) => setFiltro((f) => ({ ...f, grau: e.target.value }))}>
            <option value="">Todos</option>
            {opcoes.graus.map((g) => <option key={g} value={String(g)}>{grauTexto(g)}</option>)}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label>Buscar por nome</label>
          <input type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome do médium..." />
        </div>
        {temFiltro && <button className="btn mini" onClick={limpar}>Limpar filtros</button>}
      </div>

      <p className="sub">
        Mostrando <strong>{filtrados.length}</strong> de {membros.length} membros ativos
        {filtro.linha && ` · linha ${filtro.linha}`}
        {filtro.orixa && ` · ${filtro.orixa}`}
        {filtro.grau && ` · ${grauTexto(Number(filtro.grau))}`}.
      </p>

      {/* -------------------- contagens -------------------- */}
      <div className="grade c3" style={{ marginBottom: 20 }}>
        <div className="cartao"><div className="num">{filtrados.length}</div><div className="rotulo">Médiuns</div></div>
        <div className="cartao"><div className="num">{entidades.length}</div><div className="rotulo">Entidades cadastradas</div></div>
        <div className="cartao"><div className="num">{porLinha.length}</div><div className="rotulo">Linhas representadas</div></div>
      </div>

      <div className="cartao" style={{ marginBottom: 20 }}>
        <h3>Quantas entidades por linha</h3>
        <div className="tabela-rolagem">
          <table>
            <thead><tr><th>Linha</th><th>Entidades</th><th>Médiuns</th><th></th></tr></thead>
            <tbody>
              {porLinha.map(([linha, lista]) => {
                const medEmLinha = new Set(lista.map((e) => e.donoId)).size;
                return (
                  <tr key={linha}>
                    <td><strong>{linha}</strong></td>
                    <td>{lista.length}</td>
                    <td>{medEmLinha}</td>
                    <td>
                      <button className="btn mini" onClick={() => setFiltro((f) => ({ ...f, linha }))}>
                        Ver só esta linha
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!porLinha.length && <tr><td colSpan={4}><em>Nenhuma entidade cadastrada com os filtros atuais.</em></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grade c2">
        <div className="cartao">
          <h3>Orixás de frente</h3>
          {agrupa(filtrados, (m) => m.orixas?.frente).map(([orixa, lista]) => (
            <p key={orixa} style={{ margin: '6px 0' }}>
              <strong>{orixa}</strong> ({lista.length}):{' '}
              {lista.map((m, i) => <span key={m._id}>{i > 0 && ', '}<NomeLink m={m} /></span>)}
            </p>
          ))}
        </div>
        <div className="cartao">
          <h3>Graus</h3>
          {agrupa(filtrados, (m) => grauTexto(m.grau)).map(([grau, lista]) => (
            <p key={grau} style={{ margin: '6px 0' }}>
              <strong>{grau}</strong> ({lista.length}):{' '}
              {lista.map((m, i) => <span key={m._id}>{i > 0 && ', '}<NomeLink m={m} /></span>)}
            </p>
          ))}
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 20 }}>
        <h3>Entidades por linha (nomes)</h3>
        {porLinha.length ? porLinha.map(([linha, lista]) => (
          <p key={linha} style={{ margin: '6px 0' }}>
            <strong>{linha}</strong> ({lista.length}):{' '}
            {lista.map((e, i) => (
              <span key={i}>{i > 0 && ' · '}{e.nome} <small>({e.dono.split(' ')[0]})</small></span>
            ))}
          </p>
        )) : <p className="sub">Nada a mostrar com os filtros atuais.</p>}
      </div>

      <div className="cartao" style={{ marginTop: 20 }}>
        <h3>🎂 Aniversariantes por mês</h3>
        <div className="grade c3">
          {aniversariantes.map((g) => (
            <div key={g.mes} style={g.mes === mesAtual ? { background: '#f2f8ef', borderRadius: 8, padding: '8px 10px' } : { padding: '8px 10px' }}>
              <strong>{g.nome}{g.mes === mesAtual ? ' (mês atual)' : ''}</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {g.lista.map((m) => (
                  <li key={m._id}>dia {Number(m.nascimento.slice(8, 10))} — <NomeLink m={m} /></li>
                ))}
              </ul>
            </div>
          ))}
          {!aniversariantes.length && <p className="sub">Ninguém com data de nascimento cadastrada.</p>}
        </div>
      </div>

      <div className="cartao" style={{ marginTop: 20 }}>
        <h3>Padrinhos</h3>
        {filtrados.filter((m) => (m.padrinhos?.orixas || []).length || (m.padrinhos?.pessoas || []).length).map((m) => (
          <p key={m._id} style={{ margin: '6px 0' }}>
            <NomeLink m={m} />:{' '}
            {[
              ...(m.padrinhos?.orixas || []).map((o) => `${o} (orixá)`),
              ...(m.padrinhos?.pessoas || []).map((x) => (typeof x === 'string' ? x : x.nome)),
            ].join(', ')}
          </p>
        ))}
      </div>
    </>
  );
}
