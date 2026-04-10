import "./globals.css";
import Header from "@/components/layout/header";

export const metadata = {
  metadataBase: new URL("https://arithvoid.deathknight.me"),

  title: {
    default: "Arithvoid | Secure File Sharing Platform",
    template: "%s | Arithvoid",
  },

  applicationName: "Arithvoid",

  description:
    "Arithvoid is a secure file sharing platform that allows users to upload, share, and automatically delete files. Built with Next.js and Supabase for fast and safe storage.",

  keywords: [
    "Arithvoid",
    "file sharing platform",
    "secure file upload",
    "temporary file hosting",
    "Next.js file storage",
    "Supabase storage",
    "team file sharing",
  ],

  authors: [{ name: "Arithvoid" }],
  creator: "Arithvoid",
  publisher: "Arithvoid",

  openGraph: {
    title: "Arithvoid | Secure File Sharing Platform",
    description:
      "Upload, share, and auto-delete files securely with Arithvoid.",
    url: "https://arithvoid.deathknight.me",
    siteName: "Arithvoid",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Arithvoid | Secure File Sharing Platform",
    description:
      "Secure file sharing with auto delete and team access.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff3ff_0%,#eef6fb_35%,#edf5fb_65%,#e7f1f9_100%)]">
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Arithvoid",
              url: "https://arithvoid.deathknight.me",
            }),
          }}
        />

        <Header />
        {children}
      </body>
    </html>
  );
}
