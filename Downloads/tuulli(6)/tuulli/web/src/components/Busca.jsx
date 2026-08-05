import { useMemo, useState } from 'react';

/** Tira acentos e caixa, para "joao" achar "João". */
export const chave = (t) => (t || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Campo de busca. Use com o hook useBusca. */
export function Busca({ valor, aoMudar, placeholder = 'Buscar por nome...', total, mostrando }) {
  return (
    <div className="busca nao-imprimir">
      <input
        type="search"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {valor && (
        <>
          <button className="btn mini" onClick={() => aoMudar('')}>limpar</button>
          <span className="contagem">{mostrando} de {total}</span>
        </>
      )}
    </div>
  );
}

/**
 * Filtra uma lista por texto livre.
 * `campos` é a função que devolve o texto pesquisável de cada item.
 */
export function useBusca(lista, campos) {
  const [termo, setTermo] = useState('');
  const filtrada = useMemo(() => {
    const t = chave(termo).trim();
    if (!t) return lista;
    const partes = t.split(/\s+/);
    return lista.filter((item) => {
      const texto = chave(campos(item));
      return partes.every((p) => texto.includes(p));
    });
  }, [lista, termo, campos]);
  return { termo, setTermo, filtrada };
}

/**
 * Seleção de membro com busca — para casas com muita gente, o <select>
 * puro fica ruim no celular. Digite parte do nome e escolha na lista.
 */
export function EscolheMembro({ membros, aoEscolher, rotulo = 'Adicionar médium', jaEscolhidos = [] }) {
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);

  const achados = useMemo(() => {
    const t = chave(termo).trim();
    const base = t ? membros.filter((m) => chave(m.nome).includes(t)) : membros;
    return base.slice(0, 8);
  }, [membros, termo]);

  return (
    <div className="escolhe-membro">
      {rotulo && <label>{rotulo}</label>}
      <input
        type="search"
        value={termo}
        placeholder="Digite parte do nome..."
        onChange={(e) => { setTermo(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 180)}
      />
      {aberto && achados.length > 0 && (
        <ul className="sugestoes-nomes">
          {achados.map((m) => (
            <li key={m._id}>
              <button
                type="button"
                onClick={() => { aoEscolher(m._id, m); setTermo(''); setAberto(false); }}
                disabled={jaEscolhidos.includes(m._id)}
              >
                {m.nome}
                {m.grau != null && <small> · {m.grau}º</small>}
                {jaEscolhidos.includes(m._id) && <small> · já escalado</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
