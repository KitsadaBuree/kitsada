import Link from "next/link";
import React from "react";



export function ItemCard({ name, price, id, imageUrl }) {
  return (
    <Link
      href={`/product/${id}`}  // <-- เปลี่ยนเป็น products
      prefetch={false}
      className="flex items-center gap-4 py-4 cursor-pointer hover:bg-gray-50 transition rounded-xl"
    >
      <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-xl" />
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 leading-tight">{name}</h3>
        <p className="text-gray-700">฿{Number(price).toFixed(2)}</p>
        <p className="text-gray-400 text-sm tracking-wider">ID {id}</p>
      </div>
    </Link>
  );
}
