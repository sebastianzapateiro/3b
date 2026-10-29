# Diagramas de arquitectura

Diagramas como código en [Mermaid](https://mermaid.js.org): se editan como texto y se dibujan solos.

**Cómo verlos**

- **GitHub:** abre este archivo en el repositorio; los dibuja directamente.
- **VS Code:** instala la extensión *Markdown Preview Mermaid Support* (`bierner.markdown-mermaid`) y abre la vista previa con `Ctrl+Shift+V`.
- **En el navegador:** copia un bloque en [mermaid.live](https://mermaid.live) para verlo, editarlo y exportarlo a PNG o SVG.
- **Imágenes SVG:** `pnpm docs:diagramas` regenera los SVG de `docs/diagramas/` (útiles para el Drive o presentaciones).

Convención: línea continua = existe hoy; **línea punteada = planeado, aún no construido**. Actualizado al 29 oct 2026.

---

## 1. Contexto e infraestructura

Quién usa el sistema y con qué servicios externos habla.

```mermaid
flowchart LR
  comprador(["Comprador"])
  proveedor(["Proveedor"])
  equipo(["Equipo LasTresB<br/>verificador · moderador · admin"])

  subgraph vercel["Vercel"]
    web["Next.js 16 · apps/web<br/>sitio público · /panel · /admin<br/>/api/v1 · /api/auth"]
  end

  subgraph supabase["Supabase"]
    pg[("Postgres<br/>~40 tablas")]
    privado[["Storage «privado»<br/>documentos"]]
    publico[["Storage «publico»<br/>fotos"]]
  end

  comprador --> web
  proveedor --> web
  equipo -->|"clave + 2FA"| web

  web -->|"Drizzle · pooler"| pg
  web -->|"service role: firma URLs"| privado
  web -.->|"pendiente: fotos del portafolio"| publico
  proveedor -->|"subida directa con URL firmada"| privado
  equipo -->|"lectura con URL firmada de 5 min"| privado

  web -->|"correos"| resend["Resend"]
  web -->|"ingreso"| google["Google OAuth"]
  web -->|"redirección wa.me"| wa["WhatsApp"]
  web -->|"solo producción"| ga["Google Analytics 4"]

  cf["Cloudflare<br/>DNS · CDN · WAF"] -.-> web
  otp["Proveedor de OTP<br/>por WhatsApp"] -.-> web
  n8n["n8n<br/>recordatorios · respaldos"] -.-> pg
  mobile["App Expo · fase 2"] -.->|"solo /api/v1"| web
```

## 2. Monorepo

Qué paquete depende de cuál. La app móvil nunca habla con la base: solo con `/api/v1`.

```mermaid
flowchart TB
  subgraph apps
    web["apps/web<br/>Next.js 16"]
    mobile["apps/mobile<br/>Expo · fase 2"]
  end
  subgraph packages
    db["packages/db<br/>esquema Drizzle · migraciones<br/>semillas · cifrado · scripts"]
    shared["packages/shared<br/>marca · localidades · categorías<br/>slug · WhatsApp · parámetros · días hábiles"]
    cfg["packages/config<br/>tsconfig base"]
  end

  web --> db
  web --> shared
  db --> shared
  mobile -.-> shared
  mobile -.->|"HTTP"| web
  web --> cfg
  db --> cfg
  shared --> cfg
```

## 3. Capas dentro de `apps/web`

Regla 7: la lógica de negocio vive en `lib/`. Las páginas, las Server Actions y las rutas `/api/v1` solo la llaman, para que la app móvil use exactamente lo mismo.

```mermaid
flowchart TB
  nav(["Navegador"]) --> proxy["src/proxy.ts<br/>sesión y consentimiento<br/>en zonas privadas"]
  proxy --> paginas["Páginas · Server Components"]
  proxy --> acciones["Server Actions<br/>formularios web"]
  movil(["App móvil · fase 2"]) -.-> api
  nav --> api["Rutas /api/v1<br/>y /api/auth"]

  paginas --> lib
  acciones --> lib
  api --> lib

  subgraph lib["src/lib · lógica de negocio"]
    direction LR
    negocio["busqueda · portafolio · resenas<br/>panel · documentos · moderacion<br/>cumplimiento · admin"]
    soporte["verificacion · auth · auditoria<br/>parametros · consentimientos<br/>correo · almacenamiento"]
  end

  lib --> dbpkg["@las3b/db<br/>Drizzle + cifrado"]
  dbpkg --> pg[("Postgres")]
  soporte --> storage[["Supabase Storage"]]
  soporte --> resend["Resend"]
```

## 4. Datos: cuentas, permisos y cumplimiento

El esquema completo está en `packages/db/src/schema/`. `auditoria` solo admite inserciones (regla 3) y los consentimientos apuntan a la versión exacta de cada política (regla 5).

```mermaid
erDiagram
  user ||--o{ session : "inicia"
  user ||--o{ account : "clave o Google"
  user ||--o| two_factor : "configura"
  user ||--o{ usuario_roles : "tiene"
  user ||--o{ consentimientos : "acepta"
  politicas ||--o{ consentimientos : "versión exacta"
  user ||--o{ auditoria : "actor"
  user ||--o{ solicitudes_datos : "Ley 1581"

  user {
    text id PK
    text email UK
    bool two_factor_enabled
    timestamp suspendido_hasta
  }
  usuario_roles {
    text rol "comprador · proveedor · verificador · moderador · admin"
  }
  consentimientos {
    text ip
    timestamp aceptado_en
  }
  auditoria {
    text accion
    jsonb metadatos
    text ip "solo inserción"
  }
  configuracion {
    text clave PK
    jsonb valor "plazos, límites y exigencia de 2FA"
  }
  festivos {
    date fecha PK "días hábiles"
  }
```

## 5. Datos: proveedores y catálogo

Los campos marcados como privados nunca salen en el portafolio ni en la API pública (regla 1).

```mermaid
erDiagram
  user ||--o| proveedores : "es"
  proveedores ||--o{ proveedor_categorias : ""
  categorias ||--o{ proveedor_categorias : ""
  categorias ||--o{ categorias : "subcategorías"
  categorias ||--o{ terminos_busqueda : "sinónimos"
  proveedores ||--o{ proveedor_localidades : "cubre"
  localidades ||--o{ proveedor_localidades : ""
  localidades ||--o{ barrios : ""
  proveedores ||--o{ servicios_proveedor : "precios desde"
  proveedores ||--o{ portafolio_fotos : ""
  proveedores ||--o{ documentos : "bucket privado"
  proveedores ||--o{ slugs_historial : "redirección 301"
  proveedores ||--o{ proveedor_insignias : ""
  insignias ||--o{ proveedor_insignias : ""

  proveedores {
    uuid id PK
    text slug UK
    enum estado
    enum segmento
    text documento_cifrado "privado · AES-256-GCM"
    text documento_huella "privado · HMAC"
    text direccion_notificaciones "privado"
    date fecha_nacimiento "privado"
    date rut_fecha_limite
    real promedio "caché de reputación"
  }
  categorias {
    int id PK
    bool exige_rut_desde_alta
    bool exige_matricula
    bool exige_insignia_menores
  }
  documentos {
    uuid id PK
    enum tipo
    text ruta_privada
    text mime "tipo real validado"
    int bytes
  }
```

## 6. Datos: contacto, reseñas y reclamos

Una reseña por contacto, y solo si hubo un clic previo a WhatsApp (regla 4).

```mermaid
erDiagram
  proveedores ||--o{ contactos : "clic a WhatsApp"
  user ||--o{ contactos : "comprador o anónimo"
  contactos ||--o| resenas : "una por contacto"
  resenas ||--o| respuestas_resena : "una respuesta"
  contactos ||--o| servicios : "código de llegada"
  user ||--o{ reportes : "reporta"
  user ||--o{ acciones_moderacion : "modera"
  proveedores ||--o{ reclamos : "art. 53"

  contactos {
    uuid id PK
    text origen "perfil · busqueda · qr · redes"
    text anonimo_id "cookie si no hay sesión"
  }
  resenas {
    uuid id PK
    int puntualidad
    int calidad
    int calidad_precio
    int cumplimiento
  }
  reportes {
    enum tipo_objeto "reseña, foto, perfil…"
    text objeto_id "genérico, sin llave foránea"
    bool resuelto
  }
  reclamos {
    uuid id PK
    date fecha_limite "días hábiles"
  }
```

## 7. Estados del proveedor

Solo `aprobado` y `en_revision` aparecen en la búsqueda (regla 6). `pausado` muestra «no disponible»; `suspendido` y `rechazado` dan 404.

```mermaid
stateDiagram-v2
  [*] --> borrador: alta paso 1
  borrador --> pendiente: envía a revisión<br/>con documentos obligatorios
  pendiente --> aprobado: verificador aprueba
  pendiente --> rechazado: con motivo
  aprobado --> pausado: el proveedor pausa
  pausado --> aprobado: el proveedor reanuda
  aprobado --> pausado_por_rut: venció el plazo de RUT
  pausado_por_rut --> aprobado: carga el RUT
  aprobado --> en_revision: reseñas bajas sin respuesta
  en_revision --> aprobado
  en_revision --> suspendido
  aprobado --> suspendido: el equipo suspende
```

## 8. Flujo: buscar, contactar y calificar

```mermaid
sequenceDiagram
  autonumber
  actor C as Comprador
  participant W as Web (Next.js)
  participant L as lib/busqueda · lib/resenas
  participant DB as Postgres
  participant WA as WhatsApp

  C->>W: /buscar?q=plomero&localidad=suba
  W->>L: buscarProveedores()
  L->>DB: sinónimos + estado aprobado/en_revision
  DB-->>W: tarjetas ordenadas
  C->>W: «Escribir por WhatsApp»
  W->>DB: GET /api/v1/contactos/ir registra el clic<br/>(cookie anónima si no hay sesión)
  W-->>C: 302 a wa.me con mensaje prellenado
  C->>WA: conversa y acuerda directo con el proveedor
  C->>W: /[slug]/calificar
  W->>L: ¿hay un contacto previo sin reseña?
  L->>DB: una reseña por contacto (regla 4)
  W-->>C: reseña publicada, promedio recalculado
```

## 9. Flujo: subida de un documento privado

El archivo nunca pasa por Vercel (límite de 4,5 MB por petición): va directo al bucket con una URL de un solo uso, y el servidor lo valida antes de registrarlo.

```mermaid
sequenceDiagram
  autonumber
  actor P as Proveedor
  participant W as Web (Next.js)
  participant L as lib/documentos
  participant S as Storage «privado»
  participant DB as Postgres

  P->>W: elige archivo (foto o PDF)
  W->>L: POST /api/v1/yo/documentos/subida {tipo, mime, bytes}
  L->>L: valida tipo, formato y tamaño
  L->>S: firma URL de subida con nombre aleatorio
  L-->>P: { camino, url }
  P->>S: PUT del archivo (un solo uso)
  P->>W: POST /api/v1/yo/documentos {tipo, camino}
  W->>L: confirmarSubida()
  L->>S: lee los primeros bytes y el tamaño
  alt tipo real válido
    L->>DB: inserta en documentos y reemplaza el anterior
    L-->>P: cargado
  else no es JPG, PNG, HEIC o PDF
    L->>S: borra el archivo
    L-->>P: error
  end

  Note over W,DB: Revisión: el equipo abre /admin/documentos/[id]<br/>→ registro en auditoria → URL firmada de 5 min
```

## 10. Flujo: ingreso del equipo al backoffice

```mermaid
sequenceDiagram
  autonumber
  actor E as Persona del equipo
  participant W as /ingreso o /admin/ingresar
  participant BA as Better Auth
  participant V as lib/verificacion
  participant DB as Postgres

  E->>W: correo + clave
  W->>BA: signIn.email
  alt tiene 2FA activo
    BA-->>W: twoFactorRedirect
    E->>W: código de la app (o código de respaldo)
    W->>BA: verifyTotp / verifyBackupCode
  else sin 2FA y su rol lo exige (admin siempre)
    W->>BA: twoFactor.enable → QR
    E->>W: escanea y confirma el código
  else sin 2FA y su rol no lo exige
    Note over W: entra solo con clave
  end
  BA-->>W: sesión (cookie httpOnly)
  E->>W: abre /admin
  W->>V: exigirBackoffice()
  V->>DB: roles + exigencia de 2FA por rol
  alt sesión de más de 8 h
    V->>DB: cierra la sesión
    V-->>E: /admin/ingresar?vencida=1
  else válida
    V-->>E: panel del backoffice
  end
```
