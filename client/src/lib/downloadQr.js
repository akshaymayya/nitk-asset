/** Download QR SVG as PNG (barcode only — no college codes on image) */
export function downloadQrPng(svgElement, filename = "asset-qr.png") {
  if (!svgElement) return;

  const xml = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    const pad = 24;
    const canvas = document.createElement("canvas");
    canvas.width = img.width + pad * 2;
    canvas.height = img.height + pad * 2;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, pad, pad);

    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
