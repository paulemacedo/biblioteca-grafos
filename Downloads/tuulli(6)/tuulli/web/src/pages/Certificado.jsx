import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dataBr } from '../api.js';
import './certificado.css';

export default function Certificado() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/certificados/' + id).then(async (r) => {
      if (r.status === 401) return (window.location.href = '/login');
      const d = await r.json();
      if (!r.ok) return setErro(d.erro || 'Certificado não encontrado.');
      setC(d);
    });
  }, [id]);

  return (
    <div className="pagina-certificado">
      <div>
        <div className="folha">
          {erro && <p>{erro}</p>}
          {!erro && !c && <p>Carregando certificado…</p>}
          {c && (
            <>
              <img className="logo" src="/assets/logo.jpg" alt="" />
              <div className="eyebrow">{c.casa.nome}</div>
              <h1>Certificado</h1>
              <p style={{ margin: '4px 0 0' }}>Certificamos que</p>
              <div className="nome">{c.membroNome}</div>
              <p style={{ margin: 0 }}><strong>{c.titulo}</strong></p>
              <p className="descricao">{c.descricao}</p>
              <p style={{ margin: '6px 0 0' }}>Emitido em {dataBr(c.data)}</p>
              <div className="assinatura">
                <div className="traco" />
                <div>{c.casa.maeDeSanto}</div>
                <small style={{ color: 'var(--tinta-suave)' }}>Dirigente espiritual</small>
              </div>
            </>
          )}
        </div>
        <p className="acoes" style={{ textAlign: 'center' }}>
          <button className="btn cheio" onClick={() => window.print()}>Imprimir / salvar em PDF</button>{' '}
          <Link className="btn" to="/app/certificados">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
