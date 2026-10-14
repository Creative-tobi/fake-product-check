# 🛡️ SafeScan AI — Product Authenticity, Expiry & Tamper Detection Platform

An end-to-end consumer safety application designed to detect expired products, discover counterfeit goods, verify GS1 barcode checksums, audit packaging labels for tampering, and uncover hazardous ingredients and allergens using live camera scanning and global registries.

---

## 🌟 Key Features

### 1. 📷 Camera & Barcode Scanner
- **Live Camera Barcode Scanner**: Built with `html5-qrcode` supporting webcams, smartphones, front/rear camera toggling, and real-time laser scanning reticle animations.
- **Audio Feedback**: Built-in supermarket-style scan chime and counterfeit alert buzzer using the native Web Audio API (zero external audio file dependencies).
- **Photo Upload & Manual Entry**: Drag-and-drop packaging photo or type numeric/alphanumeric barcodes.
- **1-Click Test Presets**: Instant test samples (Authentic Nutella, Authentic Coca-Cola, Counterfeit infant formula, Expired yogurt, Forged date labels) for quick testing without a webcam.

### 2. 🔍 Counterfeit & Fake Product Detection
- **GS1 Modulo-10 Checksum Algorithm**: Validates mathematical check digits for EAN-13, UPC-A, and EAN-8 barcodes. Flags fabricated barcodes often created by counterfeiters.
- **Country Prefix Decoder**: Decodes GS1 country codes (e.g. France, USA/Canada, Germany, Nigeria, Japan, China, India) to cross-verify against declared manufacturer origins.
- **Global Consumer Databases**: Queries **Open Food Facts API v2** with automatic fallback to **Open Beauty Facts API v2** for cosmetics and toiletries.
- **Authenticity Scoring Gauge (0-100%)**: Multi-factor audit calculating barcode integrity, global catalog registration, known blacklist records, and label consistency.

### 3. ⏳ Expiration Date & Shelf-Life Tracker
- **Dynamic Shelf-Life Calculations**: Computes days remaining until expiration, elapsed freshness percentage, and urgent warnings (< 7 days or < 30 days).
- **Temporal Tampering Detection**:
  - Flags impossible dates: **Expiration Date preceding Manufacture Date** (indicates forged stickers or altered stamps).
  - Flags **Future Production Dates** (manufactured in the future).
  - Flags unrealistic shelf life (e.g., fresh dairy claiming 15+ years).

### 4. 🔬 Forensic Label Tamper Studio
- Dedicated inspection lab to audit physical label parameters:
  - Stated Manufacturing Date (MFD / PRD)
  - Stated Expiration Date (EXP / BBD)
  - Batch / Lot Identifier (LOT)
  - Declared Country of Origin
  - Suspicious visual packaging notes (stickers, misaligned fonts, broken seal)
- Generates a full diagnostic checklist and risk level (`LOW`, `MODERATE`, `CRITICAL`).

### 5. ⚠️ Allergens & Harmful Additives Guardian
- **Personal Allergy Sensitivity Profile**: Set dietary restrictions (Gluten, Peanuts, Dairy/Lactose, Tree Nuts, Soy, Eggs, Fish, Shellfish, etc.). Prominently displays a pulsating red alert if a scanned product contains your allergies.
- **14 Major Allergens Detection**: Automatic keyword scanning from ingredient lists and allergen tags.
- **Chemical Additives & Preservatives Knowledge Base**: Flags high-risk additives (E102 Tartrazine, E110 Sunset Yellow, E129 Allura Red, E171 Titanium Dioxide, E211 Sodium Benzoate, E250 Sodium Nitrite, E951 Aspartame, etc.) with health risk explanations.
- **Nutri-Score & NOVA Ultra-Processed Grade**: Visual nutritional classification badges.

### 6. 🚨 Counterfeit & Blacklist Registry
- Searchable community and forensic database of reported fake products.
- Submit suspect products with batch numbers, photos, violation categories, and store/vendor locations.

