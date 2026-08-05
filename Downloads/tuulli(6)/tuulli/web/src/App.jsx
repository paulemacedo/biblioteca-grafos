import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Certificado from './pages/Certificado.jsx';
import Escala from './pages/Escala.jsx';
import Escalas from './admin/Escalas.jsx';
import Painel from './components/Painel.jsx';
import { Calendario, Apostilas, MinhaFrequencia, Faq, Certificados, Documentos } from './filho/Secoes.jsx';
import Perfil from './filho/Perfil.jsx';
import { Membros, CalendarioAdmin, Gts, Sugestoes, RelatorioFrequencia } from './admin/Gestao.jsx';
import {
  DocumentosAdmin, CertificadosAdmin, ApostilasAdmin, GaleriaAdmin, PaginaPublica,
} from './admin/Conteudos.jsx';
import Financeiro from './admin/Financeiro.jsx';
import Justificativas from './admin/Justificativas.jsx';
import PerfilMembro from './admin/PerfilMembro.jsx';
import RelatorioMembros from './admin/RelatorioMembros.jsx';
import Notificacoes from './admin/Notificacoes.jsx';

const itensFilho = [
  { para: '/app', rotulo: 'Calendário', end: true },
  { para: '/app/apostilas', rotulo: 'Apostilas' },
  { para: '/app/frequencia', rotulo: 'Minha frequência' },
  { para: '/app/faq', rotulo: 'Mural de dúvidas' },
  { para: '/app/certificados', rotulo: 'Certificados' },
  { para: '/app/documentos', rotulo: 'Documentos' },
  { para: '/app/perfil', rotulo: 'Meu perfil' },
];

const itensAdmin = [
  { para: '/admin', rotulo: 'Calendário e presenças', end: true },
  { para: '/admin/escalas', rotulo: 'Escalas das giras' },
  { para: '/admin/membros', rotulo: 'Membros' },
  { para: '/admin/gts', rotulo: 'Grupos de trabalho' },
  { para: '/admin/sugestoes', rotulo: 'Sugestões de GT' },
  { para: '/admin/frequencia', rotulo: 'Relatório de frequência' },
  { para: '/admin/justificativas', rotulo: 'Justificativas de falta' },
  { para: '/admin/notificacoes', rotulo: 'Notificações' },
  { para: '/admin/relatorio-membros', rotulo: 'Relatório de membros' },
  { para: '/admin/financeiro', rotulo: 'Financeiro' },
  { para: '/admin/documentos', rotulo: 'Documentos' },
  { para: '/admin/certificados', rotulo: 'Certificados' },
  { para: '/admin/apostilas', rotulo: 'Apostilas' },
  { para: '/admin/galeria', rotulo: 'Galeria do site' },
  { para: '/admin/pagina', rotulo: 'Página pública' },
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/certificado/:id" element={<Certificado />} />
        <Route path="/escala/:id" element={<Escala />} />

        {/* Área dos filhos da casa */}
        <Route path="/app" element={<Painel titulo="Área dos filhos" itens={itensFilho} />}>
          <Route index element={<Calendario />} />
          <Route path="apostilas" element={<Apostilas />} />
          <Route path="frequencia" element={<MinhaFrequencia />} />
          <Route path="faq" element={<Faq />} />
          <Route path="certificados" element={<Certificados />} />
          <Route path="documentos" element={<Documentos />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* Administração */}
        <Route path="/admin" element={<Painel titulo="Administração" itens={itensAdmin} exigeAdmin />}>
          <Route index element={<CalendarioAdmin />} />
          <Route path="escalas" element={<Escalas />} />
          <Route path="membros" element={<Membros />} />
          <Route path="gts" element={<Gts />} />
          <Route path="sugestoes" element={<Sugestoes />} />
          <Route path="frequencia" element={<RelatorioFrequencia />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="justificativas" element={<Justificativas />} />
          <Route path="relatorio-membros" element={<RelatorioMembros />} />
          <Route path="notificacoes" element={<Notificacoes />} />
          <Route path="membros/:id" element={<PerfilMembro />} />
          <Route path="documentos" element={<DocumentosAdmin />} />
          <Route path="certificados" element={<CertificadosAdmin />} />
          <Route path="apostilas" element={<ApostilasAdmin />} />
          <Route path="galeria" element={<GaleriaAdmin />} />
          <Route path="pagina" element={<PaginaPublica />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
