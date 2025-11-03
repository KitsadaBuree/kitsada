import Image from "next/image";

export default function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* ไม่ใช้ rounded/overflow-hidden เพื่อไม่ให้ครอป */}
      <div className="relative h-32 w-32"> 
        <Image
          src="/restaurant.png"
          alt="restaurant"
          fill
          sizes="96px"
          className="object-contain"   //  แสดงเต็มภาพโดยไม่ตัดขอบ
          priority
        />
      </div>
    </div>
  );
}
