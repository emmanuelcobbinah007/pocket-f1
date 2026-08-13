import "./globals.css";

export const metadata = {
  title: "Pocket F1",
  description: "A miniature party-style F1 racing game for up to 4 players.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
