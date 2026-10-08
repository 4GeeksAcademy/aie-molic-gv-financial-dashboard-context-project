# Instrucciones para agentes

## Proyecto

Dashboard de métricas financieras con una aplicación React en el frontend y una API FastAPI en el backend. La interfaz muestra ingresos, gastos, beneficio, margen y gráficos mensuales. La API genera datos de demostración; el repositorio no configura persistencia en base de datos.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS y Recharts.
- Backend: Python, FastAPI y Uvicorn.
- Pruebas frontend: Vitest.
- Pruebas backend: pytest y FastAPI `TestClient`.
- Ejecución integrada: Docker Compose.

## Estructura

- `frontend/src/components/dashboard`: componentes de la pantalla financiera.
- `frontend/src/components/ui`: componentes de interfaz reutilizables.
- `frontend/src/lib`: tipos, utilidades y pruebas de utilidades frontend.
- `frontend/src/App.tsx`: composición del dashboard, carga de datos y estados de pantalla.
- `backend/app/main.py`: creación de FastAPI y registro del router.
- `backend/app/routes.py`: modelos, generación y transformación de movimientos y endpoints.
- `backend/tests`: pruebas de rutas y lógica backend.
- `docker-compose.yml`: servicios frontend y backend y sus montajes.

## Comandos

Desde la raíz, el comando de ejecución documentado es:

```bash
docker compose up --build
```

Desde `frontend/`, `package.json` define `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run test:watch` y `npm run test:coverage`.

El backend incluye pytest en `backend/requirements.txt` y sus pruebas viven en `backend/tests`; el repositorio no declara un script backend equivalente en un `package.json` o en el README. Confirma el entorno y el comando de ejecución aplicable antes de documentarlo como comando oficial.

## Convenciones

- En los componentes revisados, los archivos usan kebab-case, los componentes exportados PascalCase y las props se describen mediante interfaces TypeScript.
- Mantén los componentes del dashboard en `components/dashboard` y reserva `components/ui` para piezas reutilizables, siguiendo la organización existente.
- Al extender las pruebas frontend, sigue el patrón de Vitest con fixtures tipados y casos con valores esperados. Para rutas backend, sigue el uso de `TestClient` y aserciones sobre status y payload.
- No impongas una convención global de comillas o punto y coma: el código frontend existente no es uniforme en esos aspectos.

## Reglas de dominio

- El movimiento financiero comparte estos campos entre TypeScript y Pydantic: `create_date`, `amount`, `operation_type`, `category` y `business_type`. Conserva sus nombres y tipos en ambos lados cuando cambies el contrato.
- Los valores actuales son `income`/`outcome`; categorías `suppliers`, `sales`, `operational`, `administrative`, `others`; tipos de negocio `B2B`/`B2C`.
- Los KPI actuales calculan beneficio como ingresos menos gastos y margen como beneficio dividido por ingresos; cuando no hay ingresos, el porcentaje es cero. Las pruebas de `financial-utils` cubren estas fórmulas.
- El backend genera datos simulados de forma determinista usando la semilla `42` en las rutas actuales. No trates esos datos como registros persistidos.
- El encabezado muestra el período 2024, pero el generador asigna fechas según la fecha actual. No presupongas que el rótulo coincide con el año de los datos.
- La agrupación mensual usa getters de fecha locales; el repositorio no define si la semántica contable debe ser UTC o una zona local. No cambies esa semántica sin confirmar el requisito.

## Forma de trabajar

- Antes de analizar, editar o generar instrucciones, busca y revisa las reglas de trabajo en `./.agents/rules`, las skills en `./.agents/skills` y la memoria en `./memory-bank` si existe. Sigue sus instrucciones más recientes; si una ubicación no existe, no presupongas su contenido.
- Inspecciona el código propietario del comportamiento y las pruebas cercanas antes de proponer cambios. Para contratos de datos, revisa frontend y backend conjuntamente.
- Mantén los cambios acotados al comportamiento solicitado y no conviertas observaciones de una sesión en reglas permanentes sin volver a verificarlas.

## Límites y verificación

- La pantalla actual solicita `GET /api/metrics`; el backend tiene endpoints adicionales que no necesariamente están conectados a la UI. Verifica consumidores antes de cambiar o retirar rutas.
- Vite reenvía `/api` a `http://backend:8000`. Compose monta `./frontend` en `/app` y un volumen anónimo en `/app/node_modules`; las dependencias del host y las del contenedor son instalaciones separadas. Al cambiar proxy, puertos o montajes, revisa su compatibilidad en conjunto.
- Ejecuta los scripts frontend definidos en `frontend/package.json` que correspondan al cambio. Para fórmulas, revisa o ejecuta `npm test`; para cambios de compilación, `npm run build`.
- Ejecuta o amplía las pruebas backend de `backend/tests` cuando cambies rutas o lógica de negocio; confirma primero el entorno/comando disponible porque el repositorio no declara un script backend dedicado.
- Antes de atribuir un fallo a una causa concreta, vuelve a comprobarlo en el entorno afectado. Los errores históricos de instalación local y comunicación frontend-backend no demuestran por sí solos el estado actual ni la causa raíz.
