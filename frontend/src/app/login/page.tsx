"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Building2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/login", { email, password });
            const { user, token } = response.data;

            setAuth(user, token);
            toast.success("Giriş başarılı!");

            // Delay navigation slightly to allow local storage persist taking effect
            setTimeout(() => {
                router.push("/");
            }, 100);

        } catch (error: any) {
            console.error("Giriş hatası:", error);
            const errMessage = error.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";
            toast.error(errMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Sol Taraf - Form */}
            <div className="flex items-center justify-center p-8 bg-background relative z-10">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="space-y-3 text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start items-center gap-2 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-foreground">
                                BelconCORE
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sisteme Giriş</h1>
                        <p className="text-muted-foreground text-sm">
                            Lütfen BelconCORE ERP sistemine giriş yapmak için e-posta ve şifrenizi giriniz.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                    E-posta
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                        placeholder="ornek@belcon.com.tr"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                        Şifre
                                    </label>
                                    <a href="#" className="text-sm font-medium text-primary hover:underline" onClick={(e) => { e.preventDefault(); toast.info("Lütfen sistem yöneticisi ile iletişime geçin."); }}>
                                        Şifremi unuttum?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Giriş Yapılıyor...
                                </>
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                        <div className="mt-8 text-center text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} BelconCORE. Tüm hakları saklıdır.
                        </div>
                    </form>
                </div>
            </div>

            {/* Sağ Taraf - Görsel ve Özellikler */}
            <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-zinc-950 relative overflow-hidden">
                {/* Dekoratif Arka Plan Efektleri */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10 max-w-lg space-y-8 text-white">
                    <div className="space-y-4">
                        <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-sm font-medium text-zinc-300">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                            Sistem Aktif
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
                            Gelişmiş <br /> Şantiye Yönetimi
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            BelconCORE ile projelerinizi, personelinizi ve finansal verilerinizi tek bir merkezden güvenle yönetin.
                        </p>
                    </div>

                    <div className="grid gap-6 mt-12">
                        {[
                            { title: "Kapsamlı Proje Analizi", description: "Tüm şantiyeleri anlık olarak raporlayın." },
                            { title: "Güvenli Altyapı", description: "Gelişmiş yetkilendirme ve veri güvenliği." },
                            { title: "Hızlı Performans", description: "Kesintisiz ve hızlı kullanıcı deneyimi." }
                        ].map((feature, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className="text-zinc-400 text-sm mt-1">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
