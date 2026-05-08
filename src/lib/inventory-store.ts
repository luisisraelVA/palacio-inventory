import { useSyncExternalStore } from "react";
import type { Movimiento, Producto, TipoMovimiento } from "./types";
import { movimientosIniciales, productosIniciales } from "./mock-data";

interface State {
  productos: Producto[];
  movimientos: Movimiento[];
}

let state: State = {
  productos: productosIniciales,
  movimientos: movimientosIniciales,
};

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = () => listeners.forEach((l) => l());
const getSnapshot = () => state;

export function registrarMovimiento(productoId: string, tipo: TipoMovimiento, cantidad: number) {
  const productos = state.productos.map((p) => {
    if (p.id !== productoId) return p;
    const nuevoStock = tipo === "entrada" ? p.stock + cantidad : Math.max(0, p.stock - cantidad);
    return { ...p, stock: nuevoStock };
  });
  const mov: Movimiento = {
    id: `m${Date.now()}`,
    producto_id: productoId,
    tipo_movimiento: tipo,
    cantidad,
    fecha_hora: new Date().toISOString(),
  };
  state = { productos, movimientos: [mov, ...state.movimientos] };
  emit();
}

export function buscarPorCodigo(codigo: string): Producto | undefined {
  return state.productos.find((p) => p.codigo_qr.toLowerCase() === codigo.toLowerCase());
}

export function useInventory() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
