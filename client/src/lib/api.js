const PIN_KEY = "asset_admin_pin";

export function getStoredPin() {
  return sessionStorage.getItem(PIN_KEY) || "";
}

export function setStoredPin(pin) {
  sessionStorage.setItem(PIN_KEY, pin);
}

export function clearStoredPin() {
  sessionStorage.removeItem(PIN_KEY);
}

async function request(path, options = {}) {
  const pin = getStoredPin();
  const headers = {
    "Content-Type": "application/json",
    ...(pin ? { "X-Admin-Pin": pin } : {}),
    ...options.headers,
  };

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  verifyPin: (pin) =>
    fetch("/api/assets", { headers: { "X-Admin-Pin": pin } }).then((r) => r.ok),

  listAssets: () => request("/api/assets"),
  getAsset: (id) => request(`/api/assets/${id}`),
  createAsset: (body) => request("/api/assets", { method: "POST", body: JSON.stringify(body) }),
  updateAsset: (id, body) =>
    request(`/api/assets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAsset: (id) => request(`/api/assets/${id}`, { method: "DELETE" }),
};
