import "./globals.css";
import TopBar from "@/components/TopBar";

export const metadata = {
  title: "FinePrint — AI Insurance Advocate",
  description: "Read the fine print before you sign. Fight back when they deny.",
};

// New beautiful floating orbs background (replaces the old text wall)
function AmbientBackground() {
  return (
    <div className="bg-animated">
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AmbientBackground />
        <TopBar />
        <main>{children}</main>
        <footer>
          FinePrint · synthetic demo data · not legal or medical advice — outputs are drafts for human review
        </footer>
      </body>
    </html>
  );
}