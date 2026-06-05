import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ScanQr from "../components/ScanQr";
import { AppShell, Card } from "../components/Layout";
import { categoryIcon } from "../config";
import { api } from "../lib/api";
import { downloadQrPng } from "../lib/downloadQr";
import PhoneScanHint from "../components/PhoneScanHint";
import { useAssetScanUrl, useScanBase } from "../lib/scanBase.jsx";
import { formatDate, isWarrantyExpired } from "../lib/utils";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const qrWrapRef = useRef(null);
  const scanUrl = useAssetScanUrl(id);
  const { ready, isPhoneSafe } = useScanBase();

  useEffect(() => {
    api.getAsset(id).then(setAsset).catch(() => navigate("/admin"));
  }, [id, navigate]);

  async function handleDelete() {
    if (!window.confirm("Delete this asset permanently?")) return;
    try {
      await api.deleteAsset(id);
      navigate("/admin");
    } catch (e) {
      alert(e.message);
    }
  }

  function downloadQr() {
    if (!isPhoneSafe) return;
    const svg = qrWrapRef.current?.querySelector("svg");
    downloadQrPng(svg, `asset-qr-${id}.png`);
  }

  if (!asset) {
    return (
      <AppShell title="Asset" backTo="/admin">
        <p className="text-center text-sm text-ink-400">Loading…</p>
      </AppShell>
    );
  }

  const warranty = isWarrantyExpired(asset.warrantyExpiry);

  return (
    <AppShell
      title="Asset detail"
      backTo="/admin"
      actions={
        <Link to={`/admin/edit/${id}`} className="btn-secondary !py-2 !text-xs">
          Edit
        </Link>
      }
    >
      <Card>
        <div className="flex items-start gap-4">
          <span className="text-5xl">{categoryIcon[asset.category] || "📦"}</span>
          <div>
            <h2 className="text-xl font-bold">{asset.name}</h2>
            <p className="text-sm text-ink-400">{asset.category}</p>
            {warranty !== null && (
              <span
                className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                  warranty ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {warranty ? "Warranty expired" : "Warranty active"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-ink-900 p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Code 1</p>
            <p className="font-mono font-bold text-white">{asset.code1}</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">Code 2</p>
            <p className="font-mono font-bold">{asset.code2}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm">
          {[
            ["Vendor", asset.vendor],
            ["Bill date", formatDate(asset.billDate)],
            ["Warranty", formatDate(asset.warrantyExpiry)],
            ["Location", asset.location],
            ["Remarks", asset.remarks],
          ]
            .filter(([, v]) => v && v !== "—")
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-ink-400">{k}</dt>
                <dd className="font-medium text-right">{v}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="section-title !border-0 !pb-0 text-center">QR code (for sticker)</p>
          <p className="mb-4 text-xs text-ink-400">College codes are not printed on the sticker — only visible after scan.</p>
          <PhoneScanHint assetId={id} />
          {ready && isPhoneSafe && scanUrl ? (
            <div ref={qrWrapRef} className="flex justify-center">
              <ScanQr value={scanUrl} size={180} />
            </div>
          ) : (
            <p className="text-sm text-ink-400">Loading QR…</p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={downloadQr} className="btn-primary !py-2" disabled={!isPhoneSafe}>
              Download QR
            </button>
            <Link to={`/admin/print/${id}`} className="btn-secondary !py-2">
              Print sticker
            </Link>
            <Link to={`/item/${id}`} target="_blank" className="btn-secondary !py-2">
              Preview scan page
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
