import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ADMIN_PIN = "1234"; // change this to whatever PIN you want
const APP_TITLE = "AssetTag";
const COLLEGE_NAME = "Your College Name"; // change this

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function qrUrl(data, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=10&color=1a1a2e&bgcolor=ffffff`;
}

function itemPageUrl(id) {
  const base = window.location.href.split("?")[0];
  return `${base}?item=${id}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
async function loadItems() {
  try {
    const res = await window.storage.get("items");
    return res ? JSON.parse(res.value) : {};
  } catch { return {}; }
}

async function saveItems(items) {
  try {
    await window.storage.set("items", JSON.stringify(items));
  } catch (e) { console.error(e); }
}

// ─── CATEGORY ICONS ──────────────────────────────────────────────────────────
const CATEGORIES = ["Printer", "Air Conditioner", "Computer", "Laptop", "Projector", "UPS", "Scanner", "Other"];

const categoryEmoji = {
  "Printer": "🖨️", "Air Conditioner": "❄️", "Computer": "🖥️",
  "Laptop": "💻", "Projector": "📽️", "UPS": "🔋", "Scanner": "📠", "Other": "📦"
};

// ─── SCAN VIEW (public) ────────────────────────────────────────────────────────
function ScanView({ item }) {
  if (!item) return (
    <div style={styles.scanWrap}>
      <div style={styles.scanCard}>
        <div style={styles.scanNotFound}>
          <span style={{ fontSize: 64 }}>❓</span>
          <h2 style={{ color: "#e74c3c", margin: "12px 0 4px" }}>Item Not Found</h2>
          <p style={{ color: "#888" }}>This QR code is invalid or the item was removed.</p>
        </div>
      </div>
    </div>
  );

  const fields = [
    { label: "Category", value: `${categoryEmoji[item.category] || "📦"} ${item.category}` },
    { label: "Item Name", value: item.name },
    { label: "Vendor / Supplier", value: item.vendor },
    { label: "Bill Date", value: formatDate(item.billDate) },
    { label: "Warranty Expiry", value: formatDate(item.warrantyExpiry) },
    { label: "Location / Room", value: item.location },
    { label: "College Code 1", value: item.code1, highlight: true },
    { label: "College Code 2", value: item.code2, highlight: true },
    { label: "Remarks", value: item.remarks },
  ].filter(f => f.value && f.value.trim());

  const isWarrantyExpired = item.warrantyExpiry && new Date(item.warrantyExpiry) < new Date();
  const warrantyStatus = !item.warrantyExpiry ? null : isWarrantyExpired ? "expired" : "active";

  return (
    <div style={styles.scanWrap}>
      <div style={styles.scanCard}>
        <div style={styles.scanHeader}>
          <span style={styles.scanEmoji}>{categoryEmoji[item.category] || "📦"}</span>
          <div>
            <div style={styles.scanCollege}>{COLLEGE_NAME}</div>
            <h1 style={styles.scanTitle}>{item.name}</h1>
            <div style={styles.scanSub}>{item.category}</div>
          </div>
        </div>

        {warrantyStatus && (
          <div style={{ ...styles.warrantyBadge, background: isWarrantyExpired ? "#ffeaea" : "#eaffea", color: isWarrantyExpired ? "#c0392b" : "#27ae60", border: `1px solid ${isWarrantyExpired ? "#f5c6c6" : "#a9dfbf"}` }}>
            {isWarrantyExpired ? "⚠️ Warranty Expired" : "✅ Warranty Active"} — {formatDate(item.warrantyExpiry)}
          </div>
        )}

        <div style={styles.scanGrid}>
          {fields.map(f => (
            <div key={f.label} style={{ ...styles.scanField, ...(f.highlight ? styles.scanHighlight : {}) }}>
              <div style={styles.scanLabel}>{f.label}</div>
              <div style={styles.scanValue}>{f.value}</div>
            </div>
          ))}
        </div>

        <div style={styles.scanFooter}>
          <div style={styles.scanId}>Asset ID: {item.id}</div>
          <div style={styles.scanRegistered}>Registered: {formatDate(item.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── STICKER PRINT VIEW ────────────────────────────────────────────────────────
function StickerModal({ item, onClose }) {
  const url = itemPageUrl(item.id);
  const printRef = useRef();

  function handlePrint() {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Sticker - ${item.name}</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; font-family: 'Courier New', monospace; }
        .sticker { border: 2px dashed #333; border-radius: 8px; padding: 14px; width: 260px; text-align: center; }
        .college { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #555; }
        .name { font-size: 13px; font-weight: 800; margin: 4px 0; }
        .codes { display: flex; gap: 8px; justify-content: center; margin: 4px 0; font-size: 10px; }
        .code { background: #111; color: #fff; padding: 2px 8px; border-radius: 3px; font-weight: 700; }
        .qr { margin: 6px auto; display: block; }
        .scan-hint { font-size: 8px; color: #888; margin-top: 4px; }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>🏷️ Asset Sticker Preview</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div ref={printRef}>
          <div className="sticker" style={styles.stickerBox}>
            <div className="college" style={styles.stickerCollege}>{COLLEGE_NAME}</div>
            <div className="name" style={styles.stickerName}>{item.name}</div>
            <div className="codes" style={styles.stickerCodes}>
              <span className="code" style={styles.stickerCode}>{item.code1}</span>
              <span className="code" style={styles.stickerCode}>{item.code2}</span>
            </div>
            <img className="qr" src={qrUrl(url, 160)} alt="QR" style={{ display: "block", margin: "8px auto" }} width={160} height={160} />
            <div className="scan-hint" style={{ fontSize: 9, color: "#888", marginTop: 4 }}>Scan to view full details</div>
          </div>
        </div>

        <button style={styles.printBtn} onClick={handlePrint}>🖨️ Print Sticker</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("loading"); // loading | scan | login | admin | form | detail
  const [items, setItems] = useState({});
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [scanItem, setScanItem] = useState(null);
  const [stickerItem, setStickerItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", category: "Printer", vendor: "", billDate: "",
    warrantyExpiry: "", location: "", code1: "", code2: "", remarks: ""
  });
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [editId, setEditId] = useState(null);

  // Boot: check URL param
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const itemId = params.get("item");
      const data = await loadItems();
      setItems(data);
      if (itemId) {
        setScanItem(data[itemId] || null);
        setView("scan");
      } else {
        setView("login");
      }
    }
    init();
  }, []);

  async function refreshItems() {
    const data = await loadItems();
    setItems(data);
    return data;
  }

  // ── Admin login ──
  function handleLogin() {
    if (pin === ADMIN_PIN) {
      setView("admin");
      setPin("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Try again.");
    }
  }

  // ── Form submit ──
  async function handleFormSubmit() {
    if (!form.name.trim()) return setFormError("Item name is required.");
    if (!form.code1.trim() || !form.code2.trim()) return setFormError("Both college code numbers are required.");
    setFormError("");

    const data = await loadItems();
    const id = editId || genId();
    const entry = {
      ...form,
      id,
      createdAt: data[id]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data[id] = entry;
    await saveItems(data);
    setItems(data);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSelectedItem(entry);
      setView("detail");
    }, 1200);
  }

  function openNewForm() {
    setEditId(null);
    setForm({ name: "", category: "Printer", vendor: "", billDate: "", warrantyExpiry: "", location: "", code1: "", code2: "", remarks: "" });
    setFormError("");
    setView("form");
  }

  function openEditForm(item) {
    setEditId(item.id);
    setForm({ ...item });
    setFormError("");
    setView("form");
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this asset?")) return;
    const data = await loadItems();
    delete data[id];
    await saveItems(data);
    setItems(data);
    setView("admin");
  }

  const filteredItems = Object.values(items).filter(it =>
    !search || [it.name, it.category, it.code1, it.code2, it.vendor, it.location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  if (view === "loading") return (
    <div style={styles.loadWrap}><div style={styles.spinner} /><p style={{ color: "#888", marginTop: 16 }}>Loading…</p></div>
  );

  if (view === "scan") return <ScanView item={scanItem} />;

  // ── LOGIN ──
  if (view === "login") return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>{APP_TITLE}</div>
        <div style={styles.loginSub}>{COLLEGE_NAME}</div>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 24 }}>Asset Management System</p>
        <input
          style={styles.pinInput}
          type="password"
          placeholder="Enter Admin PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          maxLength={8}
        />
        {pinError && <div style={styles.error}>{pinError}</div>}
        <button style={styles.loginBtn} onClick={handleLogin}>Sign In →</button>
      </div>
    </div>
  );

  // ── ADMIN DASHBOARD ──
  if (view === "admin") return (
    <div style={styles.appWrap}>
      <header style={styles.appHeader}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo}>{APP_TITLE}</span>
          <span style={styles.headerCollege}>{COLLEGE_NAME}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerCount}>{Object.keys(items).length} assets</span>
          <button style={styles.addBtn} onClick={openNewForm}>+ Add Asset</button>
        </div>
      </header>

      <div style={styles.searchWrap}>
        <input style={styles.searchInput} placeholder="🔍  Search by name, code, category…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filteredItems.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 48 }}>📦</span>
          <p style={{ color: "#888", marginTop: 12 }}>{search ? "No results found." : "No assets added yet. Click + Add Asset to begin."}</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredItems.sort((a, b) => b.createdAt?.localeCompare(a.createdAt)).map(item => (
            <div key={item.id} style={styles.card} onClick={() => { setSelectedItem(item); setView("detail"); }}>
              <div style={styles.cardEmoji}>{categoryEmoji[item.category] || "📦"}</div>
              <div style={styles.cardBody}>
                <div style={styles.cardName}>{item.name}</div>
                <div style={styles.cardCategory}>{item.category}</div>
                <div style={styles.cardCodes}>
                  <span style={styles.codePill}>{item.code1}</span>
                  <span style={styles.codePill}>{item.code2}</span>
                </div>
                {item.location && <div style={styles.cardLoc}>📍 {item.location}</div>}
              </div>
              <div style={styles.cardArrow}>›</div>
            </div>
          ))}
        </div>
      )}

      {stickerItem && <StickerModal item={stickerItem} onClose={() => setStickerItem(null)} />}
    </div>
  );

  // ── FORM ──
  if (view === "form") return (
    <div style={styles.appWrap}>
      <header style={styles.appHeader}>
        <button style={styles.backBtn} onClick={() => setView("admin")}>← Back</button>
        <span style={styles.headerLogo}>{editId ? "Edit Asset" : "New Asset"}</span>
        <span />
      </header>

      <div style={styles.formWrap}>
        <div style={styles.formCard}>

          <div style={styles.formSection}>ITEM DETAILS</div>

          <div style={styles.formRow}>
            <label style={styles.label}>Category</label>
            <select style={styles.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Item Name *</label>
            <input style={styles.input} placeholder="e.g. HP LaserJet Pro M404n" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Vendor / Supplier</label>
            <input style={styles.input} placeholder="e.g. Raju Computers, Mangalore" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
          </div>

          <div style={styles.formRow2}>
            <div>
              <label style={styles.label}>Bill Date</label>
              <input style={styles.input} type="date" value={form.billDate} onChange={e => setForm({ ...form, billDate: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Warranty Expiry</label>
              <input style={styles.input} type="date" value={form.warrantyExpiry} onChange={e => setForm({ ...form, warrantyExpiry: e.target.value })} />
            </div>
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Location / Room No.</label>
            <input style={styles.input} placeholder="e.g. Room 204, Admin Block" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>

          <div style={{ ...styles.formSection, marginTop: 24 }}>COLLEGE CODES *</div>

          <div style={styles.formRow2}>
            <div>
              <label style={styles.label}>College Code 1</label>
              <input style={{ ...styles.input, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }} placeholder="e.g. ICT-2024-001" value={form.code1} onChange={e => setForm({ ...form, code1: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>College Code 2</label>
              <input style={{ ...styles.input, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }} placeholder="e.g. PR-MNG-0042" value={form.code2} onChange={e => setForm({ ...form, code2: e.target.value })} />
            </div>
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Remarks</label>
            <textarea style={{ ...styles.input, minHeight: 72, resize: "vertical" }} placeholder="Any notes, serial numbers, model info…" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>

          {formError && <div style={styles.error}>{formError}</div>}

          <button style={{ ...styles.submitBtn, ...(saved ? styles.submitBtnSaved : {}) }} onClick={handleFormSubmit}>
            {saved ? "✅ Saved!" : editId ? "Update Asset" : "Save & Generate QR"}
          </button>
        </div>
      </div>

      {stickerItem && <StickerModal item={stickerItem} onClose={() => setStickerItem(null)} />}
    </div>
  );

  // ── DETAIL VIEW ──
  if (view === "detail" && selectedItem) {
    const item = items[selectedItem.id] || selectedItem;
    const url = itemPageUrl(item.id);
    const isWarrantyExpired = item.warrantyExpiry && new Date(item.warrantyExpiry) < new Date();

    return (
      <div style={styles.appWrap}>
        <header style={styles.appHeader}>
          <button style={styles.backBtn} onClick={() => setView("admin")}>← Back</button>
          <span style={styles.headerLogo}>Asset Detail</span>
          <button style={styles.editBtn} onClick={() => openEditForm(item)}>Edit</button>
        </header>

        <div style={styles.formWrap}>
          <div style={styles.formCard}>

            <div style={styles.detailTop}>
              <span style={{ fontSize: 56 }}>{categoryEmoji[item.category] || "📦"}</span>
              <div>
                <div style={styles.detailName}>{item.name}</div>
                <div style={styles.detailCat}>{item.category}</div>
                {item.warrantyExpiry && (
                  <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: isWarrantyExpired ? "#ffeaea" : "#eaffea", color: isWarrantyExpired ? "#c0392b" : "#27ae60", display: "inline-block", marginTop: 6 }}>
                    {isWarrantyExpired ? "⚠️ Warranty Expired" : "✅ Warranty Active"}
                  </span>
                )}
              </div>
            </div>

            <div style={styles.codeRow}>
              <div style={styles.codeBlock}><div style={styles.codeLabel}>College Code 1</div><div style={styles.codeVal}>{item.code1}</div></div>
              <div style={styles.codeBlock}><div style={styles.codeLabel}>College Code 2</div><div style={styles.codeVal}>{item.code2}</div></div>
            </div>

            {[
              ["Vendor", item.vendor], ["Bill Date", formatDate(item.billDate)],
              ["Warranty Expiry", formatDate(item.warrantyExpiry)], ["Location", item.location],
              ["Remarks", item.remarks],
            ].filter(([, v]) => v && v !== "—").map(([label, val]) => (
              <div key={label} style={styles.detailRow}>
                <span style={styles.detailLabel}>{label}</span>
                <span style={styles.detailVal}>{val}</span>
              </div>
            ))}

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Asset ID</span>
              <span style={{ ...styles.detailVal, fontFamily: "monospace", fontSize: 13 }}>{item.id}</span>
            </div>

            <div style={styles.qrSection}>
              <div style={styles.formSection}>QR CODE</div>
              <img src={qrUrl(url, 180)} alt="QR Code" style={{ display: "block", margin: "12px auto", borderRadius: 8, border: "1px solid #eee" }} width={180} height={180} />
              <p style={{ textAlign: "center", color: "#888", fontSize: 12, marginBottom: 16 }}>Scan this QR to view asset details on any device</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button style={styles.qrBtn} onClick={() => setStickerItem(item)}>🏷️ Print Sticker</button>
                <button style={{ ...styles.qrBtn, background: "#e74c3c", color: "#fff" }} onClick={() => deleteItem(item.id)}>🗑️ Delete</button>
              </div>
            </div>

          </div>
        </div>

        {stickerItem && <StickerModal item={stickerItem} onClose={() => setStickerItem(null)} />}
      </div>
    );
  }

  return null;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  loadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7f8fa" },
  spinner: { width: 32, height: 32, border: "3px solid #e0e0e0", borderTop: "3px solid #1a1a2e", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Scan (public)
  scanWrap: { minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #f7f8fa 100%)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px", fontFamily: "'Georgia', serif" },
  scanCard: { background: "#fff", borderRadius: 16, boxShadow: "0 4px 32px rgba(0,0,0,0.10)", width: "100%", maxWidth: 480, overflow: "hidden" },
  scanHeader: { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", padding: "28px 24px", display: "flex", gap: 16, alignItems: "center" },
  scanEmoji: { fontSize: 48, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" },
  scanCollege: { color: "#a0a8c8", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, fontFamily: "monospace" },
  scanTitle: { color: "#fff", fontSize: 22, fontWeight: 700, margin: "4px 0 2px", fontFamily: "Georgia, serif" },
  scanSub: { color: "#7986cb", fontSize: 13 },
  warrantyBadge: { margin: "16px 20px 0", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "center" },
  scanGrid: { padding: "20px 24px", display: "flex", flexDirection: "column", gap: 1 },
  scanField: { padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  scanHighlight: { background: "linear-gradient(90deg, #f0f4ff, transparent)", padding: "10px 12px", borderRadius: 6, marginBottom: 2, borderBottom: "none" },
  scanLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#aaa", fontFamily: "monospace", marginBottom: 3 },
  scanValue: { fontSize: 15, color: "#1a1a2e", fontWeight: 500 },
  scanFooter: { background: "#f7f8fa", padding: "14px 24px", display: "flex", justifyContent: "space-between" },
  scanId: { fontFamily: "monospace", fontSize: 11, color: "#aaa" },
  scanRegistered: { fontSize: 11, color: "#aaa" },
  scanNotFound: { padding: 48, textAlign: "center" },

  // Login
  loginWrap: { minHeight: "100vh", background: "#0f0f1a", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Georgia, serif" },
  loginCard: { background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 16, padding: "48px 40px", width: "100%", maxWidth: 360, textAlign: "center" },
  loginLogo: { fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -1, fontFamily: "Georgia, serif" },
  loginSub: { color: "#7986cb", fontSize: 13, marginTop: 6, marginBottom: 4 },
  pinInput: { width: "100%", padding: "14px 18px", borderRadius: 10, border: "1.5px solid #2a2a4e", background: "#0f0f1a", color: "#fff", fontSize: 18, textAlign: "center", letterSpacing: 8, outline: "none", boxSizing: "border-box", marginBottom: 8 },
  loginBtn: { width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8 },
  error: { color: "#e74c3c", fontSize: 13, marginBottom: 8, marginTop: 4 },

  // App shell
  appWrap: { minHeight: "100vh", background: "#f7f8fa", fontFamily: "'Georgia', serif" },
  appHeader: { background: "#1a1a2e", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerLogo: { color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: -0.5 },
  headerCollege: { color: "#7986cb", fontSize: 12, display: "none" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  headerCount: { color: "#7986cb", fontSize: 13 },
  addBtn: { background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  backBtn: { color: "#a0a8c8", background: "transparent", border: "none", cursor: "pointer", fontSize: 14, padding: "6px 0" },
  editBtn: { color: "#7986cb", background: "transparent", border: "1px solid #3a3a5e", borderRadius: 8, cursor: "pointer", fontSize: 13, padding: "6px 14px" },

  // Search
  searchWrap: { padding: "20px 24px 8px" },
  searchInput: { width: "100%", padding: "12px 18px", borderRadius: 10, border: "1.5px solid #e0e0e0", background: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" },

  // Grid
  grid: { padding: "8px 24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #ebebeb", padding: "18px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", transition: "box-shadow 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardEmoji: { fontSize: 32, flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontWeight: 700, fontSize: 15, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardCategory: { fontSize: 12, color: "#888", marginBottom: 6 },
  cardCodes: { display: "flex", gap: 6, flexWrap: "wrap" },
  codePill: { background: "#1a1a2e", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontFamily: "monospace", fontWeight: 700 },
  cardLoc: { fontSize: 11, color: "#aaa", marginTop: 4 },
  cardArrow: { color: "#ccc", fontSize: 20, flexShrink: 0 },
  emptyState: { textAlign: "center", padding: "80px 24px", color: "#888" },

  // Form
  formWrap: { padding: "24px", maxWidth: 600, margin: "0 auto" },
  formCard: { background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  formSection: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", fontFamily: "monospace", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #f0f0f0" },
  formRow: { marginBottom: 18 },
  formRow2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 },
  label: { display: "block", fontSize: 12, color: "#666", marginBottom: 6, fontFamily: "monospace" },
  input: { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa", color: "#1a1a2e", fontFamily: "Georgia, serif" },
  select: { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa", color: "#1a1a2e" },
  submitBtn: { width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8, transition: "opacity 0.2s" },
  submitBtnSaved: { background: "linear-gradient(135deg, #27ae60, #2ecc71)", opacity: 1 },

  // Detail
  detailTop: { display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 },
  detailName: { fontSize: 22, fontWeight: 800, color: "#1a1a2e" },
  detailCat: { fontSize: 13, color: "#888", marginTop: 2 },
  codeRow: { display: "flex", gap: 12, marginBottom: 20 },
  codeBlock: { flex: 1, background: "#1a1a2e", borderRadius: 10, padding: "12px 16px" },
  codeLabel: { fontSize: 9, letterSpacing: 2, color: "#7986cb", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 4 },
  codeVal: { color: "#fff", fontFamily: "monospace", fontWeight: 800, fontSize: 16, letterSpacing: 1 },
  detailRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f4f4f4", fontSize: 14 },
  detailLabel: { color: "#999", fontFamily: "monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  detailVal: { color: "#1a1a2e", fontWeight: 600, textAlign: "right", maxWidth: "60%" },
  qrSection: { marginTop: 24, padding: "20px 0 0" },
  qrBtn: { background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14 },

  // Sticker modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 340 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" },
  stickerBox: { border: "2px dashed #aaa", borderRadius: 10, padding: 16, textAlign: "center", background: "#fff" },
  stickerCollege: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#555", marginBottom: 4, fontFamily: "monospace" },
  stickerName: { fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginBottom: 8, fontFamily: "Georgia, serif" },
  stickerCodes: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 4 },
  stickerCode: { background: "#1a1a2e", color: "#fff", padding: "3px 10px", borderRadius: 4, fontFamily: "monospace", fontWeight: 700, fontSize: 12 },
  printBtn: { width: "100%", marginTop: 16, padding: "12px", borderRadius: 10, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" },
};

// Inject CSS for spinner
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; }
  body { margin: 0; }
  input:focus, select:focus, textarea:focus { border-color: #667eea !important; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
`;
document.head.appendChild(styleEl);
