import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function Barcode({ value, className = "", height = 72 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 2,
        height,
        displayValue: false,
        margin: 8,
        background: "#ffffff",
        lineColor: "#0f172a",
      });
    } catch {
      /* invalid barcode data */
    }
  }, [value, height]);

  return (
    <svg
      ref={svgRef}
      className={className}
      role="img"
      aria-label={`Barcode for ${value}`}
    />
  );
}
