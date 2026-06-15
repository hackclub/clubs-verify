import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verify your identity · Hack Club Clubs",
  description: "Identity verification for Hack Club club leaders.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="site-footer">
          <a href="https://hackclub.com" target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://assets.hackclub.com/flag-standalone-bw.svg"
              alt="Hack Club"
            />
          </a>
          <p className="footer-credit">
            clubs verification, made by{" "}
            <a href="https://headpats.you" target="_blank" rel="noreferrer">
              headpats.you
            </a>{" "}
            with &lt;3 &middot; emojis from{" "}
            <a href="https://mutant.tech" target="_blank" rel="noreferrer">
              mutant standard
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
