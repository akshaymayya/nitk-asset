import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ScanQr from "../components/ScanQr";
import { api } from "../lib/api";
import PhoneScanHint from "../components/PhoneScanHint";
import { useAssetScanUrl, useScanBase } from "../lib/scanBase.jsx";

export default function StickerPrint() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const printRef = useRef(null);
  const scanUrl = useAssetScanUrl(id);
  const { ready, isPhoneSafe } = useScanBase();

  useEffect(() => {
    api.getAsset(id).then(setAsset);
  }, [id]);

  function handlePrint() {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html>
<html><head><title>Asset sticker</title>
<style>
  @page { size: 50mm 50mm; margin: 3mm; }
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
  .sticker { text-align: center; padding: 4mm; }
  .hint { font-size: 7px; color: #64748b; margin-top: 2mm; letter-spacing: 0.05em; text-transform: uppercase; }
</style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  }

  if (!asset || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-lg font-bold">Sticker preview</h1>
        <p className="mb-6 text-sm text-ink-400">
          QR only — no college numbers on the label. Scan with your phone camera to see full details.
        </p>

        <PhoneScanHint assetId={id} />

        <div ref={printRef} className="inline-block rounded-lg border-2 border-dashed border-slate-300 bg-white p-4">
          <div className="sticker flex flex-col items-center">
            {isPhoneSafe ? (
              <ScanQr value={scanUrl} size={140} />
            ) : (
              <p className="p-4 text-xs text-ink-400">Refresh after API is running</p>
            )}
            <p className="mt-2 text-[10px] font-mono font-semibold tracking-wider text-slate-800">
              {id}
            </p>
          </div>
        </div>

        <button type="button" onClick={handlePrint} className="btn-primary mt-6">
          Print sticker
        </button>
      </div>
    </div>
  );
}
