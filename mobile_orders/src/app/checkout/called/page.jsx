// src/app/checkout/called/page.jsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/"); // หรือจะอ่าน searchParams แล้ว redirect ไป /receipt/[code] ก็ได้
}
