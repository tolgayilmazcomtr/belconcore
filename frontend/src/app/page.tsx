export default function Home() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Ana Sayfası</h1>
        <p className="text-muted-foreground mt-1">BelconCORE Sistemine Hoş Geldiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Aktif Proje", value: "3", desc: "+1 yeni proje" },
          { title: "Açık Teklifler", value: "24", desc: "Bu ay 12 yeni teklif" },
          { title: "Aylık Ceket Ciro", value: "₺2.4M", desc: "Önceki aya göre %14 artış" },
          { title: "Aktif Personel", value: "45", desc: "5 şantiyede görevli" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
            <div className="text-2xl font-bold mt-2">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
        <h2 className="text-lg font-semibold mb-4">Son Aktiviteler</h2>
        <div className="text-sm text-muted-foreground flex items-center justify-center h-full pb-10">
          Grafikler veya veriler burada listelenecektir.
        </div>
      </div>
    </div>
  );
}
