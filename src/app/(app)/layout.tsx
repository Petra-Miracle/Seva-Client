import AppSidebar from "@/components/layout/AppSidebar";
import { PartnerProvider } from "@/hooks/usePartner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartnerProvider>
      <AppSidebar />
      <div className="min-h-screen lg:pl-[272px]">
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </PartnerProvider>
  );
}
