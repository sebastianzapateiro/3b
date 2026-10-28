"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  guardarPaso1,
  guardarPaso2,
  guardarPaso3,
  enviarOTP,
  verificarOTP,
} from "./actions";
import { Encabezado, Aviso, campo, etiqueta, botonPrincipal } from "@/components/cuenta";

type Paso = 1 | 2 | 3 | "otp" | "recibido";

export function RegistroProveedorClient() {
  const [paso, setPaso] = useState<Paso>(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [isPending, startTransition] = useTransition();
  const [requiereRut, setRequiereRut] = useState(false);

  const asyncGuardarPaso1 = async (fd: FormData) => {
    const res = await guardarPaso1(fd);
    if (res?.error) {
      setError(res.error);
      return false;
    }
    if (res?.ok) {
      setRequiereRut(!!res.requiereRut);
      setPaso(2);
      return true;
    }
    setError("Error al guardar. Intenta de nuevo.");
    return false;
  };

  const asyncGuardarPaso2 = async (fd: FormData) => {
    const res = await guardarPaso2(fd);
    if (res?.error) {
      setError(res.error);
      return false;
    }
    setPaso(3);
    return true;
  };

  const asyncGuardarPaso3 = async (fd: FormData) => {
    const res = await guardarPaso3(fd);
    if (res?.error) {
      setError(res.error);
      return false;
    }
    setPaso("otp");
    return true;
  };

  const handlePaso1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    await startTransition(async () => {
      await asyncGuardarPaso1(fd);
    });
    setCargando(false);
  };

  const handlePaso2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    await startTransition(async () => {
      await asyncGuardarPaso2(fd);
    });
    setCargando(false);
  };

  const handlePaso3 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    await startTransition(async () => {
      await asyncGuardarPaso3(fd);
    });
    setCargando(false);
  };

  const handleEnviarOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await enviarOTP(fd);
    if (res?.error) {
      setError(res.error);
      setCargando(false);
      return;
    }
    setAviso("Código enviado por WhatsApp (revisa la consola del servidor en desarrollo).");
    setPaso("otp");
    setCargando(false);
  };

  const handleVerificarOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await verificarOTP(fd);
    if (res?.error) {
      setError(res.error);
      setCargando(false);
      return;
    }
    setPaso("recibido");
    setCargando(false);
  };

  const pasoTitulo: Record<Paso, string> = {
    1: "Datos básicos",
    2: "Qué ofreces y dónde",
    3: "Verificación",
    otp: "Código de verificación",
    recibido: "Listo",
  };

  const pasoSubtitulo: Record<Paso, string> = {
    1: "Cuéntanos quién eres y qué servicios ofreces.",
    2: "Detalla tus precios, servicios y localidades.",
    3: "Verifica tu identidad y documentos.",
    otp: "Introduce el código que te enviamos por WhatsApp.",
    recibido: "Tu solicitud está en revisión.",
  };

  const pasos: Paso[] = [1, 2, 3, "otp", "recibido"];
  const pasoIndex = pasos.indexOf(paso);

  if (paso === "recibido") {
    return (
      <div className="mx-auto max-w-[420px] px-6 py-16 text-center">
        <Encabezado
          titulo="Gracias por registrarte"
          texto="Tu solicitud de proveedor está en revisión. Te avisaremos por correo cuando esté publicada."
        />
        <Aviso tono="exito">
          Estado: <b>pendiente</b>. Revisaremos tu información y documentos en los próximos días.
        </Aviso>
        <p className="mt-6 text-[15px] text-tinta-2">
          Mientras tanto, puedes seguir usando Las 3B como comprador.
        </p>
        <Link href="/" className={botonPrincipal}>
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[420px] px-6 pb-16">
      <Encabezado
        titulo={`Paso ${pasoIndex + 1} de 4 · ${pasoTitulo[paso]}`}
        texto={pasoSubtitulo[paso]}
      />

      <ol className="flex gap-2 mt-8 mb-6 text-xs font-medium text-gris">
        {pasos.map((p, i) => (
          <li
            key={p}
            className={`flex items-center gap-2 rounded-full px-3 py-1 ${
              i < pasoIndex
                ? "bg-verde-claro text-verde-oscuro"
                : i === pasoIndex
                ? "bg-tinta text-white"
                : "bg-borde-suave text-gris"
            }`}
          >
            {pasoTitulo[p]}
          </li>
        ))}
      </ol>

      {error && <Aviso tono="error">{error}</Aviso>}
      {aviso && <Aviso tono="exito">{aviso}</Aviso>}

      {paso === 1 && (
        <form onSubmit={handlePaso1} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombrePublico" className={etiqueta}>
              Nombre público del negocio
            </label>
            <input
              id="nombrePublico"
              name="nombrePublico"
              placeholder="Ej: Plomería Jairo"
              required
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="segmento" className={etiqueta}>
              ¿Eres independiente o empresa?
            </label>
            <select id="segmento" name="segmento" required className={campo}>
              <option value="independiente_sin_rut">Independiente (sin RUT)</option>
              <option value="independiente_con_rut">Independiente (con RUT)</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="whatsapp" className={etiqueta}>
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              placeholder="300 000 0000"
              required
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className={etiqueta}>
              Dirección de tu página (ej. lastresb.com.co/<span>mi-negocio</span>)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gris text-sm">
                lastresb.com.co/
              </span>
              <input
                id="slug"
                name="slug"
                placeholder="mi-negocio"
                required
                className={`${campo} pl-10`}
              />
            </div>
          </div>
          <button type="submit" disabled={cargando} className={`mt-2 ${botonPrincipal}`}>
            {cargando ? "Guardando…" : "Siguiente: Qué ofreces"}
          </button>
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={handlePaso2} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="presentacion" className={etiqueta}>
              Presentación (hasta 280 caracteres)
            </label>
            <textarea
              id="presentacion"
              name="presentacion"
              rows={4}
              placeholder="En qué te especializas y cómo trabajas…"
              className={campo}
              maxLength={280}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="aniosExperiencia" className={etiqueta}>
              Años de experiencia
            </label>
            <input
              id="aniosExperiencia"
              name="aniosExperiencia"
              type="number"
              min="0"
              placeholder="Ej: 5"
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={etiqueta}>Servicios y precios (mínimo 1)</label>
            <div id="servicios" className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:gap-3 gap-1.5">
                <input
                  name="servicios[]"
                  placeholder="Ej: Visita de diagnóstico"
                  required
                  className={campo}
                />
                <input
                  name="precios[]"
                  type="number"
                  placeholder="Desde"
                  className={campo}
                />
                <select name="unidades[]" className={campo}>
                  <option value="visita">Visita</option>
                  <option value="hora">Hora</option>
                  <option value="trabajo">Trabajo</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const contenedor = document.getElementById("servicios");
                if (!contenedor) return;
                const nodo = document.createElement("div");
                nodo.className = "flex flex-col sm:flex-row sm:gap-3 gap-1.5";
                nodo.innerHTML = `
                  <input name="servicios[]" placeholder="Ej: Instalación de calentador" required class="${campo}" />
                  <input name="precios[]" type="number" placeholder="Desde" class="${campo}" />
                  <select name="unidades[]" class="${campo}">
                    <option value="visita">Visita</option>
                    <option value="hora">Hora</option>
                    <option value="trabajo">Trabajo</option>
                  </select>
                  <button type="button" class="h-13 w-13 rounded-full bg-tinta text-white flex items-center justify-center sm:hidden" onclick="this.closest('div').remove()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                  </button>
                `;
                contenedor.appendChild(nodo);
              }}
              className="text-sm font-semibold text-verde hover:text-verde-oscuro"
            >
              + Agregar otro servicio
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="localidadesAdicionales" className={etiqueta}>
              Localidades donde trabajas
            </label>
            <select
              id="localidadesAdicionales"
              name="localidades[]"
              multiple
              size={4}
              className={campo}
            >
              <option value="11">Suba</option>
              <option value="1">Usaquén</option>
              <option value="2">Chapinero</option>
              <option value="12">Barrios Unidos</option>
              <option value="13">Teusaquillo</option>
              <option value="14">Los Mártires</option>
              <option value="15">Antonio Nariño</option>
              <option value="16">Puente Aranda</option>
              <option value="17">La Candelaria</option>
              <option value="18">Rafael Uribe Uribe</option>
              <option value="19">Ciudad Bolívar</option>
              <option value="20">Sumapaz</option>
              <option value="3">Santa Fe</option>
              <option value="4">San Cristóbal</option>
              <option value="5">Usme</option>
              <option value="6">Tunjuelito</option>
              <option value="7">Bosa</option>
              <option value="8">Kennedy</option>
              <option value="9">Fontibón</option>
              <option value="10">Engativá</option>
            </select>
            <p className="text-xs text-gris">Mantén presionado (Ctrl/Cmd) para elegir varias.</p>
          </div>
          <button type="submit" disabled={cargando} className={`mt-2 ${botonPrincipal}`}>
            {cargando ? "Guardando…" : "Siguiente: Verificación"}
          </button>
        </form>
      )}

      {paso === 3 && (
        <form onSubmit={handlePaso3} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tipoDocumento" className={etiqueta}>
              Tipo de documento
            </label>
            <select id="tipoDocumento" name="tipoDocumento" required className={campo}>
              <option value="cc">Cédula de ciudadanía (CC)</option>
              <option value="ce">Cédula de extranjería (CE)</option>
              <option value="ppt">Permiso por protección temporal (PPT)</option>
              <option value="nit">NIT</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="documento" className={etiqueta}>
              Número de documento
            </label>
            <input
              id="documento"
              name="documento"
              type="text"
              placeholder="Ej: 12345678"
              required
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="direccionNotificaciones" className={etiqueta}>
              Dirección de notificaciones
            </label>
            <input
              id="direccionNotificaciones"
              name="direccionNotificaciones"
              placeholder="Calle 123 # 45 - 67, Bogotá"
              required
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fechaNacimiento" className={etiqueta}>
              Fecha de nacimiento
            </label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              required
              className={campo}
            />
          </div>
          {requiereRut && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rut" className={etiqueta}>
                RUT <span className="text-verde-oscuro font-semibold">(obligatorio)</span>
              </label>
              <input
                id="rut"
                name="rut"
                type="text"
                placeholder="Ej: 900.123.456-7"
                required
                className={campo}
              />
              <p className="text-xs text-gris">
                Tu categoría o segmento exige RUT desde el registro.
              </p>
            </div>
          )}
          {!requiereRut && (
            <div className="flex items-start gap-2 pt-1">
              <input
                id="declaraRutDiferido"
                name="declaraRutDiferido"
                type="checkbox"
                className={casilla}
              />
              <label htmlFor="declaraRutDiferido" className="text-sm text-tinta-2 leading-snug">
                Declaro que cargaré mi RUT en los próximos 30 días. Si no lo hago, mi perfil pasará a
                <b>pausado_por_rut</b>.
              </label>
            </div>
          )}
          <button type="submit" disabled={cargando} className={`mt-2 ${botonPrincipal}`}>
            {cargando ? "Enviando…" : "Enviar para revisión"}
          </button>
        </form>
      )}

      {paso === "otp" && (
        <div className="flex flex-col gap-3.5">
          <form onSubmit={handleEnviarOTP} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="whatsappOTP" className={etiqueta}>
                WhatsApp para recibir el código
              </label>
              <input
                id="whatsappOTP"
                name="whatsapp"
                type="tel"
                placeholder="300 000 0000"
                required
                className={campo}
              />
            </div>
            <button type="submit" disabled={cargando} className={botonPrincipal}>
              Enviar código
            </button>
          </form>

          <form onSubmit={handleVerificarOTP} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="codigo" className={etiqueta}>
                Código de 6 dígitos
              </label>
              <input
                id="codigo"
                name="codigo"
                type="text"
                maxLength={6}
                placeholder="000000"
                required
                className={campo}
              />
              <p className="text-xs text-gris">
                En desarrollo usa el código <b>123456</b> (se imprime en la consola del servidor).
              </p>
            </div>
            <button type="submit" disabled={cargando} className={botonPrincipal}>
              {cargando ? "Verificando…" : "Verificar y enviar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const casilla = "mt-0.5 size-5 flex-none accent-verde";
