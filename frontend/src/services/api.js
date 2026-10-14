/**
 * API Service for Communicating with Express Backend
 */

// Determine base URL:
// 1. If VITE_SERVER_URL is provided in .env (e.g. deployed Render backend), use it.
// 2. Otherwise use relative '/api' which Vite proxies to localhost:5000 in dev.
const ENV_SERVER_URL = (import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = ENV_SERVER_URL ? `${ENV_SERVER_URL}/api/fake_products` : '/api/fake_products';
const API_HEALTH = ENV_SERVER_URL ? `${ENV_SERVER_URL}/api/health` : '/api/health';

/**
 * Robust fetch wrapper that safely handles empty bodies, HTML error pages, and network timeouts.
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input" errors.
 */
async function safeFetchJson(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await res.text();
    let data = null;

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        // Response was not valid JSON (e.g. HTML 502/504 error page from Render or dev proxy)
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<head')) {
          throw new Error(
            `Server returned an HTML page instead of JSON (${res.status} ${res.statusText || 'Error'}). If you are using Render, the free server may still be spinning up from sleep. Please wait 15-30 seconds and try again.`
          );
        }
        throw new Error(`Invalid server response format (${res.status} ${res.statusText || 'Error'}).`);
      }
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Server request failed with status ${res.status} (${res.statusText || 'Error'})`;
      throw new Error(errorMsg);
    }

    if (!data) {
      throw new Error(
        `Backend server returned an empty response. If running locally, please ensure your Express backend is started ('npm start' in backend).`
      );
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'Request timed out. The backend server took too long to respond. If running on Render free tier, please allow up to 45 seconds for cold start.'
      );
    }
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        'Unable to connect to the backend server. Please verify your network connection and ensure the backend is running.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkServerHealth() {
  try {
    return await safeFetchJson(API_HEALTH, { method: 'GET' }, 8000);
  } catch (primaryErr) {
    // If remote URL is set but unreachable, attempt fallback to local proxy
    if (ENV_SERVER_URL && API_HEALTH !== '/api/health') {
      try {
        return await safeFetchJson('/api/health', { method: 'GET' }, 3000);
      } catch (e) {
        // Fallback also failed
      }
    }
    return { status: 'OFFLINE', error: primaryErr.message };
  }
}

export async function scanProductBarcode(params) {
  const { barcode, manualExpiryDate, manualProductionDate, batchNumber, userAllergies = [] } = params;

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode,
      manualExpiryDate,
      manualProductionDate,
      batchNumber,
      userAllergies
    })
  };

  try {
    return await safeFetchJson(`${API_BASE}/scan`, requestOptions, 25000);
  } catch (primaryErr) {
    // If remote backend failed and we have a local proxy fallback, attempt it
    if (ENV_SERVER_URL && API_BASE !== '/api/fake_products') {
      try {
        console.warn('Remote backend scan failed, attempting local proxy fallback:', primaryErr.message);
        return await safeFetchJson('/api/fake_products/scan', requestOptions, 10000);
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

export async function inspectLabelDetails(params) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  };

  try {
    return await safeFetchJson(`${API_BASE}/inspect-label`, requestOptions, 25000);
  } catch (primaryErr) {
    if (ENV_SERVER_URL && API_BASE !== '/api/fake_products') {
      try {
        return await safeFetchJson('/api/fake_products/inspect-label', requestOptions, 10000);
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

export async function submitCounterfeitReport(reportData) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  };

  try {
    return await safeFetchJson(`${API_BASE}/report`, requestOptions, 20000);
  } catch (primaryErr) {
    if (ENV_SERVER_URL && API_BASE !== '/api/fake_products') {
      try {
        return await safeFetchJson('/api/fake_products/report', requestOptions, 10000);
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

export async function getFlaggedProductsList() {
  try {
    const data = await safeFetchJson(`${API_BASE}/flagged`, { method: 'GET' }, 10000);
    return data.products || [];
  } catch (primaryErr) {
    if (ENV_SERVER_URL && API_BASE !== '/api/fake_products') {
      try {
        const data = await safeFetchJson('/api/fake_products/flagged', { method: 'GET' }, 5000);
        return data.products || [];
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

export async function deleteFlaggedReport(id) {
  const requestOptions = { method: 'DELETE' };
  try {
    return await safeFetchJson(`${API_BASE}/flagged/${id}`, requestOptions, 10000);
  } catch (primaryErr) {
    if (ENV_SERVER_URL && API_BASE !== '/api/fake_products') {
      try {
        return await safeFetchJson(`/api/fake_products/flagged/${id}`, requestOptions, 5000);
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}

export async function getDemoProductsList() {
  try {
    const data = await safeFetchJson(`${API_BASE}/demos`, { method: 'GET' }, 10000);
    return data.demos || [];
  } catch (primaryErr) {
    if (ENV_SERVER_URL && API_BASE !== '/api/fake_products') {
      try {
        const data = await safeFetchJson('/api/fake_products/demos', { method: 'GET' }, 5000);
        return data.demos || [];
      } catch (fallbackErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
}
