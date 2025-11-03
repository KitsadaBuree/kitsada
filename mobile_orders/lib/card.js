// src/lib/cart.js (ยูทิลใช้ซ้ำ)
const KEY = "cart_v1";
export const readCart = () => { try { return JSON.parse(localStorage.getItem(KEY)||"[]"); } catch { return []; } };
export const writeCart = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
export const addToCart = (p, qty=1, note="") => {
  const item = {
    id: Number(p.id), name: String(p.name||""), price: Number(p.price||0),
    imageUrl: p.imageUrl || "", qty: Math.max(1, Number(qty||1)), note: String(note||"").trim()
  };
  const arr = readCart();
  const i = arr.findIndex(x => Number(x.id)===item.id && String(x.note||"")===item.note);
  if (i>=0) arr[i].qty = Math.min(99, Number(arr[i].qty||1)+item.qty); else arr.push(item);
  writeCart(arr);
  return arr;
};
