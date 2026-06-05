import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell, Card } from "../components/Layout";
import { CATEGORIES } from "../config";
import { api } from "../lib/api";
import { emptyForm } from "../lib/utils";

export default function AssetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    api
      .getAsset(id)
      .then(setForm)
      .catch(() => navigate("/admin"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name?.trim()) return setError("Item name is required.");
    if (!form.code1?.trim() || !form.code2?.trim()) {
      return setError("Both college code numbers are required.");
    }

    try {
      const payload = {
        name: form.name,
        category: form.category,
        vendor: form.vendor,
        billDate: form.billDate,
        warrantyExpiry: form.warrantyExpiry,
        location: form.location,
        code1: form.code1,
        code2: form.code2,
        remarks: form.remarks,
      };

      const asset = isEdit
        ? await api.updateAsset(id, payload)
        : await api.createAsset(payload);

      navigate(`/admin/success/${asset.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "Could not save.");
    }
  }

  if (loading) {
    return (
      <AppShell title={isEdit ? "Edit asset" : "New asset"} backTo="/admin">
        <p className="text-center text-sm text-ink-400">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={isEdit ? "Edit asset" : "New asset"} backTo={isEdit ? `/admin/asset/${id}` : "/admin"}>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="section-title">Item details</div>

          <div>
            <label className="label-text">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Item name *</label>
            <input
              className="input-field"
              placeholder="e.g. HP LaserJet Pro M404n"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <label className="label-text">Vendor / supplier</label>
            <input
              className="input-field"
              placeholder="e.g. Raju Computers"
              value={form.vendor}
              onChange={(e) => update("vendor", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Bill date</label>
              <input
                type="date"
                className="input-field"
                value={form.billDate}
                onChange={(e) => update("billDate", e.target.value)}
              />
            </div>
            <div>
              <label className="label-text">Warranty expiry</label>
              <input
                type="date"
                className="input-field"
                value={form.warrantyExpiry}
                onChange={(e) => update("warrantyExpiry", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Location / room</label>
            <input
              className="input-field"
              placeholder="e.g. Room 204, Admin Block"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>

          <div className="section-title !mt-8">College codes *</div>
          <p className="-mt-2 mb-3 text-xs text-ink-400">
            Enter the two unique numbers assigned by your college. These appear on the sticker and
            scan page.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">College code 1</label>
              <input
                className="input-field font-mono font-semibold tracking-wide"
                placeholder="e.g. NITK/2024/102"
                value={form.code1}
                onChange={(e) => update("code1", e.target.value)}
              />
            </div>
            <div>
              <label className="label-text">College code 2</label>
              <input
                className="input-field font-mono font-semibold tracking-wide"
                placeholder="e.g. ICT-PR-0042"
                value={form.code2}
                onChange={(e) => update("code2", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Remarks</label>
            <textarea
              className="input-field min-h-[88px] resize-y"
              placeholder="Serial number, model, notes…"
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary w-full">
            {isEdit ? "Update asset" : "Save & generate barcode"}
          </button>
        </form>
      </Card>
    </AppShell>
  );
}
