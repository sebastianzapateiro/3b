/** Las 20 localidades oficiales de Bogotá (MVP, CU-73). */
export const LOCALIDADES_BOGOTA = [
  { numero: 1, nombre: "Usaquén", slug: "usaquen" },
  { numero: 2, nombre: "Chapinero", slug: "chapinero" },
  { numero: 3, nombre: "Santa Fe", slug: "santa-fe" },
  { numero: 4, nombre: "San Cristóbal", slug: "san-cristobal" },
  { numero: 5, nombre: "Usme", slug: "usme" },
  { numero: 6, nombre: "Tunjuelito", slug: "tunjuelito" },
  { numero: 7, nombre: "Bosa", slug: "bosa" },
  { numero: 8, nombre: "Kennedy", slug: "kennedy" },
  { numero: 9, nombre: "Fontibón", slug: "fontibon" },
  { numero: 10, nombre: "Engativá", slug: "engativa" },
  { numero: 11, nombre: "Suba", slug: "suba" },
  { numero: 12, nombre: "Barrios Unidos", slug: "barrios-unidos" },
  { numero: 13, nombre: "Teusaquillo", slug: "teusaquillo" },
  { numero: 14, nombre: "Los Mártires", slug: "los-martires" },
  { numero: 15, nombre: "Antonio Nariño", slug: "antonio-narino" },
  { numero: 16, nombre: "Puente Aranda", slug: "puente-aranda" },
  { numero: 17, nombre: "La Candelaria", slug: "la-candelaria" },
  { numero: 18, nombre: "Rafael Uribe Uribe", slug: "rafael-uribe-uribe" },
  { numero: 19, nombre: "Ciudad Bolívar", slug: "ciudad-bolivar" },
  { numero: 20, nombre: "Sumapaz", slug: "sumapaz" },
] as const;

export type LocalidadSlug = (typeof LOCALIDADES_BOGOTA)[number]["slug"];
