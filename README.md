# AssetTag — College Electronic Asset Registry

Digitize your college’s asset tagging workflow:

1. **Staff** signs in and registers a device (printer, AC, laptop, etc.) with vendor, dates, and **two college code numbers**.
2. The app generates a **1D barcode** (CODE128) that encodes a URL to this asset.
3. **Print** the sticker on a label printer and stick it on the hardware.
4. **Anyone** scans the barcode → browser opens the **public asset page** with full details (codes always visible).

Built from your `college-asset-tracker.jsx` reference, with a real **SQLite** backend so data is shared across devices.

## Quick start

```bash
# From project root
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run API + web UI (two terminals or one command from root)
npm run dev
```

- Web app: http://localhost:5173  
- API: http://localhost:3001  

**Default admin PIN:** `1234` (change via environment variable).

## Customize

Edit `client/src/config.js`:

- `COLLEGE_NAME` — shown on stickers and scan page  
- `APP_TITLE`, categories, etc.

When you have the **official field list** from your college, we can add/rename form fields in `AssetForm.jsx` and the database.

## Production

```bash
cd client && npm run build
cd ../server
set ADMIN_PIN=your-secure-pin
set PUBLIC_BASE_URL=https://assets.yourcollege.edu.in
set PORT=3001
npm start
```

Serve the built client from the same Express server (already configured).

For barcodes printed **before** going live, set `PUBLIC_BASE_URL` to your final HTTPS domain so scanned URLs work on phones.

## Workflow diagram

```
[Admin] Enter details + 2 codes
        ↓
   Save → Barcode (URL → /item/:id)
        ↓
   Print sticker → Stick on device
        ↓
[Anyone] Scan → Public page with codes + warranty + vendor…
```

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS, JsBarcode  
- **Backend:** Express, better-sqlite3  

## Security notes

- Admin routes require PIN header `X-Admin-Pin`.
- Scan pages (`/item/:id`) are public by design.
- Change `ADMIN_PIN` before deploying to your college network or the internet.
