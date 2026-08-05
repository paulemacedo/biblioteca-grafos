import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Tag } from '../components/Visual.jsx';

const quando = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const TIPOS = {
  perfil: { rotulo: 'Alteração de perfil', cor: 'amarela' },
  certificado: { rotulo: 'Certificado retirado', cor: 'verde' },
};

export default function Notificacoes() {
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('todas');

  const carrega = () => api('/api/admin/notificacoes').then((d) => setLista(d.lista || []));
  useEffect(() => { carrega(); }, []);

  async function marcarLidas() {
    await api('/api/admin/notificacoes/lidas', { method: 'PUT' });
    carrega();
  }

  const mostradas = lista.filter((n) => filtro === 'todas' || (filtro === 'novas' ? !n.lida : n.tipo === filtro));
  const novas = lista.filter((n) => !n.lida).length;

  return (
    <>
      <h1>Notificações</h1>
      <p className="sub">
        A casa é avisada quando um filho muda dados do perfil (principalmente entidades)
        e quando alguém retira um certificado pelo site.
      </p>

      <div className="abas">
        {[['todas', 'Todas'], ['novas', `Não lidas (${novas})`], ['perfil', 'Alterações de perfil'], ['certificado', 'Certificados']].map(([v, r]) => (
          <button key={v} className={'btn mini' + (filtro === v ? ' cheio' : '')} onClick={() => setFiltro(v)}>{r}</button>
        ))}
        {novas > 0 && <button className="btn mini" onClick={marcarLidas}>Marcar todas como lidas</button>}
      </div>

      {mostradas.length ? mostradas.map((n) => (
        <div className={'notificacao' + (n.lida ? '' : ' nova')} key={n._id}>
          <Tag cor={TIPOS[n.tipo]?.cor || 'cinza'}>{TIPOS[n.tipo]?.rotulo || n.tipo}</Tag>{' '}
          {n.membroId ? <Link to={'/admin/membros/' + n.membroId}>{n.texto}</Link> : n.texto}
          <div className="quando">{quando(n.data)}</div>
        </div>
      )) : <p className="sub">Nada por aqui ainda.</p>}
    </>
  );
}
