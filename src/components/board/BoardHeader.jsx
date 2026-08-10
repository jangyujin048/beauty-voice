import React from "react";
import { Plus } from "lucide-react";

export default function BoardHeader({
  title,
  description,
  onWrite,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <h2
          style={{
            marginBottom: 8,
          }}
        >
          {title}
        </h2>

        <p className="sub">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onWrite}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          padding: "10px 16px",
          border: "1px solid #123a79",
          borderRadius: 12,
          background: "#123a79",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow:
            "0 4px 12px rgba(18, 58, 121, 0.14)",
          whiteSpace: "nowrap",
        }}
      >
        <Plus size={18} />
        글쓰기
      </button>
    </div>
  );
}