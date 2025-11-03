// รายการเมนูหลักไว้แยก config
import {
    LayoutDashboard,
    Utensils,
    ReceiptText,
    CheckCircle,
    Users,
    Table2,
} from "lucide-react";

export const NAV_ITEMS = [
    { label: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
    { label: "รายการอาหาร", href: "/menu", icon: Utensils },
    { label: "ออเดอร์", href: "/orders", icon: ReceiptText },
    { label: "ออเดอร์ที่ทำเสร็จแล้ว", href: "/orders/done", icon: CheckCircle },
    { label: "จัดการพนักงาน", href: "/staff", icon: Users },
    { label: "โต๊ะอาหาร", href: "/tables", icon: Table2 },
];
