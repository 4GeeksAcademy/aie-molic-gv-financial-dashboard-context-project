# Resumen del producto

## Overview

Dashboard web de demostración para consultar métricas financieras. La pantalla presenta ingresos, gastos, beneficio y margen de beneficio, junto con gráficos mensuales de ingresos frente a gastos y del margen.

El frontend solicita `GET /api/metrics` al backend, recibe movimientos financieros y calcula en el cliente los KPI y agregados mensuales. El backend proporciona movimientos generados para demostración. El repositorio no configura persistencia en una base de datos.

## Stack tecnológico

- **Lenguajes:** TypeScript en el frontend; Python en el backend.
- **Frameworks y runtime:** React 19, Vite y FastAPI; Uvicorn sirve la API. Los modelos y validaciones de datos backend usan Pydantic.
- **Interfaz y gráficos:** Tailwind CSS, Recharts y Lucide React.
- **Dependencias frontend relevantes:** `react`, `react-dom`, `vite`, `typescript`, `recharts`, `lucide-react`, `@tailwindcss/vite` y `vitest`.
- **Pruebas:** Vitest para utilidades frontend; pytest y FastAPI `TestClient` para rutas backend.
- **Infraestructura y desarrollo:** Docker Compose coordina los servicios `frontend` y `backend`. El Dockerfile frontend usa Node 24 Alpine e instala paquetes npm; el backend usa Python 3.13 slim, instala `backend/requirements.txt` y ejecuta Uvicorn con `debugpy`.

## Contrato y cálculos

Cada movimiento contiene fecha (`create_date`), importe (`amount`), tipo de operación (`income` o `outcome`), categoría y tipo de negocio (`B2B` o `B2C`). Las categorías admitidas son `suppliers`, `sales`, `operational`, `administrative` y `others`.

El beneficio se calcula como ingresos menos gastos. El margen se calcula como beneficio dividido por ingresos; si los ingresos son cero, el cálculo devuelve cero.

## Estado actual verificado

- **Frontend en Docker:** `http://localhost:5173/` respondió HTTP 200 en la última comprobación registrada.
- **Pruebas:** los 5 tests de utilidades frontend pasaron dentro del contenedor frontend. La suite backend pasó con 16 tests dentro del contenedor backend; pytest informó una advertencia deprecada de Starlette/httpx.
- **Integración API:** `/api/metrics` expiró en la última prueba con límite de cinco segundos. La causa raíz sigue sin identificarse; la respuesta HTTP 200 de la página no confirma que se carguen los movimientos.
- **Entorno local de Codespaces:** el `node_modules` local está vacío y pertenece a `root`; `npm ci` falló con `EACCES`, `npm test` no encontró `vitest` y `npm run build` no encontró `tsc`. No se ha confirmado un build frontend exitoso en el host.

## Límites conocidos

- El endpoint de movimientos genera 30 registros por cada uno de 12 meses y usa la semilla `42` en las rutas actuales. Son datos simulados, no transacciones reales ni registros persistidos.
- La pantalla actual consume `GET /api/metrics`. El backend también define rutas de resumen y otros análisis, pero no se debe asumir que están conectadas a la interfaz.
- El encabezado de la pantalla muestra el período 2024, mientras que las fechas generadas dependen de la fecha de ejecución. El rótulo no demuestra que los datos correspondan a 2024.
- La agrupación mensual del frontend usa getters locales de fecha. El repositorio no especifica si la semántica contable esperada es UTC o una zona horaria local.
- El código confirma qué métricas y datos presenta la aplicación, pero no establece una audiencia o perfil de usuario concreto.

## Prioridades técnicas pendientes

Estas prioridades se derivan de fallos y decisiones sin resolver en el repositorio; no son un roadmap de funcionalidades:

1. Diagnosticar la comunicación de `/api/metrics` entre frontend y backend; no atribuir el timeout a una causa hasta verificarla.
2. Si se necesita desarrollo TypeScript en el host, resolver primero la propiedad/permisos de `frontend/node_modules`, instalar las dependencias y volver a ejecutar los tests y el build.
3. Confirmar los requisitos de período y zona horaria antes de cambiar el rótulo 2024 o la agrupación mensual.

No se han verificado usuarios objetivo, persistencia de datos reales ni funcionalidades de producto adicionales a las descritas en el código.

## Ejercicio Agent Skills (2026-10-14 a 2026-10-15)

### Skills instaladas y aplicadas

