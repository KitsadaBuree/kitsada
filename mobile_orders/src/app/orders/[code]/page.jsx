import OrderPlacedLike from "../../../../components/OrderPlacedLike";

export default async function Page({ params }) {
  const { code } = await params;   // สำคัญ: ต้อง await
  return <OrderPlacedLike code={code} onCloseHref="/" />;
}
