import { useEffect, type JSX } from "react";
import { useAuthStore } from "../store/AuthStore";

export default function Logout(): JSX.Element {
    const { logout } = useAuthStore();

    useEffect(() => {
        logout();
    }, [logout]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Logout</h1>
                <p className="text-gray-500">Deslogando.</p>
            </div>
        </div>
    );
}