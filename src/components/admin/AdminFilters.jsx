export default function AdminFilters({
  keyword,
  onKeywordChange,
  stores,
  storeFilter,
  onStoreChange,
  categories,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onReset
}) {
  const statuses = ["전체", "접수", "검토중", "처리중", "답변완료"];

  return (
    <div
      style={{
        marginBottom: 24,
        padding: 18,
        border: "1px solid #e4e9f2",
        borderRadius: 16,
        background: "#f8faff"
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14
        }}
      >
        <input
          type="search"
          placeholder="제목, 내용, 답변 검색"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          style={{
            flex: "1 1 300px",
            minWidth: 220,
            padding: "12px 14px",
            border: "1px solid #d9e0ec",
            borderRadius: 10,
            fontSize: 14,
            background: "#ffffff"
          }}
        />

        <select
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value)}
          style={{
            padding: "12px 14px",
            border: "1px solid #d9e0ec",
            borderRadius: 10,
            fontSize: 14,
            background: "#ffffff"
          }}
        >
          <option value="전체">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          style={{
            padding: "12px 14px",
            border: "1px solid #d9e0ec",
            borderRadius: 10,
            fontSize: 14,
            background: "#ffffff"
          }}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === "전체" ? "전체 상태" : status}
            </option>
          ))}
        </select>

        <button type="button" className="soft" onClick={onReset}>
          ↺ 초기화
        </button>
      </div>

      <div className="filterTabs" style={{ marginBottom: 0 }}>
        {stores.map((store) => (
          <button
            type="button"
            key={store}
            onClick={() => onStoreChange(store)}
            className={storeFilter === store ? "active" : ""}
          >
            {store}
          </button>
        ))}
      </div>
    </div>
  );
}
