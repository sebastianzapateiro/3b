/**
 * P6 · Textos legales versionados. Fuente única: las páginas públicas los muestran y la semilla (`pnpm db:seed`)
 * los guarda en `politicas`, de donde se toma la versión que se registra en cada consentimiento (RF-19).
 * Al cambiar un texto, sube `version`: los consentimientos anteriores conservan la versión que se aceptó.
 *
 * ESTADO: borradores redactados para revisión de un abogado. `pendientes` lista lo que falta por completar.
 */
export type SeccionLegal = { titulo: string; parrafos?: string[]; lista?: string[] };

export type TextoLegal = {
  /** Valor del enum `tipo_politica`; ausente si el texto no requiere aceptación (p. ej. el procedimiento de retiro). */
  tipo?: "terminos_compradores" | "terminos_proveedores" | "tratamiento_datos" | "autorizacion_ley_1918";
  version: string;
  vigenteDesde: string;
  titulo: string;
  introduccion?: string;
  secciones: SeccionLegal[];
  /** Datos o decisiones que debe completar o confirmar el equipo/abogado antes de darlo por definitivo. */
  pendientes: string[];
};

/** Datos del responsable del tratamiento. Completar con los de la sociedad antes de publicar la versión definitiva. */
export const RESPONSABLE = {
  razonSocial: "[razón social por confirmar]",
  nit: "[NIT por confirmar]",
  domicilio: "Bogotá D.C., Colombia",
  correoDatos: "[correo de datos personales por confirmar]",
} as const;

