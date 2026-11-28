"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

const STORAGE_KEY = "seva:partnerId";

interface Partner { id: string; name: string; slug: string; }
interface PartnerContextValue {
  partners: Partner[];
  partnerId: string;
  setPartnerId: (id: string) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const Ctx = createContext<PartnerContextValue>({
  partners: [],
  partnerId: "",
  setPartnerId: () => {},
  loading: true,
  error: null,
  reload: () => {},
});

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerId, setPartnerIdState] = useState("");
  const setPartnerId = useCallback((id: string) => {
    setPartnerIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const [requestId, setRequestId] = useState(0);
  const [requestState, setRequestState] = useState<{
    id: number;
    loading: boolean;
    error: string | null;
  }>({ id: 0, loading: true, error: null });
  const loading = requestState.id !== requestId || requestState.loading;
  const error = requestState.id === requestId ? requestState.error : null;
  const reload = useCallback(() => setRequestId((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    api<Partner[]>("/api/partners", { signal: controller.signal }).then(
      (nextPartners) => {
        setPartners(nextPartners);
        let remembered = "";
        try {
          remembered = window.localStorage.getItem(STORAGE_KEY) || "";
        } catch {
          /* storage unavailable */
        }
        setPartnerIdState((current) => {
          if (current && nextPartners.some((p) => p.id === current)) return current;
          if (remembered && nextPartners.some((p) => p.id === remembered)) return remembered;
          return nextPartners[0]?.id || "";
        });
        setRequestState({ id: requestId, loading: false, error: null });
      },
      (cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setRequestState({
          id: requestId,
          loading: false,
          error: cause instanceof Error ? cause.message : "Gagal memuat daftar mitra.",
        });
      },
    );

    return () => controller.abort();
  }, [requestId]);

  return (
    <Ctx.Provider value={{ partners, partnerId, setPartnerId, loading, error, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePartner() { return useContext(Ctx); }
