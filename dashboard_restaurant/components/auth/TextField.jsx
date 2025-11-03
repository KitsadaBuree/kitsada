"use client";
import { useId, useState, useMemo } from "react";

export default function TextField({
  label = "Label",
  type = "text",
  icon: Icon,             // optional icon component
  error = "",             // error text (optional)
  helper = "",            // helper text (optional)
  className = "",
  disabled = false,
  ...props                // value, onChange, name, placeholder, autoComplete...
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  const describedBy = useMemo(() => {
    if (error) return `${id}-err`;
    if (helper) return `${id}-hlp`;
    return undefined;
  }, [error, helper, id]);

  return (
    <div className={`group ${className}`}>
      <div
        className={[
          "relative flex items-center rounded-2xl border bg-white px-3 py-3",
          "border-slate-200/90 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.25)] transition",
          "hover:border-slate-300",
          "focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100",
          disabled && "opacity-60 pointer-events-none",
          error && "border-red-300 focus-within:border-red-400 focus-within:ring-red-100",
        ].join(" ")}
      >
        {Icon && (
          <span
            className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
        )}

        {/* input */}
        <input
          id={id}
          type={inputType}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[
            "peer h-10 w-full bg-transparent outline-none",
            "text-[17px] font-semibold text-slate-800 tracking-[0.01em]",
            "placeholder-transparent caret-orange-600",
            "subpixel-antialiased [text-rendering:optimizeLegibility]",
          ].join(" ")}
          {...props}
        />

        {/* floating label */}
        <label
          htmlFor={id}
          className={[
            "pointer-events-none absolute left-3 bg-white px-1",
            Icon ? "ml-12" : "",               // ชดเชยที่มีชิปไอคอน
            "text-slate-500 transition-all",
            // ก่อนพิมพ์อยู่กลาง, โฟกัส/มีค่า → ลอยขึ้นเป็นตัวเล็ก
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base",
            "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs",
            "top-0 -translate-y-1/2 text-xs",
          ].join(" ")}
        >
          {label}
        </label>

        {/* show/hide password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="ml-2 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
            aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            tabIndex={-1}
          >
            {show ? "ซ่อน" : "แสดง"}
          </button>
        )}
      </div>

      {/* helper / error */}
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-sm text-red-600">{error}</p>
      ) : helper ? (
        <p id={`${id}-hlp`} className="mt-1 text-sm text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}
