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

/** Localidades que limitan entre sí (aproximado), para el filtro «También en localidades vecinas». */
export const LOCALIDADES_VECINAS: Record<LocalidadSlug, LocalidadSlug[]> = {
  usaquen: ["chapinero", "suba"],
  chapinero: ["usaquen", "santa-fe", "teusaquillo", "barrios-unidos"],
  "santa-fe": ["chapinero", "la-candelaria", "los-martires", "san-cristobal", "teusaquillo"],
  "san-cristobal": ["santa-fe", "la-candelaria", "rafael-uribe-uribe", "usme"],
  usme: ["san-cristobal", "rafael-uribe-uribe", "ciudad-bolivar", "tunjuelito", "sumapaz"],
  tunjuelito: ["rafael-uribe-uribe", "usme", "ciudad-bolivar", "kennedy"],
  bosa: ["kennedy", "ciudad-bolivar"],
  kennedy: ["bosa", "fontibon", "puente-aranda", "tunjuelito"],
  fontibon: ["engativa", "kennedy", "puente-aranda"],
  engativa: ["suba", "barrios-unidos", "teusaquillo", "fontibon"],
  suba: ["usaquen", "engativa", "barrios-unidos"],
  "barrios-unidos": ["suba", "engativa", "teusaquillo", "chapinero"],
  teusaquillo: ["chapinero", "barrios-unidos", "engativa", "santa-fe", "los-martires", "puente-aranda"],
  "los-martires": ["santa-fe", "teusaquillo", "antonio-narino", "puente-aranda", "la-candelaria"],
  "antonio-narino": ["los-martires", "puente-aranda", "rafael-uribe-uribe", "tunjuelito"],
  "puente-aranda": ["teusaquillo", "los-martires", "antonio-narino", "kennedy", "fontibon"],
  "la-candelaria": ["santa-fe", "los-martires"],
  "rafael-uribe-uribe": ["antonio-narino", "san-cristobal", "usme", "tunjuelito"],
  "ciudad-bolivar": ["bosa", "tunjuelito", "usme", "sumapaz"],
  sumapaz: ["usme", "ciudad-bolivar"],
};
