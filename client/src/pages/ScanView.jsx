import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { COLLEGE_NAME, categoryIcon } from "../config";
import { api } from "../lib/api";
import { formatDate, isWarrantyExpired } from "../lib/utils";

export default function ScanView() {
  const { id } = useParams();
  const [asset, setAsset] = useState(undefined);

  useEffect(() => {
    api
      .getAsset(id)
      .then(setAsset)
      .catch(() => setAsset(null));
  }, [id]);

  if (asset === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-ink-400">Loading asset…</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
          <span className="text-5xl">❓</span>
          <h1 className="mt-4 text-xl font-bold text-red-600">Item not found</h1>
          <p className="mt-2 text-sm text-ink-400">This barcode is invalid or the asset was removed.</p>
        </div>
      </div>
    );
  }

  const warranty = isWarrantyExpired(asset.warrantyExpiry);
  const fields = [
    { label: "Category", value: `${categoryIcon[asset.category] || "📦"} ${asset.category}` },
    { label: "Item name", value: asset.name },
    { label: "Vendor", value: asset.vendor },
    { label: "Bill date", value: formatDate(asset.billDate) },
    { label: "Warranty expiry", value: formatDate(asset.warrantyExpiry) },
    { label: "Location", value: asset.location },
    { label: "Remarks", value: asset.remarks },
  ].filter((f) => f.value && f.value !== "—");

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="bg-gradient-to-br from-ink-900 to-slate-800 px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
            {COLLEGE_NAME}
          </p>
          <div className="mt-4 flex items-start gap-4">
            <span className="text-5xl">{categoryIcon[asset.category] || "📦"}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
              <p className="mt-1 text-sm text-slate-300">{asset.category}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-brand-50 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">College codes</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-ink-900 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Code 1</p>
              <p className="font-mono text-sm font-bold text-white">{asset.code1}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-ink-400">Code 2</p>
              <p className="font-mono text-sm font-bold text-ink-900">{asset.code2}</p>
            </div>
          </div>
        </div>

        {warranty !== null && (
          <div
            className={`mx-6 mt-4 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
              warranty
                ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
            }`}
          >
            {warranty ? "Warranty expired" : "Warranty active"} — {formatDate(asset.warrantyExpiry)}
          </div>
        )}

        <dl className="divide-y divide-slate-50 px-6 py-2">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between gap-4 py-3.5 text-sm">
              <dt className="text-ink-400">{f.label}</dt>
              <dd className="max-w-[58%] text-right font-medium text-ink-900">{f.value}</dd>
            </div>
          ))}
        </dl>

        <footer className="flex justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 text-[11px] text-ink-400">
          <span className="font-mono">ID: {asset.id}</span>
          <span>Registered {formatDate(asset.createdAt)}</span>
        </footer>
      </div>
    </div>
  );
}
