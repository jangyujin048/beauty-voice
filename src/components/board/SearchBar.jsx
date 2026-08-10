import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
}) {
  return (
    <div
      style={{
        position: "relative",
        marginBottom: 18,
      }}
    >
      <Search
        size={18}
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#8a93a3",
          pointerEvents: "none",
        }}
      />

      <input
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        placeholder="제목 또는 내용 검색"
        style={{
          width: "100%",
          height: 48,
          padding: "0 16px 0 46px",
          border: "1px solid #dfe5ef",
          borderRadius: 14,
          background: "#fff",
          fontSize: 14,
          color: "#162033",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={event => {
          event.currentTarget.style.borderColor =
            "#123a79";

          event.currentTarget.style.boxShadow =
            "0 0 0 3px rgba(18, 58, 121, 0.08)";
        }}
        onBlur={event => {
          event.currentTarget.style.borderColor =
            "#dfe5ef";

          event.currentTarget.style.boxShadow =
            "none";
        }}
      />
    </div>
  );
}