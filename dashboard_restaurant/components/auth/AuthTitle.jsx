export default function AuthTitle({ title = "LOGIN" }) {
  return (
    <h1 className="text-3xl font-semibold tracking-wide text-[#FD7E5A] text-center">
      {title}
    </h1>
  );
}