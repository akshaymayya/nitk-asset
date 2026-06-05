import { createContext, useContext, useEffect, useState } from "react";

const ScanBaseContext = createContext({
  scanBase: "",
  ready: false,
  error: "",
  isPhoneSafe: false,
});

function isLocalhostHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isLocalhostUrl(url) {
  try {
    return isLocalhostHost(new URL(url).hostname);
  } catch {
    return true;
  }
}

async function fetchScanBaseFromApi() {
  const endpoints = [
    "/api/scan-base",
    "http://127.0.0.1:3001/api/scan-base",
    "http://localhost:3001/api/scan-base",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.scanBase) return data.scanBase.replace(/\/$/, "");
    } catch {
      /* try next */
    }
  }
  return null;
}

export function ScanBaseProvider({ children }) {
  const [scanBase, setScanBase] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const envBase = import.meta.env.VITE_SCAN_BASE_URL?.replace(/\/$/, "");
      if (envBase) {
        if (!cancelled) {
          setScanBase(envBase);
          setError(isLocalhostUrl(envBase) ? "VITE_SCAN_BASE_URL must be your PC Wi‑Fi IP, not localhost." : "");
          setReady(true);
        }
        return;
      }

      const fromApi = await fetchScanBaseFromApi();

      if (cancelled) return;

      if (fromApi && !isLocalhostUrl(fromApi)) {
        setScanBase(fromApi);
        setError("");
        setReady(true);
        return;
      }

      if (fromApi && isLocalhostUrl(fromApi)) {
        setScanBase("");
        setError(
          "Could not detect your Wi‑Fi IP. Start the API server, connect PC to Wi‑Fi, then refresh. Or set VITE_SCAN_BASE_URL in client/.env (see .env.example)."
        );
        setReady(true);
        return;
      }

      const origin = window.location.origin.replace(/\/$/, "");
      if (!isLocalhostUrl(origin)) {
        setScanBase(origin);
        setError("");
        setReady(true);
        return;
      }

      setScanBase("");
      setError(
        "Phone scanning needs your PC’s Wi‑Fi address, not localhost. Start the server (npm run dev in /server), keep the client running, then refresh this page."
      );
      setReady(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isPhoneSafe = Boolean(scanBase) && !isLocalhostUrl(scanBase);

  return (
    <ScanBaseContext.Provider value={{ scanBase, ready, error, isPhoneSafe }}>
      {children}
    </ScanBaseContext.Provider>
  );
}

export function useScanBase() {
  return useContext(ScanBaseContext);
}

export function useAssetScanUrl(id) {
  const { scanBase, ready, isPhoneSafe } = useScanBase();
  if (!id || !ready || !isPhoneSafe) return "";
  return `${scanBase}/item/${id}`;
}
