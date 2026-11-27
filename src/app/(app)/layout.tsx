import AppHeader from "@/components/layout/AppHeader";
import { PartnerProvider } from "@/hooks/usePartner";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartnerProvider>
      <AppHeader />
      <main className="p-6">{children}</main>
    </PartnerProvider>
  );
}
