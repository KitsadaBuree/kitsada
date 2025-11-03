// app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "Restaurant Dashboard",
  description: "Orders WebApp Restaurant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
