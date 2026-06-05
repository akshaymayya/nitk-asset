export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isWarrantyExpired(warrantyExpiry) {
  if (!warrantyExpiry) return null;
  return new Date(warrantyExpiry) < new Date();
}

export const emptyForm = {
  name: "",
  category: "Printer",
  vendor: "",
  billDate: "",
  warrantyExpiry: "",
  location: "",
  code1: "",
  code2: "",
  remarks: "",
};
