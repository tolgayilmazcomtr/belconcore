"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

const publicRoutes = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, setUser, token } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    // Refresh user data (including modules) when authenticated
    useEffect(() => {
        if (!isAuthenticated || !token) return;
        api.get("/me").then(res => {
            if (res.data?.user) {
                setUser({ ...res.data.user, modules: res.data.modules ?? [] });
            }
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, token]);

    useEffect(() => {
        if (!isReady) return;
        const isPublicRoute = publicRoutes.includes(pathname);
        if (!isAuthenticated && !isPublicRoute) {
            router.replace("/login");
        } else if (isAuthenticated && isPublicRoute) {
            router.replace("/");
        }
    }, [isAuthenticated, pathname, router, isReady]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
