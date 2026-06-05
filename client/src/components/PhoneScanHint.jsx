import { useScanBase, useAssetScanUrl } from "../lib/scanBase.jsx";

export default function PhoneScanHint({ assetId }) {
  const { scanBase, error, isPhoneSafe, ready } = useScanBase();
  const scanUrl = useAssetScanUrl(assetId);

  if (!ready) return null;

  if (!isPhoneSafe) {
    return (
      <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-left text-sm text-red-800 ring-1 ring-red-200">
        <p className="font-semibold">Phone cannot use localhost</p>
        <p className="mt-1 text-xs">{error}</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs">
          <li>Run API: <code className="rounded bg-red-100 px-1">cd server → npm run dev</code></li>
          <li>Run app: <code className="rounded bg-red-100 px-1">cd client → npm run dev</code></li>
          <li>PC + phone on same Wi‑Fi, then refresh this page</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-left text-xs text-emerald-900 ring-1 ring-emerald-200">
      <p className="font-semibold">Scan with your phone (same Wi‑Fi)</p>
      <p className="mt-1 break-all font-mono">{scanUrl}</p>
      <p className="mt-2 text-emerald-800">
        Base: {scanBase} — if scan fails, allow port 5173 in Windows Firewall.
      </p>
    </div>
  );
}
