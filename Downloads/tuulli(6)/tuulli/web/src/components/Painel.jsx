import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { api, dinheiro } from '../api.js';

/**
 * Layout dos painéis internos: sidebar verde-mata no desktop,
 * barra superior com menu hambúrguer no celular.
 * Para os filhos, mostra um banner com mensalidades em aberto
 * e avisos de disciplina (advertência/suspensão por faltas).
 */
export default function Painel({ titulo, itens, exigeAdmin = false }) {
  const [eu, setEu] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [pend, setPend] = useState(null);
  const [naoLidas, setNaoLidas] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    api('/api/me').then((m) => {
      if (!m || (exigeAdmin && m.papel !== 'admin')) return nav('/login');
      setEu(m);
      if (m.papel !== 'admin') api('/api/minhas-pendencias').then(setPend).catch(() => {});
      else api('/api/admin/notificacoes')
        .then((d) => setNaoLidas(d.naoLidas || 0))
        .catch(() => {});
    });
  }, []);

  async function sair(e) {
    e.preventDefault();
    await api('/api/logout', { method: 'POST' });
    nav('/');
  }

  if (!eu) return null;

  const temMensalidade = pend?.mensalidades?.length > 0;
  const situacao = pend?.situacao;

  return (
    <div className="painel">
      <aside className={'lateral' + (aberto ? ' aberta' : '')}>
        <div className="marca">
          <img src="/assets/logo.jpg" alt="" />
          <span>TUULLI<br /><small style={{ fontFamily: 'Karla, sans-serif', fontSize: 12 }}>{titulo}</small></span>
        </div>
        <button className="hamburguer" aria-label="Abrir menu" onClick={() => setAberto((a) => !a)}>
          {aberto ? '✕' : '☰'}
        </button>
        {itens.map((i) => (
          <NavLink
            key={i.para}
            to={i.para}
            end={i.end}
            onClick={() => setAberto(false)}
            className={({ isActive }) => 'item' + (isActive ? ' ativo' : '')}
          >
            {i.rotulo}
            {i.rotulo === 'Notificações' && naoLidas > 0 && <span className="contador">{naoLidas}</span>}
          </NavLink>
        ))}
        <div className="fim">
          {eu.nome}<br />
          <a href="/" onClick={sair}>Sair</a>
        </div>
      </aside>
      <main className="conteudo">
        {temMensalidade && (
          <div className="banner-pendencia">
            💰 Você tem {pend.mensalidades.length === 1 ? 'a mensalidade' : `${pend.mensalidades.length} mensalidades`}{' '}
            <strong>{pend.mensalidades.map((m) => m.referencia).join(', ')}</strong> em aberto
            {' '}({dinheiro(pend.mensalidades.reduce((s, m) => s + m.valor, 0))}). Procure a administração para acertar.
          </div>
        )}
        {situacao === 'advertencia' && (
          <div className="banner-pendencia grave">
            ⚠️ Você está com <strong>2 faltas não justificadas</strong> — situação de <strong>advertência</strong>.{' '}
            Procure a administração para justificar. <Link to="/app/frequencia">Ver minha frequência.</Link>
          </div>
        )}
        {situacao === 'suspensao' && (
          <div className="banner-pendencia grave">
            ⛔ Você está com <strong>{pend.faltasNaoJustificadas} faltas não justificadas</strong> — situação de{' '}
            <strong>suspensão</strong>. Procure a administração o quanto antes.{' '}
            <Link to="/app/frequencia">Ver minha frequência.</Link>
          </div>
        )}
        <Outlet context={{ eu }} />
      </main>
    </div>
  );
}
