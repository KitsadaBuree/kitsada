export const metadata = { title: "Login | Dashboard" };


import LoginCard from "../../../../components/auth/LoginCard";


export default function Page() {
    return (
        <main className="min-h-screen grid place-items-center bg-white">
            <LoginCard />
        </main>
    );
}