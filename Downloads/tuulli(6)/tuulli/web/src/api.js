/* Helpers compartilhados: chamada de API e formatação */

export async function api(url, opts = {}) {
  const r = await fetch(url, {
    headers: opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (r.status === 401) {
    window.location.href = '/login';
    throw new Error('login');
  }
  const d = await r.json();
  if (!r.ok) {
    alert(d.erro || 'Algo deu errado.');
    throw new Error(d.erro || 'erro');
  }
  return d;
}

export const dataBr = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

export const dinheiro = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
