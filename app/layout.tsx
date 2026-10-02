import type { Metadata } from "next";
import "./globals.css";

const siteName = "NOVA SYNC";
const siteDescription = "The intelligent orchestration engine for local commerce. Keep neighborhood inventory accurate, protect customer trust, and resolve operational issues in real time.";

export const metadata: Metadata = {
  title: `${siteName} — Local commerce, in sync`,
  description: siteDescription,
  applicationName: siteName,
  openGraph: { title: siteName, siteName, description: siteDescription, type: "website" },
  twitter: { card: "summary", title: siteName, description: siteDescription },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
