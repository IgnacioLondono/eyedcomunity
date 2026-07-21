"use client";

import { useEffect } from "react";
import { PanelLeftClose } from "lucide-react";

const STORAGE_KEY = "eyedcomun-sidebar-collapsed";

export function SidebarToggle() {
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) === "true";
    document.documentElement.classList.toggle("sidebar-collapsed", saved);
    return () => document.documentElement.classList.remove("sidebar-collapsed");
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("sidebar-collapsed");
    window.localStorage.setItem(STORAGE_KEY, String(next));
    document.documentElement.classList.toggle("sidebar-collapsed", next);
  }

  return (
    <button
      type="button"
      className="sidebar-toggle"
      onClick={toggle}
      aria-label="Mostrar u ocultar barra lateral"
      title="Mostrar u ocultar barra lateral"
    >
      <PanelLeftClose size={18} />
    </button>
  );
}
