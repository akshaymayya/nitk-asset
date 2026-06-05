import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PhoneScanHint from "../components/PhoneScanHint";
import ScanQr from "../components/ScanQr";
import { api } from "../lib/api";
import { downloadQrPng } from "../lib/downloadQr";
import { useAssetScanUrl, useScanBase } from "../lib/scanBase.jsx";

export default function Success() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const qrWrapRef = useRef(null);
  const scanUrl = useAssetScanUrl(id);
  const { ready, isPhoneSafe } = useScanBase();

  useEffect(() => {
    api.getAsset(id).then(setAsset).catch(() => setAsset(null));
  }, [id]);

  function downloadQr() {
    if (!isPhoneSafe) return;
    const svg = qrWrapRef.current?.querySelector("svg");
    downloadQrPng(svg, `asset-qr-${id}.png`);
  }

  if (!asset || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-400">Preparing QR code…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/30">
          <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-ink-900">Successfully submitted</h1>
        <p className="mt-2 text-sm text-ink-400">
          Print or download the QR below. College codes appear only after someone scans it.
        </p>

        <PhoneScanHint assetId={id} />

        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Scan QR</p>
          {isPhoneSafe ? (
            <div ref={qrWrapRef} className="flex justify-center">
              <ScanQr value={scanUrl} size={200} />
            </div>
          ) : (
            <p className="py-8 text-sm text-ink-400">Fix the steps above, then refresh to generate a phone-safe QR.</p>
          )}
        </div>

        <button
          type="button"
          onClick={downloadQr}
          className="btn-primary mt-6 w-full max-w-xs"
          disabled={!isPhoneSafe}
        >
          Download QR
        </button>

        {isPhoneSafe && (
          <p className="mt-4 text-xs text-ink-400">
            <a href={scanUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">
              Open scan page on this device
            </a>
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to={`/admin/print/${asset.id}`} className="btn-secondary">
            Print sticker
          </Link>
          <Link to="/admin" className="btn-secondary">
            Back to list
          </Link>
        </div>
      </div>
    </div>
  );
}
