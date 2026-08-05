import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, dataBr } from '../api.js';
import { EscalaQuadros } from '../components/Cartazes.jsx';

export default function Escala() {
  const { id } = useParams();
  const [d, setD] = useState(null);

  useEffect(() => { api('/api/eventos/' + id + '/escala').then(setD); }, [id]);

  if (!d) return null;
  return (
    <div className="pagina-cartaz">
      <div className="miolo">
        <EscalaQuadros
          titulo={d.evento.titulo}
          subtitulo={`${dataBr(d.evento.data)}${d.evento.hora ? ' · ' + d.evento.hora : ''}`}
          funcoes={d.funcoes}
        />
        <p className="nao-imprimir" style={{ textAlign: 'center', marginTop: 26 }}>
          <button className="btn cheio" onClick={() => window.print()}>Imprimir / salvar em PDF</button>{' '}
          <Link className="btn" to="/app">Voltar</Link>
        </p>
      </div>
    </div>
  );
}
