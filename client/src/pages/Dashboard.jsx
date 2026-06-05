import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell, Card } from "../components/Layout";
import { categoryIcon } from "../config";
import { api, clearStoredPin } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listAssets();
      setItems(data);
    } catch (e) {
      if (e.status === 401) {
        clearStoredPin();
        navigate("/");
        return;
      }
      setError("Failed to load assets.");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    clearStoredPin();
    navigate("/");
  }

  const filtered = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [it.name, it.category, it.code1, it.code2, it.vendor, it.location, it.labelCode]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  });

  return (
    <AppShell
      title="Assets"
      actions={
        <>
          <button type="button" onClick={signOut} className="text-xs font-medium text-ink-400 hover:text-ink-600">
            Sign out
          </button>
          <Link to="/admin/new" className="btn-primary !py-2 !text-xs">
            + Add asset
          </Link>
        </>
      }
    >
      <div className="mb-4">
        <input
          className="input-field"
          placeholder="Search name, codes, vendor, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-center text-sm text-ink-400">Loading…</p>}
      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {!loading && filtered.length === 0 && (
        <Card className="text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-3 text-sm text-ink-400">
            {search ? "No results." : "No assets yet. Add your first electronic item."}
          </p>
          {!search && (
            <Link to="/admin/new" className="btn-primary mt-4 inline-flex">
              Register asset
            </Link>
          )}
        </Card>
      )}

      <ul className="space-y-3">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link
              to={`/admin/asset/${item.id}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-md"
            >
              <span className="text-3xl">{categoryIcon[item.category] || "📦"}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-ink-900">{item.name}</div>
                <div className="text-xs text-ink-400">{item.category}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-ink-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                    {item.code1}
                  </span>
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-800">
                    {item.code2}
                  </span>
                </div>
              </div>
              <span className="text-xl text-slate-300">›</span>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && items.length > 0 && (
        <p className="mt-6 text-center text-xs text-ink-400">{items.length} registered assets</p>
      )}
    </AppShell>
  );
}