export const TRATAMIENTO_DATOS: TextoLegal = {
  tipo: "tratamiento_datos",
  version: "2.0",
  vigenteDesde: "2026-10-28",
  titulo: "Política de tratamiento de datos personales",
  introduccion: "Esta política explica qué datos personales trata Las 3B, para qué, quién los recibe y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012 y sus normas reglamentarias.",
  pendientes: ["Razón social, NIT y correo de datos personales del responsable.", "Revisión de un abogado (finalidades, transferencias y plazos de conservación).", "Definir si aplica la inscripción en el Registro Nacional de Bases de Datos (SIC)."],
  secciones: [
    {
      titulo: "1. Responsable del tratamiento",
      parrafos: [`${RESPONSABLE.razonSocial}, NIT ${RESPONSABLE.nit}, domicilio en ${RESPONSABLE.domicilio}. Canal para consultas y reclamos sobre datos personales: ${RESPONSABLE.correoDatos}, o la sección «Privacidad» de tu cuenta en Mi cuenta.`],
    },
    {
      titulo: "2. Qué datos tratamos",
      lista: [
        "Cuentas de compradores: nombre, correo, celular (opcional), declaración de mayoría de edad, contactos que haces con proveedores y las reseñas que publicas.",
        "Proveedores: nombre público y de identificación, documento de identidad (cifrado), fecha de nacimiento, dirección de notificaciones, WhatsApp, RUT, matrícula o certificaciones, fotos de trabajos, presentación, servicios, precios y localidades.",
        "Proveedores en categorías con menores: la autorización firmada y el resultado de la consulta del registro de inhabilidades (Ley 1918 de 2018).",
        "Datos técnicos: dirección IP y dispositivo en los consentimientos y en el registro de auditoría; cookies según la política de cookies.",
      ],
    },
    {
      titulo: "3. Para qué los usamos (finalidades)",
      lista: [
        "Crear y administrar tu cuenta y tu sesión.",
        "Verificar identidad y mayoría de edad de los proveedores, y publicar su portafolio.",
        "Facilitar que compradores y proveedores se contacten por WhatsApp, y permitir reseñas ligadas a un contacto real.",
        "Prevenir fraude, suplantación y abusos; mantener la seguridad y la auditoría del sistema.",
        "Atender reclamos, solicitudes de datos y requerimientos de autoridades.",
        "Medir de forma agregada el uso del sitio, solo si aceptas las cookies de analítica.",
      ],
    },
    {
      titulo: "4. Qué es público y qué es privado",
      parrafos: [
        "Es público en el portafolio del proveedor: nombre público, presentación, servicios, precios orientativos, localidades, fotos de trabajos, insignias y reseñas. El número de WhatsApp se usa para el botón de contacto.",
        "Nunca se muestran en público ni en la API pública: documento de identidad, dirección de notificaciones, fecha de nacimiento, RUT y los archivos de verificación. Solo los ve el equipo de verificación autorizado y cada apertura queda registrada.",
      ],
    },
    {
      titulo: "5. Datos sensibles y de menores",
      parrafos: [
        "La información sobre antecedentes de la Ley 1918 es un dato sensible. Solo la tratamos si el proveedor lo autoriza de forma expresa, es voluntario y es necesario únicamente para otorgar la insignia «Apto para menores». Responder o no es opcional, pero sin ello no se puede publicar en categorías con menores.",
        "Las 3B está dirigida a mayores de 18 años y no recolecta datos de menores de edad.",
      ],
    },
    {
      titulo: "6. Autorización",
      parrafos: ["Tu autorización se pide con casillas que nunca vienen marcadas. Guardamos la versión de la política que aceptaste, la fecha y la dirección IP. Puedes revocarla o pedir la supresión de tus datos cuando no exista un deber legal o contractual de conservarlos."],
    },
    {
      titulo: "7. Tus derechos",
      lista: [
        "Conocer, actualizar y rectificar tus datos.",
        "Solicitar prueba de la autorización y ser informado del uso que se les da.",
        "Revocar la autorización y pedir la supresión cuando proceda.",
        "Acceder gratuitamente a tus datos.",
        "Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), una vez agotado el trámite ante nosotros.",
      ],
    },
    {
      titulo: "8. Cómo ejercerlos y en qué plazo",
      parrafos: [
        "Puedes hacer consultas, correcciones, supresiones o pedir una copia desde Mi cuenta > Privacidad, o escribiendo al canal del punto 1. Respondemos las consultas en máximo 10 días hábiles (prorrogables 5 más, con aviso de los motivos) y los reclamos en máximo 15 días hábiles (prorrogables 8 más).",
      ],
    },
    {
      titulo: "9. Encargados y transferencias",
      parrafos: [
        "Para operar usamos proveedores tecnológicos que tratan datos por nuestra cuenta: Supabase (base de datos y almacenamiento), Vercel (alojamiento del sitio) y Google (inicio de sesión con Google y, con tu permiso, Analytics). Sus servidores pueden estar fuera de Colombia; exigimos condiciones de seguridad y confidencialidad adecuadas. No vendemos tus datos.",
      ],
    },
    {
      titulo: "10. Seguridad",
      parrafos: ["Cifrado del documento de identidad, acceso a archivos privados solo mediante enlaces firmados de corta duración, segundo factor obligatorio para el equipo, y un registro de auditoría de solo inserción."],
    },
    {
      titulo: "11. Conservación",
      parrafos: ["Conservamos los datos mientras tengas cuenta y el tiempo necesario para cumplir obligaciones legales. Si eliminas tu cuenta, las reseñas que publicaste se conservan bloqueadas durante 5 años. El registro de auditoría se conserva por seguridad."],
    },
    {
      titulo: "12. Cambios",
      parrafos: ["Si esta política cambia, publicaremos la nueva versión aquí y, cuando el cambio sea sustancial, te pediremos aceptarla de nuevo."],
    },
  ],
};

