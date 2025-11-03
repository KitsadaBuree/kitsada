"use client";
import { useEffect, useState, useCallback } from "react";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      const j = await r.json();
      setUser(r.ok && j?.ok ? j.user : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { user, loading, refresh };
}
