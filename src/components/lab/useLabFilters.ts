"use client";
import { useEffect, useState } from "react";
export function useLabFilters() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("all");
  const [type, setType] = useState("all");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      const p = new URLSearchParams(window.location.search);
      setQuery(p.get("q") || "");
      setField(p.get("field") || "all");
      setType(p.get("type") || "all");
    };
    read();
    setReady(true);
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const u = new URL(window.location.href);
    for (const [k, v] of [
      ["q", query],
      ["field", field],
      ["type", type],
    ]) {
      if (v && v !== "all") u.searchParams.set(k, v);
      else u.searchParams.delete(k);
    }
    window.history.replaceState(null, "", u.pathname + u.search + u.hash);
  }, [query, field, type, ready]);
  return {
    query,
    setQuery,
    field,
    setField,
    type,
    setType,
    reset: () => {
      setQuery("");
      setField("all");
      setType("all");
    },
  };
}
