import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, ScanLine, Shuffle, X } from "lucide-react";
import { useState } from "react";
import { buscarPorCodigo, registrarMovimiento, useInventory } from "@/lib/inventory-store";
import type { Producto } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/escaner")({
  head: () => ({
    meta: [
      { title: "Terminal de Escaneo · El Palacio" },
      { name: "description", content: "Escanea códigos QR para registrar entradas y salidas de inventario." },
    ],
  }),
  component: EscanerPage,
});

function EscanerPage() {
  const { productos, movimientos } = useInventory();
  const [codigo, setCodigo] = useState("");
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const escanear = (cod: string) => {
    const found = buscarPorCodigo(cod);
    if (found) {
      setProducto(found);
      setCodigo(found.codigo_qr);
      setCantidad(1);
    } else {
      toast.error("Código no encontrado", { description: cod });
    }
  };

  const escanearAleatorio = () => {
    const r = productos[Math.floor(Math.random() * productos.length)];
    escanear(r.codigo_qr);
  };

  const submitCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) escanear(codigo.trim());
  };

  const accion = (tipo: "entrada" | "salida") => {
    if (!producto) return;
    if (cantidad < 1) return toast.error("Cantidad inválida");
    if (tipo === "salida" && cantidad > producto.stock) {
      return toast.error("Stock insuficiente", { description: `Solo quedan ${producto.stock} unidades.` });
    }
    registrarMovimiento(producto.id, tipo, cantidad);
    const nuevoStock = tipo === "entrada" ? producto.stock + cantidad : producto.stock - cantidad;
    setProducto({ ...producto, stock: nuevoStock });
    toast.success(tipo === "entrada" ? "Entrada registrada" : "Salida registrada", {
      description: `${cantidad} × ${producto.nombre}`,
    });
  };

  const limpiar = () => {
    setProducto(null);
    setCodigo("");
    setCantidad(1);
  };

  const ultimos = movimientos.slice(0, 4);

  return (
    <Layout>
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-sm text-muted-foreground">Terminal móvil</p>
          <h1 className="font-display text-2xl md:text-3xl mt-1">Escaneo rápido</h1>
        </header>

        {/* Scanner viewport */}
        <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-elegant)]">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-sidebar to-sidebar-accent flex items-center justify-center">
            <div className="absolute inset-6 border-2 border-sidebar-primary/60 rounded-xl" />
            <div className="absolute inset-x-10 top-1/2 h-0.5 bg-sidebar-primary animate-pulse" />
            <div className="text-center text-sidebar-foreground/80 z-10">
              <ScanLine className="size-12 mx-auto mb-2 text-sidebar-primary" />
              <p className="text-sm">Apunta al código QR / barras</p>
            </div>
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <Badge className="bg-success text-success-foreground">● En línea</Badge>
              <Badge variant="secondary">Cámara simulada</Badge>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <form onSubmit={submitCodigo} className="flex gap-2">
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ingresa o escanea código (ej. QR-WHIS-001)"
                className="font-mono"
              />
              <Button type="submit" variant="secondary">Buscar</Button>
            </form>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={escanearAleatorio}
            >
              <Shuffle className="size-4 mr-2" />
              Simular escaneo aleatorio
            </Button>
          </CardContent>
        </Card>

        {/* Producto detectado */}
        {producto ? (
          <Card className="mt-4 border-primary/30 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge variant="secondary" className="mb-2">{producto.categoria}</Badge>
                  <h2 className="font-display text-xl leading-tight">{producto.nombre}</h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{producto.codigo_qr}</p>
                </div>
                <button onClick={limpiar} className="text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Stock actual</p>
                  <p className="font-display text-2xl">{producto.stock}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Precio</p>
                  <p className="font-display text-2xl">Bs. {producto.precio.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Cantidad</label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                    className="text-center text-lg h-12 font-semibold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setCantidad((c) => c + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <Button
                  size="lg"
                  className="h-16 text-base bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => accion("entrada")}
                >
                  <ArrowDownToLine className="size-5 mr-2" />
                  Registrar Entrada
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-16 text-base"
                  onClick={() => accion("salida")}
                >
                  <ArrowUpFromLine className="size-5 mr-2" />
                  Registrar Salida
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-4 border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Escanea o ingresa un código para iniciar.
            </CardContent>
          </Card>
        )}

        {/* Últimos movimientos */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Últimos movimientos
          </h3>
          <div className="space-y-2">
            {ultimos.map((m) => {
              const p = productos.find((x) => x.id === m.producto_id);
              const entrada = m.tipo_movimiento === "entrada";
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-card border border-border/60 rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-md flex items-center justify-center ${
                        entrada ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {entrada ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p?.nombre ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.fecha_hora).toLocaleString("es-BO", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      entrada ? "text-success" : "text-destructive"
                    }`}
                  >
                    {entrada ? "+" : "−"}
                    {m.cantidad}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
