import "./globals.css";

export const metadata = {
  title: "Weekend Crew",
  description: "Plan weekends with your friends — without the group-chat chaos.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
