import "../index.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Bitcoin Experimental Engine (BEE)",
  description: "A Framework for Reproducible Quantitative Research on BTCUSDT Spot Markets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
