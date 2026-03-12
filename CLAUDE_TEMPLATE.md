# CLAUDE.md — [Nombre del Proyecto]

## Stack
- Framework: [Next.js 14 / Node.js / etc.]
- DB: [Supabase / PostgreSQL / etc.]
- Deploy: [Railway / Vercel / etc.]
- Versión Node: [v20+]

## Estructura
[Gemini genera esto del análisis del repo]

## Módulos
[Lista de módulos con estado: ✅ completo, 🚧 en progreso, 📋 pendiente]

## Variables de Entorno
[Lista de env vars necesarias sin valores reales]

## Comandos
- Dev: [npm run dev]
- Build: [npm run build]
- Deploy: [git push / railway up]

## Reglas de Código
Estas reglas son obligatorias para todos los cambios:
- SoC: UI es "tonta" (solo muestra), Lógica es "ciega" (no sabe cómo se muestra)
- Inmutabilidad por defecto. No mutar datos a menos que sea estrictamente necesario
- Early Return: verificar condiciones negativas primero, camino feliz al final
- Chesterton's Fence: antes de borrar código existente, explicar POR QUÉ existía
- Tokens de diseño: nunca hardcodear colores ni spacing. Usar variables semánticas
- Atomicidad: cada cambio debe ser completo y funcional. Nunca dejar TODOs críticos
- Wrappers para dependencias externas. Si se cambia la librería, solo se edita el wrapper

## Contexto de Negocio
[Contexto relevante del dominio para que Claude Code entienda el "por qué"]

## Decisiones Técnicas
[Decisiones tomadas en brainstorm con justificación]