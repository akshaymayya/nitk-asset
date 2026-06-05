import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_TITLE, COLLEGE_NAME } from "../config";
import { api, setStoredPin } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await api.verifyPin(pin);
      if (!ok) {
        setError("Incorrect PIN. Try again.");
        return;
      }
      setStoredPin(pin);
      navigate("/admin");
    } catch {
      setError("Could not reach server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-lg shadow-brand-600/30">
            🏷️
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{APP_TITLE}</h1>
          <p className="mt-1 text-sm text-slate-400">{COLLEGE_NAME}</p>
          <p className="mt-3 text-sm text-slate-500">Electronic asset registry & barcode labels</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
        >
          <label className="label-text text-slate-400">Admin PIN</label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            className="input-field mt-1 text-center font-mono text-lg tracking-[0.3em]"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={12}
          />
          {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary mt-4 w-full" disabled={loading || !pin}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Scan a sticker barcode to view asset details — no login required.
        </p>
      </div>
    </div>
  );
}
