import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";

const LeadsPage = lazy(() => import("./admin/LeadsPage"));
const AnalyticsPage = lazy(() => import("./admin/AnalyticsPage"));
const ConfiguracionPage = lazy(() => import("./admin/ConfiguracionPage"));

export default function Admin() {
  return (
    <AdminRoute>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="leads" replace />} />
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
