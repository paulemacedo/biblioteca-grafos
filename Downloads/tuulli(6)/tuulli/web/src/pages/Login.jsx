import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const nav = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
    });
    const d = await r.json();
    if (!r.ok) return setErro(d.erro || 'Não foi possível entrar.');
    nav(d.papel === 'admin' ? '/admin' : '/app');
  }

  return (
    <div className="pagina-login">
      <form className="caixa-login" onSubmit={entrar}>
        <img src="/assets/logo.jpg" alt="Logo do TUULLI" />
        <h1>Área dos filhos da casa</h1>
        <p>Templo de Umbanda Universalista Luz de Lion</p>
        <label htmlFor="usuario">Usuário</label>
        <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <div className="erro" role="alert">{erro}</div>
        <button className="btn cheio" type="submit" style={{ width: '100%' }}>Entrar</button>
        <p style={{ marginTop: 18, marginBottom: 0 }}>
          <Link to="/">← Voltar ao site</Link>
        </p>
      </form>
    </div>
  );
}
