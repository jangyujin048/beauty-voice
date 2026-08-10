import React from "react";

export default function CategoryFilter({
  categories,
  selectedCategory,
  onChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 24,
      }}
    >
      {categories.map(category => {
        const isActive =
          selectedCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            style={{
              padding: "8px 15px",
              borderRadius: 999,
              border: isActive
                ? "1px solid #123a79"
                : "1px solid #dbe3ef",
              background: isActive
                ? "#123a79"
                : "#ffffff",
              color: isActive
                ? "#ffffff"
                : "#334155",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}