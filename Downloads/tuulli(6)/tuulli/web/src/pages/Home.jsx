import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Selo, PontoDivisor } from '../components/Visual.jsx';

export default function Home() {
  const [info, setInfo] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [indicacoes, setIndicacoes] = useState([]);
  const [menu, setMenu] = useState(false);
  const trilhoRef = useRef(null);

  const [pausado, setPausado] = useState(false);

  const rola = (dir) => {
    const t = trilhoRef.current;
    if (!t) return;
    const passo = t.querySelector('figure')?.offsetWidth || t.clientWidth * 0.8;
    const fim = t.scrollWidth - t.clientWidth - 8;
    /* ao chegar no fim indo para a frente, volta ao começo (giro contínuo) */
    if (dir > 0 && t.scrollLeft >= fim) t.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir < 0 && t.scrollLeft <= 4) t.scrollTo({ left: fim, behavior: 'smooth' });
    else t.scrollBy({ left: dir * (passo + 14), behavior: 'smooth' });
  };

  /* passagem automática das fotos; pausa quando a pessoa interage
     ou quando a aba do navegador não está à vista */
  useEffect(() => {
    if (pausado || fotos.length < 2) return;
    const timer = setInterval(() => {
      if (!document.hidden) rola(1);
    }, 4500);
    return () => clearInterval(timer);
  }, [pausado, fotos.length]);

  useEffect(() => {
    fetch('/api/public/info').then((r) => r.json()).then((i) => {
      setInfo(i);
      document.title = `${i.sigla ? i.sigla + ' — ' : ''}${i.nome}`;
    });
    fetch('/api/public/galeria').then((r) => r.json()).then(setFotos);
    fetch('/api/public/indicacoes').then((r) => r.json()).then(setIndicacoes);
  }, []);

  if (!info) return null;

  const c = info.contatos || {};
  const seloTexto =
    info.selo ||
    (info.slogan || 'Caridade, fé e firmeza').toUpperCase().replace(/,\s*/g, ' · ') + ' · SARAVÁ · ';

  return (
    <>
      <header className="topo">
        <div className="wrap topo-inner">
          <img src="/assets/logo.jpg" alt={`Logo — ${info.nome}`} />
          <span className="nome-casa">{info.sigla || info.nome}</span>
          <button className="menu-btn" aria-label="Abrir menu" onClick={() => setMenu((m) => !m)}>
            {menu ? '✕' : '☰'}
          </button>
          <nav className={menu ? 'aberto' : ''} onClick={() => setMenu(false)}>
            <a href="#fundamentos">Fundamentos</a>
            <a href="#dirigente">Dirigente</a>
            <a href="#onde">Onde estamos</a>
            <a href="#galeria">Fotos</a>
            <a href="#calunguinha">Calunguinha</a>
            <a href="#indicacoes">Indicações</a>
            <a href="#contato">Contato</a>
            <Link className="btn-entrar" to="/login">Entrar</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">Casa aberta · consulta gratuita</div>
            <h1>{info.nome}</h1>
            <p className="slogan">{info.slogan}</p>
            <div className="hero-acoes">
              <a className="btn cheio" href="#contato">Fale com a gente</a>
              <a className="btn" href="#onde">Como chegar</a>
            </div>
          </div>
          <Selo texto={seloTexto} />
        </div>
      </div>

      <PontoDivisor />

      {/* FUNDAMENTOS */}
      <section className="bloco" id="fundamentos">
        <div className="wrap">
          <div className="eyebrow">Nossa doutrina</div>
          <h2>Fundamentos da casa</h2>
          <p className="texto-largo">{info.fundamentos}</p>
          <p className="texto-largo" style={{ color: 'var(--tinta-suave)' }}>{info.horarios}</p>
        </div>
      </section>

      {/* DIRIGENTE + ENDEREÇO */}
      <section className="bloco alt" id="dirigente">
        <div className="wrap duas-colunas">
          <div>
            <div className="eyebrow">Dirigente espiritual</div>
            <h2>{info.maeDeSanto?.nome}</h2>
            <p>{info.maeDeSanto?.texto}</p>
          </div>
          <div className="cartao" id="onde">
            <div className="eyebrow">Onde estamos</div>
            <p style={{ marginTop: 0 }}>{info.endereco}</p>
            {info.sede && <p style={{ color: 'var(--tinta-suave)', fontSize: 15 }}>O terreiro fica {info.sede}.</p>}
            <a
              className="btn"
              target="_blank"
              rel="noopener noreferrer"
              href={'https://www.google.com/maps/search/' + encodeURIComponent(info.endereco)}
            >
              Abrir no mapa
            </a>
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section className="bloco" id="galeria">
        <div className="wrap">
          <div className="eyebrow">A casa em movimento</div>
          <h2>Fotos</h2>
          {fotos.length ? (
            <div className="carrossel">
              {fotos.length > 1 && (
                <button className="seta esq" aria-label="Foto anterior"
                        onClick={() => { setPausado(true); rola(-1); setTimeout(() => setPausado(false), 8000); }}>‹</button>
              )}
              <div
              className="trilho"
              ref={trilhoRef}
              onMouseEnter={() => setPausado(true)}
              onMouseLeave={() => setPausado(false)}
              onTouchStart={() => setPausado(true)}
              onTouchEnd={() => setTimeout(() => setPausado(false), 6000)}
            >
                {fotos.map((f) => (
                  <figure key={f._id}>
                    <img src={`/uploads/galeria/${f.arquivo}`} alt={f.legenda || 'Foto da casa'} loading="lazy" />
                    <figcaption>{f.legenda}</figcaption>
                  </figure>
                ))}
              </div>
              {fotos.length > 1 && (
                <button className="seta dir" aria-label="Próxima foto"
                        onClick={() => { setPausado(true); rola(1); setTimeout(() => setPausado(false), 8000); }}>›</button>
              )}
            </div>
          ) : (
            <p className="galeria-vazia">As primeiras fotos da casa serão publicadas em breve pela administração.</p>
          )}
        </div>
      </section>

      {/* PROJETO CALUNGUINHA */}
      <section className="bloco calunguinha" id="calunguinha">
        <div className="wrap duas-colunas">
          <div>
            <div className="eyebrow">Ação social da casa</div>
            <h2>Projeto Calunguinha</h2>
            <p>
              🍽 Levando comida para quem precisa. O Calunguinha é um projeto solidário e
              sem fins lucrativos, nascido da caridade que move a Umbanda: prato feito,
              mão estendida e nenhuma pergunta a quem tem fome.
            </p>
            <p>
              📍 Rio de Janeiro · 🥘 Sem fins lucrativos<br />
              🥧 Contato e doações: <a href="mailto:projetocalunguinha@gmail.com">projetocalunguinha@gmail.com</a>
            </p>
            <p className="hero-acoes">
              <a className="btn cheio" href="https://www.instagram.com/projetocalunguinha/" target="_blank" rel="noopener noreferrer">
                Seguir no Instagram
              </a>
              <a className="btn" href="mailto:projetocalunguinha@gmail.com?subject=Quero%20ajudar%20o%20Projeto%20Calunguinha">
                Quero doar
              </a>
            </p>
          </div>
          <div className="calunguinha-marca">
            <img src="/assets/calunguinha.jpg" alt="Logo do Projeto Calunguinha" />
          </div>
        </div>
      </section>

      {/* INDICAÇÕES */}
      {indicacoes.length > 0 && (
        <section className="bloco alt" id="indicacoes">
          <div className="wrap">
            <div className="eyebrow">A casa indica</div>
            <h2>Indicações</h2>
            <div className="indicacoes">
              {indicacoes.map((i) => (
                <div className="cartao" key={i._id}>
                  <h3>{i.titulo}</h3>
                  <p style={{ color: 'var(--tinta-suave)' }}>{i.descricao}</p>
                  {i.link && (
                    <a className="btn mini" href={i.link} target="_blank" rel="noopener noreferrer">Visitar</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTATO */}
      <section className="bloco" id="contato">
        <div className="wrap duas-colunas">
          <div>
            <div className="eyebrow">Fale com a gente</div>
            <h2>Contato</h2>
            <ul className="contato-lista">
              {c.whatsapp && (
                <li>
                  <strong>WhatsApp:</strong>{' '}
                  <a href={'https://wa.me/55' + c.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer">
                    {c.whatsapp}
                  </a>
                </li>
              )}
              {c.email && (
                <li><strong>E-mail:</strong> <a href={'mailto:' + c.email}>{c.email}</a></li>
              )}
              {c.instagram && <li><strong>Instagram:</strong> {c.instagram}</li>}
            </ul>
          </div>
          <div className="cartao">
            <h3 style={{ marginTop: 0 }}>É filho da casa?</h3>
            <p>Acesse a área interna para ver apostilas, calendário, sua frequência e o mural de dúvidas da comunidade.</p>
            <Link className="btn cheio" to="/login">Entrar na área dos filhos</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          {info.nome} {info.sigla ? `— ${info.sigla}` : ''} · Axé e seja bem-vindo(a).
        </div>
      </footer>
    </>
  );
}