export const TERMINOS_PROVEEDORES: TextoLegal = {
  tipo: "terminos_proveedores",
  version: "1.0",
  vigenteDesde: "2026-10-28",
  titulo: "Términos de uso para proveedores",
  introduccion: "Estos términos aplican a quien publica su portafolio en Las 3B para ofrecer servicios u oficios. Al registrarte los aceptas; complementan los términos de uso generales y la política de tratamiento de datos.",
  pendientes: ["Razón social y datos del titular del portal.", "Revisión de un abogado (licencia de contenido, exoneración de responsabilidad y régimen de suspensión).", "Confirmar el plazo para presentar el RUT y los descargos antes de una suspensión."],
  secciones: [
    { titulo: "1. Qué es Las 3B", parrafos: ["Las 3B es un portal de contacto: muestra tu portafolio y permite que las personas te escriban por WhatsApp. No es tu empleador, mandatario, agente ni socio, no presta los servicios, no interviene en los pagos y no garantiza el resultado de ningún trabajo."] },
    { titulo: "2. Quién puede registrarse", lista: ["Personas mayores de 18 años con capacidad legal, o empresas legalmente constituidas.", "Una persona o empresa, un perfil.", "La información que entregas debe ser veraz y estar actualizada. Responderás por suplantación o datos falsos."] },
    { titulo: "3. Verificación e insignias", parrafos: ["Revisamos tu documento, tu mayoría de edad y tu WhatsApp antes de publicarte. Algunos servicios exigen RUT desde el alta; en otros tienes un plazo para presentarlo y, si vence, el perfil se pausa. Para servicios con menores se exige la autorización y verificación de la Ley 1918. Las insignias indican qué se revisó; no son una garantía de calidad ni de idoneidad de tu trabajo."] },
    { titulo: "4. Tu contenido y la licencia que nos das", parrafos: ["Tus fotos, textos y precios siguen siendo tuyos. Nos autorizas, de forma no exclusiva, gratuita y mientras tengas perfil, a mostrarlos en el portal y a compartirlos en redes sociales y buscadores para promocionar tu perfil. Declaras que tienes los derechos sobre lo que subes y que no infringe derechos de terceros, no muestra a menores ni incluye datos personales ajenos."], lista: ["Si crees que un contenido infringe tus derechos, usa el procedimiento de retiro de contenido.", "Podemos ocultar contenido que incumpla estos términos."] },
    { titulo: "5. Conducta prohibida", lista: ["Suplantar a otra persona o empresa.", "Publicar precios o servicios engañosos o ilegales.", "Pedir, ofrecer o comprar reseñas, o intentar borrarlas o alterarlas.", "Acosar, discriminar o amenazar a clientes o a otros proveedores.", "Usar los datos de contacto de los clientes para fines distintos a prestar el servicio solicitado."] },
    { titulo: "6. Reseñas", parrafos: ["Las reseñas provienen de personas que te contactaron desde Las 3B. No puedes borrarlas ni editarlas; puedes responder cada una una sola vez y reportar las que incumplan la política de reseñas."] },
    { titulo: "7. Precios y pagos", parrafos: ["Acuerdas precio, fecha y garantía directamente con tus clientes. Las 3B no cobra comisiones ni recibe dinero por tus servicios. Los precios del portafolio son orientativos. Si en el futuro se ofrecen servicios pagos, se avisará con anticipación y requerirán tu aceptación."] },
    { titulo: "8. Tus obligaciones como prestador", parrafos: ["Eres el único responsable de la calidad y la garantía de tu trabajo, de tus obligaciones tributarias, de seguridad social y laborales, y de contar con los permisos, matrículas o licencias que tu oficio exija."] },
    { titulo: "9. Datos de tus clientes", parrafos: ["Los datos que un cliente te comparte para contratarte los tratas tú como responsable, conforme a la Ley 1581 de 2012. Úsalos solo para prestar el servicio."] },
    { titulo: "10. Reclamos de consumidores", parrafos: ["Si un consumidor presenta un reclamo sobre tu servicio, Las 3B podrá recibirlo, trasladártelo y entregarle tus datos de identificación y contacto cuando la ley lo exija (Ley 1480 de 2011). Aceptas esto al registrarte."] },
    { titulo: "11. Suspensión y terminación", parrafos: ["Podemos pausar o suspender tu perfil si incumples estos términos. Normalmente te avisaremos el motivo y tendrás 5 días hábiles para dar tu versión. En casos de fraude, amenazas o riesgo para las personas, la suspensión puede ser inmediata y provisional. Puedes pausar o cerrar tu perfil cuando quieras desde tu panel."] },
    { titulo: "12. Exoneración de responsabilidad", parrafos: ["Las 3B queda exonerada de responsabilidad por la prestación de tus servicios, por defectos, riesgos, garantías o incumplimientos ocurridos tras el contacto. La relación contractual y la responsabilidad civil son entre tú y tu cliente."] },
    { titulo: "13. Cambios y ley aplicable", parrafos: ["Podemos actualizar estos términos y te avisaremos; si continúas usando el portal después del aviso, se entiende que los aceptas, salvo que la ley exija una nueva autorización. Se rigen por las leyes de Colombia y los jueces de Bogotá D.C."] },
  ],
};

