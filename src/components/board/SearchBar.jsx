import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <Search size={18} />

      <input
        value={value}
        onChange={event =>
          onChange(event.target.value)
        }
        placeholder="제목 또는 내용 검색"
        style={{ flex: 1 }}
      />
    </div>
  );
}