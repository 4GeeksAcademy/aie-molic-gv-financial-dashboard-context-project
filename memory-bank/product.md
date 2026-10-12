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
