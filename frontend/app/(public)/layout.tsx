import "@/components/site/cinematic.css";
import { CardEffects } from "@/components/site/card-effects";
import { DemoNotice } from "@/components/site/demo-notice";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AuthRecovery } from "@/features/auth/auth-provider";
import { getSiteSettings } from "@/lib/site-settings";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <div className="public-portal flex min-h-screen flex-col">
      <CardEffects />
      <SiteHeader settings={settings} />
      {settings.demoContent && <DemoNotice />}
      <AuthRecovery />
      <div className="flex-1">{children}</div>
      <SiteFooter settings={settings} />
    </div>
  );
}
