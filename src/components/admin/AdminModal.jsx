import React, { useEffect } from "react";

export default function AdminModal({
  open,
  title,
  description,
  children,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="admin-modal-header">
          <div>
            <h2>{title}</h2>

            {description && (
              <p>{description}</p>
            )}
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="admin-modal-body">
          {children}
        </div>
      </section>
    </div>
  );
}