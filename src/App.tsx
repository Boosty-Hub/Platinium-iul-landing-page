import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { GeoGate } from "@/components/shared/GeoGate";
import { CookieBanner } from "@/components/shared/CookieBanner";
import { AdminRoute } from "@/components/auth/AdminRoute";

const Index = lazy(() => import("./pages/Index.tsx"));
const SeguroVidaIUL = lazy(() => import("./pages/SeguroVidaIUL.tsx"));
const IULParaIndocumentados = lazy(() => import("./pages/IULParaIndocumentados.tsx"));
const IULParaHijos = lazy(() => import("./pages/IULParaHijos.tsx"));
const IULvs401k = lazy(() => import("./pages/IULvs401k.tsx"));
const Contacto = lazy(() => import("./pages/Contacto.tsx"));
const ProteccionFamiliar = lazy(() => import("./pages/ProteccionFamiliar.tsx"));
const IULEmprendedores = lazy(() => import("./pages/IULEmprendedores.tsx"));
const SeguroSinExamen = lazy(() => import("./pages/SeguroSinExamen.tsx"));
const BeneficiosEnVida = lazy(() => import("./pages/BeneficiosEnVida.tsx"));
const PoliticaPrivacidad = lazy(() => import("./pages/PoliticaPrivacidad.tsx"));
const Links = lazy(() => import("./pages/Links.tsx"));
const FormPanel = lazy(() => import("./pages/FormPanel.tsx"));
const AnalyticsPanel = lazy(() => import("./pages/AnalyticsPanel.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Asesor = lazy(() => import("./pages/Asesor.tsx"));
const Cotiza = lazy(() => import("./pages/Cotiza.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

// Routes that bypass GeoGate (accessible from anywhere)
const BYPASS_GEO = ["/form-panel", "/analytics", "/login", "/admin", "/asesor"];

const AppRoutes = () => {
  const location = useLocation();
  const bypass = BYPASS_GEO.some((p) => location.pathname.startsWith(p));

  const routes = (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/seguro-de-vida-iul" element={<SeguroVidaIUL />} />
        <Route path="/jubilacion-sin-401k" element={<Navigate to="/proteccion-familiar" replace />} />
        <Route path="/seguro-vida-itin" element={<IULParaIndocumentados />} />
        <Route path="/iul-vs-401k" element={<IULvs401k />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/proteccion-familiar" element={<ProteccionFamiliar />} />
        <Route path="/iul-emprendedores" element={<IULEmprendedores />} />
        <Route path="/seguro-vida-sin-examen-medico" element={<SeguroSinExamen />} />
        <Route path="/beneficios-en-vida" element={<BeneficiosEnVida />} />
        <Route path="/politica-de-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/links" element={<Links />} />
        <Route path="/login" element={<Login />} />
        <Route path="/form-panel" element={<Navigate to="/admin/leads" replace />} />
        <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/asesor/*" element={<Asesor />} />
        <Route path="/cotiza" element={<Cotiza />} />
        <Route path="/cotizacion-iul" element={<Navigate to="/cotiza" replace />} />
        <Route path="/iul-para-hijos" element={<IULParaHijos />} />
        {/* Redirects from old URLs */}
        <Route path="/iul-para-jubilacion" element={<Navigate to="/proteccion-familiar" replace />} />
        <Route path="/iul-para-indocumentados" element={<Navigate to="/seguro-vida-itin" replace />} />
        <Route path="/iul-proteccion-familiar" element={<Navigate to="/proteccion-familiar" replace />} />
        <Route path="/iul-para-emprendedores" element={<Navigate to="/iul-emprendedores" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );

  return bypass ? routes : <GeoGate>{routes}</GeoGate>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

