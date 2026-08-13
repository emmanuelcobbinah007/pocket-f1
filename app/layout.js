import "./globals.css";

export const metadata = {
  title: "Pocket F1",
  description: "A miniature party-style F1 racing game for 4–8 drivers.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
