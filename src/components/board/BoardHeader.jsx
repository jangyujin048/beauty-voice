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
        <h2 style={{ marginBottom: 8 }}>
          {title}
        </h2>

        <p className="sub">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onWrite}
      >
        <Plus size={18} />
        글쓰기
      </button>
    </div>
  );
}