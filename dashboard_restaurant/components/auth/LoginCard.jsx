import AuthLogo from "./AuthLogo";
import AuthTitle from "./AuthTitle";
import LoginForm from "./LoginForm";

export default function LoginCard() {
  return (
    <section className="w-full max-w-[520px] mx-auto flex flex-col items-center gap-6">
      <AuthLogo />
      <AuthTitle />

      <div className="w-full mt-2 rounded-2xl">
        <LoginForm />
      </div>
    </section>
  );
}