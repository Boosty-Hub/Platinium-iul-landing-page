import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index.tsx"));
const SeguroVidaIUL = lazy(() => import("./pages/SeguroVidaIUL.tsx"));
const IULParaJubilacion = lazy(() => import("./pages/IULParaJubilacion.tsx"));
const IULParaIndocumentados = lazy(() => import("./pages/IULParaIndocumentados.tsx"));
const IULvs401k = lazy(() => import("./pages/IULvs401k.tsx"));
const Contacto = lazy(() => import("./pages/Contacto.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/seguro-de-vida-iul" element={<SeguroVidaIUL />} />
            <Route path="/iul-para-jubilacion" element={<IULParaJubilacion />} />
            <Route path="/iul-para-indocumentados" element={<IULParaIndocumentados />} />
            <Route path="/iul-vs-401k" element={<IULvs401k />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
