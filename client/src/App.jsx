import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ScanBaseProvider } from "./lib/scanBase.jsx";
import { getStoredPin } from "./lib/api";
import AssetDetail from "./pages/AssetDetail";
import AssetForm from "./pages/AssetForm";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ScanView from "./pages/ScanView";
import StickerPrint from "./pages/StickerPrint";
import Success from "./pages/Success";

function RequireAuth({ children }) {
  if (!getStoredPin()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ScanBaseProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/item/:id" element={<ScanView />} />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/new"
          element={
            <RequireAuth>
              <AssetForm />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <RequireAuth>
              <AssetForm />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/asset/:id"
          element={
            <RequireAuth>
              <AssetDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/success/:id"
          element={
            <RequireAuth>
              <Success />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/print/:id"
          element={
            <RequireAuth>
              <StickerPrint />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ScanBaseProvider>
  );
}
