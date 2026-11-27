import { PartnerProvider } from "@/hooks/usePartner";
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <PartnerProvider>{children}</PartnerProvider>;
}
