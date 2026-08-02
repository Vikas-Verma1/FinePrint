import "./globals.css";
import TopBar from "@/components/TopBar";
import AuroraBackground from "@/components/AuroraBackground";
import ChatBot from "@/components/ChatBot";

export const metadata = {
  title: "FinePrint — AI Insurance Advocate",
  description: "Read the fine print before you sign. Fight back when they deny.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuroraBackground />
        <TopBar />
        <main>{children}</main>

        <div id="print-area" />
        <ChatBot />
        <footer>FinePrint · AI-assisted analysis · not legal or medical advice — always review with a qualified professional</footer>
      </body>
    </html>
  );
}