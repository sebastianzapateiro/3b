# apps/mobile (fase 2)

App iOS y Android con **React Native + Expo**, según "Infraestructura y estrategia móvil".

Se crea cuando la web tenga tracción:

```bash
cd apps && pnpm create expo-app mobile --template
```

Reglas ya decididas:

- Consume solo la API `/api/v1` (nunca la base directo).
- Tokens de acceso cortos + refresh rotativo en Keychain/Keystore.
- Comparte tipos y validaciones desde `@las3b/shared`.
- Enlaces universales: `lastresb.com.co/<slug>` abre la app si está instalada.
- Debe permitir eliminar la cuenta (Apple 5.1.1) y ofrecer "Continuar con Apple" si hay Google (Apple 4.8).
