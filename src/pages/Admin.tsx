import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";

const ResumenPage = lazy(() => import("./admin/ResumenPage"));
const LeadsPage = lazy(() => import("./admin/LeadsPage"));
const AnalyticsPage = lazy(() => import("./admin/AnalyticsPage"));
const ConfiguracionPage = lazy(() => import("./admin/ConfiguracionPage"));
const LlamadasPage = lazy(() => import("./admin/LlamadasPage"));
const UsuariosPage = lazy(() => import("./admin/UsuariosPage"));
const ScorecardPage = lazy(() => import("./admin/ScorecardPage"));
const DisponibilidadPage = lazy(() => import("./admin/DisponibilidadPage"));
const CotizacionesPage = lazy(() => import("./admin/CotizacionesPage"));

export default function Admin() {
  return (
    <AdminRoute>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="resumen" replace />} />
          <Route
            path="resumen"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <ResumenPage />
              </Suspense>
            }
          />
          <Route
            path="leads"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <LeadsPage />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="llamadas"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <LlamadasPage />
              </Suspense>
            }
          />
          <Route
            path="usuarios"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <UsuariosPage />
              </Suspense>
            }
          />
          <Route
            path="scorecard"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <ScorecardPage />
              </Suspense>
            }
          />
          <Route
            path="disponibilidad"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <DisponibilidadPage />
              </Suspense>
            }
          />
          <Route
            path="cotizaciones"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <CotizacionesPage />
              </Suspense>
            }
          />
          <Route
            path="configuracion"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <ConfiguracionPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AdminRoute>
  );
}
