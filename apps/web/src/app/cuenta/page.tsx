import { guardarPerfil } from "./actions";
import { FormClave } from "./FormClave";
import { exigirUsuario } from "@/lib/cuenta";
import { Aviso } from "@/components/cuenta";

/** P6 · Mis datos y seguridad. Mockup: docs/mockups/Mi_cuenta.md. */
const tarjeta = "flex flex-col gap-4 rounded-[22px] border border-borde-suave bg-white p-5 sm:p-6";
const campo = "h-13 w-full rounded-campo border-[1.5px] border-borde-campo bg-white px-4 text-base";

export default async function MisDatos({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const u = (await exigirUsuario("/cuenta")) as { name: string; email: string; telefono?: string | null };
  const sp = await searchParams;

  return (
    <div className="flex flex-col gap-5">
      {sp.ok && <Aviso tono="exito">{sp.ok}</Aviso>}
      {sp.error && <Aviso tono="error">{sp.error}</Aviso>}

      <form action={guardarPerfil} className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">Mis datos</h2>
        <div className="flex flex-col gap-1.5"><label htmlFor="nombre" className="text-sm font-semibold">Nombre</label><input id="nombre" name="nombre" defaultValue={u.name} required className={campo} /></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="correo" className="text-sm font-semibold">Correo</label><input id="correo" value={u.email} readOnly aria-describedby="ayuda-correo" className={`${campo} bg-piedra text-tinta-2`} /><span id="ayuda-correo" className="text-sm text-gris">Para cambiar el correo escríbenos desde la página de reclamos.</span></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="telefono" className="text-sm font-semibold">Celular <span className="font-normal text-gris">(opcional)</span></label><input id="telefono" name="telefono" type="tel" defaultValue={u.telefono ?? ""} placeholder="300 000 0000" className={campo} /></div>
        <button type="submit" className="flex h-[54px] items-center justify-center self-start rounded-campo bg-tinta px-8 text-[17px] font-semibold text-white">Guardar</button>
      </form>

      <section className={tarjeta}>
        <h2 className="font-display text-2xl font-bold">Clave</h2>
        <FormClave />
      </section>
    </div>
  );
}
