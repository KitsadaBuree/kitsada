// สร้างลิงก์สำหรับโต๊ะจาก code โดยอ้างอิงโดเมนฝั่งลูกค้า
export function getCustomerOrigin() {
  if (process.env.NEXT_PUBLIC_CUSTOMER_ORIGIN) return process.env.NEXT_PUBLIC_CUSTOMER_ORIGIN;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000"; // fallback เวลาเรียกจาก server
}

// แบบ path: /t/{code}
export function buildTableUrl(code) {
  return new URL(`/t/${encodeURIComponent(code)}`, getCustomerOrigin()).toString();
  // ถ้าอยากเปลี่ยนเป็น query: 
  // const u = new URL(`/t`, getCustomerOrigin()); u.searchParams.set("code", code); return u.toString();
}
