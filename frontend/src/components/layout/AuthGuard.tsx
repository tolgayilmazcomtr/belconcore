"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const publicRoutes = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // To avoid hydration mismatch, delay render until auth state is checked
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);

        // Check if the route is public
        const isPublicRoute = publicRoutes.includes(pathname);

        if (!isAuthenticated && !isPublicRoute) {
            // Redirect unauthenticated user to login area
            router.replace("/login");
        } else if (isAuthenticated && isPublicRoute) {
            // Redirect authenticated user away from login
            router.replace("/");
        }
    }, [isAuthenticated, pathname, router]);

    // Handle loading state to prevent flash of content
    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    // Hide protected content if user is unauthenticated and on a protected route
    // (the router.replace above will trigger navigation shortly)
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
