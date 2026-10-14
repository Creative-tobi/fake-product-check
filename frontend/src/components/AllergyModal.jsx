import React from 'react';
import { X, HeartCrack, Check, ShieldCheck } from 'lucide-react';

const COMMON_ALLERGENS = [
  { id: 'gluten', name: 'Gluten / Wheat' },
  { id: 'milk', name: 'Milk & Dairy (Lactose)' },
  { id: 'peanuts', name: 'Peanuts' },
  { id: 'treenuts', name: 'Tree Nuts (Almonds, Cashews, etc.)' },
  { id: 'eggs', name: 'Eggs' },
  { id: 'soybeans', name: 'Soybeans / Soy' },
  { id: 'fish', name: 'Fish' },
  { id: 'crustaceans', name: 'Crustaceans / Shellfish' },
  { id: 'sesame', name: 'Sesame Seeds' },
  { id: 'mustard', name: 'Mustard' },
  { id: 'sulphites', name: 'Sulphur Dioxide / Sulphites' },
  { id: 'celery', name: 'Celery' }
];

export default function AllergyModal({
  isOpen,
  onClose,
  userAllergies,
  onToggleAllergy,
  onClearAllergies
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-950 border border-teal-500/40 text-teal-400">
              <HeartCrack className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Personal Allergy Guardian Profile
              </h3>
              <p className="text-xs text-slate-400">
                Select your sensitivities to receive prominent warnings on scan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Allergen Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {COMMON_ALLERGENS.map((allergen) => {
            const isSelected = userAllergies.includes(allergen.name);
            return (
              <button
                key={allergen.id}
                type="button"
                onClick={() => onToggleAllergy(allergen.name)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-left transition ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{allergen.name}</span>
                {isSelected ? (
                  <span className="p-0.5 rounded-full bg-emerald-500 text-slate-950">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={onClearAllergies}
            className="text-xs text-slate-400 hover:text-rose-400 font-medium transition"
          >
            Reset All
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Save Profile ({userAllergies.length} Selected)
          </button>
        </div>

      </div>
    </div>
  );
}
