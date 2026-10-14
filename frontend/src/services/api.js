/**
 * API Service for Communicating with Express Backend
 */

// In development, Vite proxies /api to http://localhost:5000
const API_BASE = '/api/fake_products';

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'OFFLINE', error: err.message };
  }
}

export async function scanProductBarcode(params) {
  const { barcode, manualExpiryDate, manualProductionDate, batchNumber, userAllergies = [] } = params;

  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode,
      manualExpiryDate,
      manualProductionDate,
      batchNumber,
      userAllergies
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to scan barcode');
  }
  return data;
}

export async function inspectLabelDetails(params) {
  const res = await fetch(`${API_BASE}/inspect-label`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Label inspection failed');
  }
  return data;
}

export async function submitCounterfeitReport(reportData) {
  const res = await fetch(`${API_BASE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to submit counterfeit report');
  }
  return data;
}

export async function getFlaggedProductsList() {
  const res = await fetch(`${API_BASE}/flagged`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch flagged products');
  }
  return data.products || [];
}

export async function deleteFlaggedReport(id) {
  const res = await fetch(`${API_BASE}/flagged/${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete report');
  }
  return data;
}

export async function getDemoProductsList() {
  const res = await fetch(`${API_BASE}/demos`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load demo products');
  }
  return data.demos || [];
}
