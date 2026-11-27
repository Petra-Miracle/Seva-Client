"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface Partner { id: string; name: string; slug: string; }
const Ctx = createContext<{ partners: Partner[]; partnerId: string; setPartnerId: (id: string) => void }>({ partners: [], partnerId: "", setPartnerId: () => {} });

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerId, setPartnerId] = useState("");
  useEffect(() => {
    api<Partner[]>("/api/partners").then((ps) => {
      setPartners(ps);
      if (ps.length && !partnerId) setPartnerId(ps[0].id);
    }).catch(() => {});
  }, []);
  return <Ctx.Provider value={{ partners, partnerId, setPartnerId }}>{children}</Ctx.Provider>;
}

export function usePartner() { return useContext(Ctx); }
