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
      {categories.map(category => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={
            selectedCategory === category
              ? "active"
              : ""
          }
        >
          {category}
        </button>
      ))}
    </div>
  );
}