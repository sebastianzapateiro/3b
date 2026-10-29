import { AnaliticaConsentida, BannerCookies } from "@/components/Cookies";
import { INDEXABLE } from "@/lib/seo";

/**
 * Google Analytics 4 con consentimiento previo (ver components/Cookies.tsx).
 * Solo en producción, para no mezclar visitas de preview, staging o local.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-LJPS2R11K6";

export function Analitica() {
  return (
    <>
      <AnaliticaConsentida id={GA_ID} activa={INDEXABLE} />
      <BannerCookies activa={INDEXABLE} />
    </>
  );
}