export const AUTORIZACION_LEY_1918: TextoLegal = {
  tipo: "autorizacion_ley_1918",
  version: "1.0",
  vigenteDesde: "2026-10-28",
  titulo: "Autorización para consultar antecedentes (Ley 1918 de 2018)",
  pendientes: ["Revisión de un abogado: finalidad, dato sensible, plazo de conservación del soporte y fuente de la consulta."],
  secciones: [
    {
      titulo: "Autorización",
      parrafos: [
        "Autorizo de forma libre, previa, expresa e informada a Las 3B para consultar el registro de inhabilidades por delitos sexuales contra menores de edad con mis datos de identificación, únicamente para decidir si puedo recibir la insignia «Apto para menores» y aparecer en categorías con menores.",
        "Sé que es un dato sensible, que responder es voluntario, que el resultado se registra con su soporte, que la insignia dura 6 meses y que puedo revocar esta autorización, lo que implica retirarme de esas categorías.",
      ],
    },
  ],
};

export const RETIRO_CONTENIDO: TextoLegal = {
  version: "1.0",
  vigenteDesde: "2026-10-28",
  titulo: "Retiro de contenido y derechos de autor",
  introduccion: "Si encuentras en Las 3B una foto, texto u otro contenido que infringe tus derechos o que no debería estar publicado, puedes pedir su revisión y retiro.",
  pendientes: ["Revisión de un abogado: procedimiento de notificación y contranotificación (Ley 1915 de 2018), plazos y responsabilidad por reportes de mala fe."],
  secciones: [
    { titulo: "1. Qué puedes reportar", lista: ["Fotos o textos copiados de tu obra sin autorización.", "Contenido que muestra a menores o publica datos personales sin permiso.", "Perfiles que suplantan tu identidad o tu empresa.", "Contenido ilegal o que incumple los términos de uso."] },
    { titulo: "2. Qué debe incluir tu solicitud", lista: ["Enlace exacto del contenido en Las 3B.", "Qué derecho se infringe y, si es el caso, la obra original.", "Tu nombre y un correo para contactarte.", "La declaración de que actúas de buena fe y de que la información es verdadera."] },
    { titulo: "3. Qué pasa después", parrafos: ["Revisamos la solicitud y, si el contenido incumple, lo ocultamos y avisamos al proveedor, que puede responder y aportar pruebas de que tiene los derechos. Si hay duda razonable, el contenido puede quedar oculto mientras se aclara. Cuando se trate de un conflicto que no podamos resolver, la decisión final corresponde a las autoridades competentes."] },
    { titulo: "4. Reportes de mala fe", parrafos: ["Presentar reportes falsos o abusivos para dañar a otra persona incumple los términos de uso y puede llevar a medidas sobre la cuenta de quien los presenta."] },
    { titulo: "5. Otras formas de reportar", parrafos: ["Para reportar una reseña, un perfil o una conducta, usa el botón «Reportar este perfil» o la página de reclamos."] },
  ],
};

/** Texto plano en Markdown, para guardar en `politicas.contenido_md`. */
export function aMarkdown(t: TextoLegal): string {
  const partes = [`# ${t.titulo}`, `**Versión ${t.version} — Vigencia: ${t.vigenteDesde}.**`];
  if (t.introduccion) partes.push(t.introduccion);
  for (const s of t.secciones) {
    partes.push(`## ${s.titulo}`);
    for (const p of s.parrafos ?? []) partes.push(p);
    if (s.lista) partes.push(s.lista.map((i) => `- ${i}`).join("\n"));
  }
  return partes.join("\n\n");
}

/** Textos que se guardan en `politicas` (los que requieren aceptación). */
export const POLITICAS_VERSIONADAS = [TRATAMIENTO_DATOS, TERMINOS_PROVEEDORES, AUTORIZACION_LEY_1918] as const;