---

## 🏗️ Architecture & Technology Stack

```
fakeProduct/
├── backend/                       # Express.js Server
│   ├── controller/
│   │   └── fakeProduct.controller.js  # Scan, tamper audit, and report handlers
│   ├── models/
│   │   ├── fakeProduct.model.js       # File-persisted counterfeit registry
│   │   └── flagged_products_data.json # Persistent JSON database
│   ├── Routes/
│   │   └── fakeProduct.routes.js      # Express API routing
│   ├── utils/
│   │   ├── allergenHarmfulData.js     # 14 allergens & hazardous E-numbers
│   │   ├── barcodeValidator.js        # GS1 Modulo-10 checksum & country prefix decoder
│   │   └── tamperEngine.js            # Shelf-life & temporal tamper analysis
│   ├── index.js                       # Express app with CORS & health checks
│   ├── package.json
│   └── .env                           # PORT=5000
│
└── frontend/                      # React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx                   # Navigation, status, and demo triggers
    │   │   ├── CameraBarcodeScanner.jsx     # Live camera, file upload & manual input
    │   │   ├── ProductVerificationResult.jsx# Verification score, shelf-life, allergens
    │   │   ├── LabelTamperStudio.jsx        # Forensic label & date tamper inspector
    │   │   ├── CounterfeitRegistry.jsx      # Blacklisted fake products database
    │   │   ├── AllergyModal.jsx             # Personal allergy sensitivity settings
    │   │   └── ReportModal.jsx              # Submit suspect counterfeit product form
    │   ├── services/
    │   │   └── api.js                       # REST client for backend endpoints
    │   ├── utils/
    │   │   └── audio.js                     # Native Web Audio scan & alarm sounds
    │   ├── App.jsx                          # Main container & state coordinator
    │   └── index.css                        # Tailwind CSS v4 & custom animations
    ├── vite.config.js                       # Tailwind CSS plugin & backend proxy
    └── package.json
```

---

## 🚀 Running the Project Locally

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
# Or: node index.js
```
The server will start at: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

### 2. Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173` (or `http://localhost:5174` if port 5173 is occupied).

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/fake_products/scan` | Scans barcode, fetches Open Food Facts, verifies checksum, assesses allergens & expiry |
| `POST` | `/api/fake_products/inspect-label` | Forensic label inspection (date timeline, future MFD, batch code) |
| `POST` | `/api/fake_products/report` | Submit community report for fake or tampered product |
| `GET` | `/api/fake_products/flagged` | Fetch all flagged counterfeit products |
| `DELETE`| `/api/fake_products/flagged/:id` | Dismiss/delete a flagged report |
| `GET` | `/api/fake_products/demos` | Fetch curated demo test barcodes |

---

## 🧪 Sample Barcodes for Quick Testing

| Product Name | Barcode | Type | Expected Outcome |
|---|---|---|---|
| **Nutella Hazelnut Spread** | `3017620422003` | Authentic Food | Score: 100/100, GS1 Valid (France), Allergens: Milk, Soy, Tree Nuts |
| **Coca-Cola Original 330ml** | `5449000000996` | Authentic Beverage | Score: 95/100, GS1 Valid (Belgium), Additives: E150d (Caramel IV) |
| **Colgate Toothpaste** | `8718951167440` | Authentic Cosmetic | Score: 100/100, Found via Open Beauty Facts fallback |
| **Nutri-Gain Infant Formula** | `9998887776665` | Counterfeit Alert | Score: 0/100, GS1 Checksum Failed, Counterfeit Database Match |
| **Expired Dairy Demo** | `3017620422003` | Expired on Shelf | Status: EXPIRED, Days past expiry alert |
| **Forged Label Demo** | `5449000000996` | Tampered Label | Status: TAMPERED_ANOMALY, Expiry precedes Production Date |
