import Script from "next/script";
import { INDEXABLE } from "@/lib/seo";

/**
 * Google Analytics 4. Solo en producción, para no mezclar visitas de preview, staging o local.
 * Pendiente legal: reflejarlo en la política de cookies (tipo "cookies" en `politicas`).
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-LJPS2R11K6";

export function Analitica() {
  if (!INDEXABLE) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
