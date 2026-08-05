/* Peças visuais reutilizadas da identidade da casa */

export function Tag({ cor = 'cinza', children }) {
  return <span className={`tag ${cor}`}>{children}</span>;
}

export function TagTipo({ tipo }) {
  if (tipo === 'gira') return <Tag cor="verde">Gira</Tag>;
  if (tipo === 'gira_extra') return <Tag cor="amarela">Gira extra</Tag>;
  if (tipo === 'desenvolvimento') return <Tag cor="cinza">Desenvolvimento</Tag>;
  return <Tag>{tipo}</Tag>;
}

/* Divisor "ponto riscado": estrela de oito pontas dentro do círculo */
export function PontoDivisor() {
  return (
    <div className="ponto-divisor" aria-hidden="true">
      <svg viewBox="0 0 60 60" fill="none" stroke="#1e5a38" strokeWidth="1.4">
        <circle cx="30" cy="30" r="22" />
        <path d="M30 12 L34 26 L48 30 L34 34 L30 48 L26 34 L12 30 L26 26 Z" />
      </svg>
    </div>
  );
}

/* Selo com a logo ao centro e inscrição circular girando devagar,
   ecoando o texto circular da própria logo do TUULLI */
export function Selo({ texto }) {
  return (
    <div className="selo" aria-hidden="true">
      <svg viewBox="0 0 300 300">
        <defs>
          <path id="circulo" d="M150,150 m-118,0 a118,118 0 1,1 236,0 a118,118 0 1,1 -236,0" />
        </defs>
        <text fill="#1e5a38" fontSize="15.5" letterSpacing="4" fontFamily="Marcellus, serif">
          <textPath href="#circulo">{texto}</textPath>
        </text>
      </svg>
      <div className="logo-central" />
    </div>
  );
}
