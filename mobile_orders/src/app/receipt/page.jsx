// redirect ไป /receipt/[code] ของออเดอร์ล่าสุด (ถ้ามี)
import { redirect } from "next/navigation";

export default async function ReceiptIndex() {
  redirect("/"); // หรือจะทำเป็นหน้าอธิบายก็ได้
}
