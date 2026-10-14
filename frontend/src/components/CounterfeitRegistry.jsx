import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Trash2, 
  PlusCircle, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  Clock,
  Filter,
  Package
} from 'lucide-react';
import { deleteFlaggedReport } from '../services/api';

export default function CounterfeitRegistry({
  flaggedProducts,
  onRefresh,
  onOpenReportModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [isDeleting, setIsDeleting] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to dismiss this flagged report?')) return;
    try {
      setIsDeleting(id);
      await deleteFlaggedReport(id);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete report');
    } finally {
      setIsDeleting(null);
    }
  };

  const filtered = flaggedProducts.filter(item => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = 
      filterSeverity === 'ALL' || item.tamperSeverity === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Action */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Counterfeit & Blacklisted Registry
            </h2>
            <p className="text-xs text-slate-400">
              Community and system flagged counterfeit batches, tampered expiry labels, and illegal replicas
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenReportModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Report Counterfeit Product
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by barcode, brand, or complaint..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
          >
            <option value="ALL">All Severities ({flaggedProducts.length})</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
          </select>
        </div>
      </div>

      {/* Flagged Products Grid / Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 shadow-lg transition-all space-y-3 relative group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase tracking-wider ${
                    item.tamperSeverity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {item.tamperSeverity || 'HIGH'} SEVERITY
                  </span>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                    {item.flagType.replace(/_/g, ' ')}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting === item.id}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition opacity-0 group-hover:opacity-100"
                  title="Dismiss report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Brand */}
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-rose-200 transition">
                  {item.productName}
                </h3>
                <p className="text-xs text-slate-400">
                  {item.brand} • Barcode: <span className="font-mono text-rose-400 font-semibold">{item.barcode}</span>
                </p>
              </div>

              {/* Reason / Complaint Description */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-rose-400">Flag Reason: </span>
                {item.reason}
              </div>

              {/* Metadata footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                {item.batchNumber && (
                  <span className="font-mono">Batch: {item.batchNumber}</span>
                )}
                {item.storeLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {item.storeLocation}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(item.flaggedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Flagged Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No products match your search criteria. You can submit a new suspicious product report anytime.
          </p>
        </div>
      )}

    </div>
  );
}
