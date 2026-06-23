import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AsesorRoute } from "@/components/auth/AsesorRoute";
import AsesorLayout from "@/components/asesor/AsesorLayout";

const CockpitPage   = lazy(() => import("./asesor/CockpitPage"));
const MisLeadsPage  = lazy(() => import("./asesor/MisLeadsPage"));
const HistorialPage = lazy(() => import("./asesor/HistorialPage"));

export default function Asesor() {
  return (
    <AsesorRoute>
      <Routes>
        <Route element={<AsesorLayout />}>
          <Route index element={<Navigate to="cockpit" replace />} />
          <Route
            path="cockpit"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <CockpitPage />
              </Suspense>
            }
          />
          <Route
            path="mis-leads"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <MisLeadsPage />
              </Suspense>
            }
          />
          <Route
            path="historial"
            element={
              <Suspense fallback={<div className="h-48" />}>
                <HistorialPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AsesorRoute>
  );
}