| Skill | Estado y trabajo asociado |
|---|---|
| `accessibility` (comunitaria, `addyosmani/web-quality-skills`) | Instalada en `.agents/skills/accessibility/`; aplicada en `f0d9112`. El frontend anuncia carga y errores, marca las secciones ocupadas, ofrece tablas ocultas visualmente como alternativa a los gráficos y respeta `prefers-reduced-motion`. |
| `frontend-design` (comunitaria, `anthropics/skills`) | Instalada en `.agents/skills/frontend-design/`; aplicada en `42bf19b`. Se deriva el período de los datos, se cargó IBM Plex Sans, se aclararon etiquetas y se redujo el peso visual de las tarjetas KPI. |
| `seo-audit` (comunitaria, `coreyhaines31/marketingskills`) | Instalada en `.agents/skills/seo-audit/`; aplicada en `a4af555`. Se añadió título y descripción HTML, se alineó el H1 con el tema y `CardTitle` usa encabezados H2. |
| `vercel-react-best-practices` (comunitaria, `vercel-labs/agent-skills`) | Instalada en `.agents/skills/vercel-react-best-practices/`; aplicada en `024c273`. Los gráficos se cargan con `React.lazy` y `Suspense`. La instalación de SWR se intentó, pero falló por `EAI_AGAIN` al resolver `registry.npmjs.org`; SWR no está instalado ni se considera implementado. |
| `financial-contract-change` (interna) | Incorporada en `.agents/skills/financial-contract-change/SKILL.md` en `3ec741e` y aplicada en el mismo commit. El frontend valida el payload de movimientos antes de tratarlo como `FinancialMovement`. |

Las cuatro skills comunitarias figuran en `skills-lock.json`. La skill financiera es interna y no forma parte de ese lockfile. No se incorporó una skill de diagnóstico Compose en el estado actual de esta rama.

### Cambios frontend del ejercicio

- `frontend/src/App.tsx`: carga diferida de los gráficos con fallback accesible; período derivado de los meses disponibles; validación del JSON de `/api/metrics` antes de procesarlo.
- `frontend/src/lib/financial-types.ts`: type guards para la forma del movimiento, fecha ISO de forma `YYYY-MM-DD`, importe numérico finito y enums admitidos.
- `frontend/src/lib/financial-utils.test.ts`: pruebas del contrato válido/inválido y de importes fraccionarios.
- `frontend/src/components/dashboard/dashboard-header.tsx`, `kpi-card.tsx`, `kpi-row.tsx` e `income-outcome-chart.tsx`: período y copy del dashboard, etiquetas en estilo oración y contenido de gráficos coherente.
- `frontend/src/components/dashboard/income-outcome-chart.tsx` y `profit-percent-chart.tsx`: tablas accesibles con valores mensuales.
- `frontend/src/components/ui/card.tsx` y `skeleton.tsx`: títulos de tarjeta como H2 y pulso reducido para usuarios que lo solicitan.
- `frontend/index.html` y `frontend/src/index.css`: metadatos SEO, carga de IBM Plex Sans y configuración de la fuente.

No hubo cambios backend asociados a este ejercicio. La validación runtime frontend comprueba la forma conocida del payload, pero no genera tipos desde OpenAPI ni detecta automáticamente una futura divergencia del modelo Pydantic.

### Verificaciones del ejercicio

- `docker compose exec -T frontend npm test`: **8 tests pasados** en `financial-utils.test.ts`.
- `docker compose exec -T frontend npm run build`: completó correctamente. La salida final separó el entry principal (~188.31 kB, gzip ~60.03 kB) del chunk `LineChart` (~342.30 kB, gzip ~100.46 kB). Se observó un aviso de tiempo del plugin `vite-resolve`; no impidió el build.
- `docker compose exec -T frontend npm run lint`: completó correctamente.
- `git diff --check -- frontend`: completó sin errores.
- Diagnósticos del editor para los archivos frontend tocados: sin errores.
- Tras los cambios SEO, el HTML servido localmente expuso el título y la meta descripción configurados. Esta comprobación no equivale a una auditoría SEO del dominio de producción.
- Los commits `f53e32a`, `f0d9112`, `42bf19b`, `a4af555`, `024c273` y `3ec741e` están en `feature/agent-skills`; al revisar la rama, el árbol de trabajo estaba limpio y `origin/feature/agent-skills` era su upstream.

No se ejecutaron pytest como parte de los cambios Agent Skills, porque no se modificó código backend. Tampoco se ejecutaron Lighthouse/axe ni pruebas manuales de teclado, lector de pantalla, zoom o movimiento reducido. No se validó SEO en Search Console ni contra un dominio público. La integración `/api/metrics` no se volvió a comprobar en este ejercicio: el timeout descrito arriba sigue siendo un antecedente histórico y su estado actual y causa raíz no están confirmados.

### Estado y próximos pasos

- La pantalla actual sigue consumiendo `GET /api/metrics`; los endpoints agregados backend no se conectaron a la UI en estos commits.
- El code splitting reduce el entry inicial, pero el chunk de gráficos sigue pesando ~342 kB sin comprimir; medir LCP/INP en el entorno desplegado antes de priorizar más optimizaciones.
- Si se requiere deduplicación/caché con SWR, restaurar acceso al registro npm, instalar la dependencia dentro de `frontend/` y validar de nuevo tests, lint y build.
- Ejecutar una auditoría de accesibilidad renderizada y pruebas manuales; no inferir conformidad WCAG de los cambios de markup o del build.
- Si el sitio debe posicionarse públicamente, confirmar dominio, público y objetivo de indexación antes de añadir canonical, `robots.txt` o sitemap; no hay Search Console verificado.
- Mantener pendiente la decisión de negocio sobre zona horaria y precisión/redondeo monetario. No cambiar esas semánticas sin aprobación y tests acordes.
- Si se necesita garantía automática frontend/backend, valorar una prueba de contrato basada en OpenAPI o generación de tipos; la validación actual solo protege el payload en runtime en el frontend.
