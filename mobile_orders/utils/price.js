// utils/price.js (หรือวางบนสุดใน BillClient ก็ได้)
export const sumSubtotal = (items=[]) =>
  items.reduce((s, it) => s + Number(it.qty) * Number(it.unit_price), 0);

export const calcTotals = (items=[], serviceRate=0) => {
  const subtotal = sumSubtotal(items);
  const service  = subtotal * Number(serviceRate);   // เช่น 0.10 = 10%
  const total    = subtotal + service;
  return { subtotal, service, total };
};

export const calcEarnedPoints = (total) => Math.floor(total / 10);
