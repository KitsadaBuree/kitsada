import "./globals.css";
import { Prompt } from "next/font/google";

export const metadata = {
  title: "Restaurant_mobile",
  description: "Orders WebApp Restaurant",
};

const thaiSans = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",   // เอาไปใช้ใน CSS
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={thaiSans.variable}>
      <body>{children}</body>
    </html>
  );
}
