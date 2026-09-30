import React from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Rechercher…", label = "Rechercher" }) {
  return (
    <div className="search-input">
      <Search size={16} aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
      {value && (
        <button type="button" className="icon-btn icon-btn--sm" onClick={() => onChange("")} aria-label="Effacer la recherche">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
