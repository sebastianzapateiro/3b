/** Solo rutas internas como destino tras ingresar (evita redirecciones abiertas). */
export function destinoSeguro(valor: string | string[] | null | undefined): string {
  return typeof valor === "string" && valor.startsWith("/") && !valor.startsWith("//") ? valor : "/";
}
