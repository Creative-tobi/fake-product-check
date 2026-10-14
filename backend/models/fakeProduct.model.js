/**
 * Fake and Tampered Product Data Model
 * 
 * Provides an in-memory and file-backed persistent store for flagged,
 * counterfeit, and tampered product reports. Works immediately out-of-the-box
 * without requiring an external MongoDB instance.
 */

const fs = require('fs');
const path = require('path');

// Storage file location for persisting flagged counterfeit products
const DATA_FILE = path.join(__dirname, 'flagged_products_data.json');

// Initial seed data with realistic counterfeit & tampered product examples
const DEFAULT_FLAGGED_PRODUCTS = [
  {
    id: "flag-001",
    barcode: "8901030383451",
    productName: "Dove Deep Moisture Body Wash (Counterfeit Batch)",
    brand: "Unilever (Forged)",
    flagType: "SUSPECTED_COUNTERFEIT",
    reason: "Chemical smell reported; batch number does not match authentic Unilever format; label font mismatch",
    reportedExpiryDate: "2027-12-31",
    reportedProductionDate: "2024-01-15",
    batchNumber: "BCH-FAKE-992",
    storeLocation: "Local Open Market, Stall 4",
    flaggedAt: "2025-01-10T14:22:00.000Z",
    tamperSeverity: "HIGH",
    status: "CONFIRMED_FAKE"
  },
  {
    id: "flag-002",
    barcode: "5449000000996",
    productName: "Coca-Cola Original Taste 500ml",
    brand: "The Coca-Cola Company",
    flagType: "TAMPERED_DETAILS",
    reason: "Expired product relabeled with forged expiration date sticker placed over original stamp",
    reportedExpiryDate: "2023-04-10",
    reportedProductionDate: "2022-10-01",
    batchNumber: "CC-RELBL-402",
    storeLocation: "Metro Convenience Store",
    flaggedAt: "2025-02-18T09:15:00.000Z",
    tamperSeverity: "CRITICAL",
    status: "TAMPERED_DATE"
  },
  {
    id: "flag-003",
    barcode: "9998887776665",
    productName: "Nutri-Gain Infant Milk Formula",
    brand: "Fake Labs Int.",
    flagType: "INVALID_CHECKSUM",
    reason: "Barcode checksum failed mathematically. Product unregistered with National Food Safety Agency",
    reportedExpiryDate: "2026-08-20",
    reportedProductionDate: "2024-08-20",
    batchNumber: "NG-00984",
    storeLocation: "Wholesale Depot Area 7",
    flaggedAt: "2025-03-05T11:45:00.000Z",
    tamperSeverity: "CRITICAL",
    status: "UNREGISTERED_DANGEROUS"
  }
];

class FakeProductStore {
  constructor() {
    this.products = [];
    this._load();
  }

  // Load from disk or initialize with seed data
  _load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.products = JSON.parse(raw);
      } else {
        this.products = [...DEFAULT_FLAGGED_PRODUCTS];
        this._save();
      }
    } catch (err) {
      console.error('Failed to read flagged products file, using in-memory store:', err.message);
      this.products = [...DEFAULT_FLAGGED_PRODUCTS];
    }
  }

  // Save to disk
  _save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.products, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save flagged products to disk:', err.message);
    }
  }

  // Find all items or filter
  async find(filter = {}) {
    if (!filter || Object.keys(filter).length === 0) {
      return [...this.products].sort((a, b) => new Date(b.flaggedAt) - new Date(a.flaggedAt));
    }

    return this.products.filter(item => {
      for (const [key, val] of Object.entries(filter)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
  }

  // Find a product by barcode
  async findByBarcode(barcode) {
    if (!barcode) return null;
    const clean = String(barcode).trim();
    return this.products.find(p => String(p.barcode).trim() === clean) || null;
  }

  // Find by ID
  async findById(id) {
    return this.products.find(p => p.id === id) || null;
  }

  // Create and save new flagged product report
  async create(data) {
    const newRecord = {
      id: data.id || `flag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      barcode: String(data.barcode || '').trim(),
      productName: data.productName || 'Unidentified Product',
      brand: data.brand || 'Unknown Brand',
      flagType: data.flagType || 'UNREGISTERED_IN_GLOBAL_REGISTRY',
      reason: data.reason || 'Flagged during authenticity inspection',
      reportedExpiryDate: data.reportedExpiryDate || null,
      reportedProductionDate: data.reportedProductionDate || null,
      batchNumber: data.batchNumber || null,
      storeLocation: data.storeLocation || 'Not specified',
      imageUrl: data.imageUrl || null,
      tamperSeverity: data.tamperSeverity || 'MODERATE',
      status: data.status || 'REPORTED_FOR_REVIEW',
      flaggedAt: data.flaggedAt || new Date().toISOString(),
      notes: data.notes || ''
    };

    this.products.unshift(newRecord);
    this._save();
    return newRecord;
  }

  // Delete a flagged product report
  async delete(id) {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      const removed = this.products.splice(index, 1)[0];
      this._save();
      return removed;
    }
    return null;
  }
}

// Singleton instance
const fakeProductModel = new FakeProductStore();

module.exports = fakeProductModel;