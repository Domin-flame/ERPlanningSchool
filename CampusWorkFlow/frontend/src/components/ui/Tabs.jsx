import React from "react";

export default function Tabs({ tabs, value, onChange, label = "Onglets" }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`tabs__tab ${value === tab.value ? "is-active" : ""}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count != null && <span className="tabs__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
