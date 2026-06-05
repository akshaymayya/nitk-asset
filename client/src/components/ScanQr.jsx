import QRCode from "react-qr-code";

/** QR encodes asset URL — scan with phone camera to open details page */
export default function ScanQr({ value, size = 180, className = "" }) {
  if (!value) return null;

  return (
    <div className={`inline-block rounded-lg bg-white p-3 ${className}`}>
      <QRCode
        value={value}
        size={size}
        level="M"
        bgColor="#FFFFFF"
        fgColor="#0f172a"
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
}
