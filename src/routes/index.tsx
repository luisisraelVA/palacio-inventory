import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useInventory } from "@/lib/inventory-store";
import { STOCK_BAJO_UMBRAL } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Boxes, TrendingUp, QrCode, Search } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Licorería El Palacio" },
      { name: "description", content: "Panel administrativo de inventario para Licorería El Palacio." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { productos, movimientos } = useInventory();
  const [q, setQ] = useState("");

  const totalProductos = useMemo(() => productos.reduce((a, p) => a + p.stock, 0), [productos]);
  const stockBajo = useMemo(() => productos.filter((p) => p.stock <= STOCK_BAJO_UMBRAL), [productos]);
  const movimientosHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return movimientos.filter((m) => new Date(m.fecha_hora).toDateString() === hoy);
  }, [movimientos]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        p.codigo_qr.toLowerCase().includes(term)
    );
  }, [productos, q]);

  return (
    <Layout>
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-sm text-muted-foreground">Panel administrativo</p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Dashboard de Inventario</h1>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total productos en almacén"
            value={totalProductos.toLocaleString()}
            sub={`${productos.length} SKUs activos`}
            icon={<Boxes className="size-5" />}
            tone="primary"
          />
          <StatCard
            label="Alertas de stock bajo"
            value={stockBajo.length.toString()}
            sub={`Umbral: ≤ ${STOCK_BAJO_UMBRAL} unidades`}
            icon={<AlertTriangle className="size-5" />}
            tone="warning"
          />
          <StatCard
            label="Movimientos de hoy"
            value={movimientosHoy.length.toString()}
            sub={`${movimientosHoy.filter((m) => m.tipo_movimiento === "entrada").length} entradas · ${movimientosHoy.filter((m) => m.tipo_movimiento === "salida").length} salidas`}
            icon={<TrendingUp className="size-5" />}
            tone="success"
          />
        </section>

        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="font-display text-xl">Catálogo de licores</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Gestiona tu inventario completo.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, categoría o QR..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Código QR</TableHead>
                    <TableHead className="text-right">Stock actual</TableHead>
                    <TableHead className="text-right">Precio (Bs.)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((p) => {
                    const bajo = p.stock <= STOCK_BAJO_UMBRAL;
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{p.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {p.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                            <QrCode className="size-3.5" />
                            {p.codigo_qr}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center justify-center min-w-12 px-2 py-0.5 rounded-md text-sm font-semibold ${
                              bajo
                                ? "bg-warning/15 text-warning-foreground border border-warning/40"
                                : "text-foreground"
                            }`}
                          >
                            {p.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.precio.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No se encontraron productos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: "primary" | "warning" | "success";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
  }[tone];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-3xl mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={`size-10 rounded-lg flex items-center justify-center ${toneClasses}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
