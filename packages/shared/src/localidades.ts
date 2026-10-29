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

/** Barrios principales por localidad: se mencionan en el texto de las páginas SEO por oficio y localidad. */
export const BARRIOS_PRINCIPALES: Record<LocalidadSlug, string[]> = {
  usaquen: ["Cedritos", "Usaquén centro", "Santa Bárbara", "Toberín"],
  chapinero: ["Chapinero Alto", "El Chicó", "El Retiro", "Quinta Camacho"],
  "santa-fe": ["La Macarena", "Las Nieves", "Las Cruces", "Germania"],
  "san-cristobal": ["San Blas", "Los Libertadores", "Sosiego", "20 de Julio"],
  usme: ["Usme centro", "Danubio", "La Fiscala", "Santa Librada"],
  tunjuelito: ["Tunjuelito", "Venecia", "San Carlos", "Isla del Sol"],
  bosa: ["Bosa Centro", "El Porvenir", "Bosa Nova", "San Bernardino"],
  kennedy: ["Castilla", "Timiza", "Patio Bonito", "Carvajal"],
  fontibon: ["Fontibón centro", "Modelia", "Hayuelos", "Capellanía"],
  engativa: ["Engativá centro", "Santa Cecilia", "Boyacá Real", "Garcés Navas"],
  suba: ["Suba centro", "Niza", "La Gaitana", "Prado Veraniego"],
  "barrios-unidos": ["Siete de Agosto", "Los Alcázares", "Río Negro", "Doce de Octubre"],
  teusaquillo: ["La Soledad", "Teusaquillo", "Galerías", "Park Way"],
  "los-martires": ["Santa Fe", "La Favorita", "Ricaurte", "Eduardo Santos"],
  "antonio-narino": ["Restrepo", "Ciudad Jardín", "Santander", "Villa Mayor"],
  "puente-aranda": ["Puente Aranda", "Zona Industrial", "Pensilvania", "Salazar Gómez"],
  "la-candelaria": ["La Candelaria centro", "Egipto", "Belén", "Las Aguas"],
  "rafael-uribe-uribe": ["Quiroga", "Marruecos", "San José", "Molinos"],
  "ciudad-bolivar": ["Lucero", "Ismael Perdomo", "San Francisco", "Arborizadora"],
  sumapaz: ["San Juan de Sumapaz", "Nazareth", "Betania", "La Unión"],
};

/** Localidades con más demanda: se priorizan en enlaces y en el pie. */
export const LOCALIDADES_PRIORITARIAS: LocalidadSlug[] = ["suba", "kennedy", "engativa", "bosa", "usaquen", "ciudad-bolivar", "fontibon", "chapinero", "teusaquillo", "barrios-unidos"];

/** Centro aproximado de cada localidad (lat, lng): sirve para sugerir «los más cercanos» con la ubicación del navegador. */
export const CENTROS_LOCALIDADES: Record<LocalidadSlug, [number, number]> = {
  usaquen: [4.7, -74.03], chapinero: [4.653, -74.062], "santa-fe": [4.6, -74.06], "san-cristobal": [4.56, -74.09], usme: [4.48, -74.12],
  tunjuelito: [4.57, -74.13], bosa: [4.6, -74.19], kennedy: [4.63, -74.15], fontibon: [4.68, -74.145], engativa: [4.7, -74.11],
  suba: [4.74, -74.09], "barrios-unidos": [4.67, -74.08], teusaquillo: [4.64, -74.08], "los-martires": [4.61, -74.09], "antonio-narino": [4.59, -74.1],
  "puente-aranda": [4.62, -74.12], "la-candelaria": [4.597, -74.073], "rafael-uribe-uribe": [4.57, -74.11], "ciudad-bolivar": [4.51, -74.15], sumapaz: [4.0, -74.2],
};
