/** API pública versionada (/api/v1) que consumen la web y, en fase 2, la app Expo. */
export function GET() {
  return Response.json({ ok: true, version: "v1" });
}
