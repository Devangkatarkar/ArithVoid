import "./globals.css";
import Header from "@/components/layout/header";

export const metadata = {
  title: "Arithvoid",
  description: "Secure company ZIP storage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff3ff_0%,#eef6fb_35%,#edf5fb_65%,#e7f1f9_100%)]">
        <Header />
        {children}
      </body>
    </html>
  );
}