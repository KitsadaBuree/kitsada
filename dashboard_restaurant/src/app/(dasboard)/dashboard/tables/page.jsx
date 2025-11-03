// src/app/tables/page.jsx
"use client";
import TablesClient from "../../../../../components/tables/TablesClient";

export default function Page() {
  return (
    <div className="min-h-[calc(100vh-120px)]">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mt-6">
          <TablesClient />
        </div>
      </div>
    </div>
  );
}
