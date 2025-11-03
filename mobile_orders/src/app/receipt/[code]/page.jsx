import BillCalled from "../../../../components/BillCalled";
import { headers } from "next/headers";

export default async function ReceiptPage({ params }) {
  // Next 15: params เป็น Promise
  const { code } = await params;

  // (ทางเลือก) เคาะ API เพื่อให้ 404 โผล่ถ้า code ไม่ถูกต้อง
  try {
    const h = await headers();
    const host  = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const base  = `${proto}://${host}`;
    await fetch(`${base}/api/orders/${encodeURIComponent(code)}`, { cache: "no-store" });
  } catch {}

  // ไม่ส่ง props items/serviceRate/orderCode
  // ให้ BillCalled ไปดึง snapshot จาก sessionStorage ("bill:current") เอง
  return (
    <BillCalled
      title="ยืนยันการขอชำระเงิน"
      subtitle="กรุณารอพนักงานสักครู่ หรือ ติดต่อเคาน์เตอร์"
      backHref="/"
    />
  );
}
