# Verificación del proyecto

## Resumen del proyecto

La aplicación es un dashboard de métricas financieras. Presenta ingresos, gastos, beneficio y margen de beneficio, además de gráficos mensuales de ingresos frente a gastos y del margen de beneficio.

- **Frontend:** React 19 y TypeScript, ejecutados con Vite. Tailwind CSS se integra mediante el plugin de Vite y Recharts dibuja los gráficos. `frontend/src/App.tsx` solicita `GET /api/metrics`, mantiene los estados de carga y error, y pasa los datos a los componentes del dashboard. `frontend/src/lib/financial-utils.ts` calcula los indicadores y agrupa los movimientos por mes.
- **Backend:** Python con FastAPI y Uvicorn. `backend/app/main.py` crea la API y registra las rutas declaradas en `backend/app/routes.py`. Esta última genera movimientos financieros simulados con una semilla fija (`42`), permite filtrarlos y calcula resúmenes, comparaciones, categorías principales y alertas. No se configura una base de datos en el proyecto.
- **Comunicación:** el frontend pide movimientos en JSON a `/api/metrics`. Durante el desarrollo, Vite reenvía las peticiones `/api` a `http://backend:8000`, que es el servicio `backend` de Docker Compose. El dashboard actual consume esa ruta de movimientos y calcula sus indicadores en el frontend; las otras rutas de la API no se consumen desde `App.tsx`.
- **Ejecución y puertos:** `docker-compose.yml` configura los servicios `frontend` y `backend`; publica el frontend en el puerto `5173` y la API en el `8000`. La documentación interactiva de FastAPI está disponible en `/docs` del backend.
- **Pruebas y dependencias:** `frontend/package.json` define scripts para compilar, probar y analizar el frontend. `backend/requirements.txt` incluye FastAPI, Uvicorn y pytest; las pruebas de rutas están en `backend/tests/test_routes.py`.

Los movimientos son datos de demostración, no registros persistidos. Aunque el encabezado de la interfaz etiqueta el período como 2024, las fechas que genera el backend dependen de la fecha de ejecución; ese desajuste también se registra en la tabla de afirmaciones.

## Afirmaciones

Las cinco afirmaciones principales del proyecto se contrastaron con el código. Los hallazgos de las incidencias se documentan en sus secciones específicas.

| ID | Afirmación | Estado | Evidencia | Corrección u observaciones |
|---|---|---|---|---|
| A1 | La pantalla principal obtiene los movimientos mediante `GET /api/metrics` y no consume las otras rutas de métricas del backend. | ✅ verificada | [App.tsx](frontend/src/App.tsx#L15), [App.tsx](frontend/src/App.tsx#L16), [routes.py](backend/app/routes.py#L248) | Una búsqueda de `fetch`, `axios` y `/api` en `frontend/src` encontró solo esta petición. El backend sí ofrece rutas adicionales, pero no están conectadas a la pantalla actual. |
| A2 | El backend genera 360 movimientos simulados (30 en cada uno de 12 meses) con semilla `42`; no se observa una base de datos configurada en los archivos de dependencias y Compose revisados. | ✅ verificada | [routes.py](backend/app/routes.py#L94), [routes.py](backend/app/routes.py#L97), [routes.py](backend/app/routes.py#L99), [routes.py](backend/app/routes.py#L101), [routes.py](backend/app/routes.py#L255), [docker-compose.yml](docker-compose.yml#L1), [requirements.txt](backend/requirements.txt#L1) | La afirmación sobre la base de datos se limita a la configuración inspeccionada: Compose declara frontend y backend, y los requisitos del backend no declaran un controlador de base de datos. Las fechas de los movimientos sí dependen de la fecha de ejecución. |
| A3 | La interfaz etiqueta el período como 2024, pero el año de los movimientos generados depende de la fecha actual del backend. | ✅ verificada | [App.tsx](frontend/src/App.tsx#L49), [routes.py](backend/app/routes.py#L65), [routes.py](backend/app/routes.py#L97) | El encabezado es fijo; `_year_for_month` asigna el año según `date.today()`. Por tanto, los datos no están limitados necesariamente a 2024. |
| A4 | El frontend calcula los KPI y los datos mensuales, aunque la API también ofrece resúmenes y otros análisis. | ✅ verificada | [App.tsx](frontend/src/App.tsx#L32), [App.tsx](frontend/src/App.tsx#L33), [financial-utils.ts](frontend/src/lib/financial-utils.ts#L21), [financial-utils.ts](frontend/src/lib/financial-utils.ts#L36), [routes.py](backend/app/routes.py#L268), [routes.py](backend/app/routes.py#L305), [routes.py](backend/app/routes.py#L342) | Los KPI y la agregación mensual se calculan en el cliente. Las rutas de resumen, comparación y alertas existen en el backend, pero `App.tsx` no las solicita. |
| A5 | `frontend/src/lib/mock-data.ts` existe, pero no es la fuente de datos usada por la aplicación actual. | ✅ verificada | [mock-data.ts](frontend/src/lib/mock-data.ts#L3), [App.tsx](frontend/src/App.tsx#L1), [App.tsx](frontend/src/App.tsx#L16) | La búsqueda de referencias en `frontend/src` encontró `mockMovements` solo en su declaración; `App.tsx` importa utilidades y solicita los datos al backend. |

## Verificación del error de conexión

- **Problema detectado:** Desde `frontend`, las peticiones a `backend:8000` expiran; a través de Vite, `/api/metrics` devuelve `502`. El navegador muestra `504`.
- **Comprobación HTTP más reciente:** el frontend en Docker respondió `HTTP 200` en `http://localhost:5173/`. Una solicitud a `http://localhost:5173/api/metrics`, con límite de cinco segundos, expiró y devolvió código HTTP `000`; el proxy/la API todavía no entrega los movimientos.
- **Timeout observado:** se registró timeout TCP al conectar con `172.18.0.2:8000`; en otra comprobación Vite devolvió `502` y el navegador mostró `504`. El servicio backend respondió `200` desde su propio contenedor en la observación registrada previamente.
- **Causa raíz:** continúa sin identificarse. Los timeouts y códigos HTTP son síntomas observados, no evidencia suficiente para concluir que el backend está detenido o que la configuración del proxy sea la causa.
- **Comportamiento del frontend ante el fallo:** [App.tsx](frontend/src/App.tsx#L35) muestra un mensaje cuando falla la petición y [App.tsx](frontend/src/App.tsx#L40) termina el estado de carga.
- **Solución probada:** `docker compose restart backend frontend`. No lo resolvió: la comprobación posterior volvió a dar timeout y Vite devolvió `502`.
- **Ficheros implicados:** `frontend/src/App.tsx` (petición), `frontend/vite.config.ts` (proxy), `backend/app/main.py` y `backend/app/routes.py` (API), y `docker-compose.yml` (servicios y montajes). La causa del problema de comunicación queda pendiente de diagnóstico en ejecución.

## Investigación del error de TypeScript

### Problema inicial

VS Code informó en `frontend/tsconfig.node.json`:

> No se puede encontrar el archivo de definición de tipo para 'node'. El archivo está en el programa porque se especifica en compilerOptions.

También se detectó en `frontend/tsconfig.app.json`:

> No se puede encontrar el archivo de definición de tipo para 'vite/client'. El archivo está en el programa porque se especifica en compilerOptions.

Ambos diagnósticos indican que TypeScript no puede resolver tipos pedidos explícitamente por los respectivos `compilerOptions`.

### Hipótesis inicial

**Hipótesis incorrecta:** `@types/node` no estaba declarado en las dependencias del frontend.

**Evidencia:** [frontend/package.json](frontend/package.json#L27) lo declara como dependencia de desarrollo (`^24.12.2`); [frontend/package-lock.json](frontend/package-lock.json#L22) lo declara y fija la versión `24.12.2` en [la entrada del paquete](frontend/package-lock.json#L1302).

**Corrección:** la dependencia sí está declarada. El resultado local de `npm ls` y la carpeta vacía indican que faltaba en la instalación local; no que faltara del manifiesto o del lockfile.

### Verificación de configuración

- [frontend/tsconfig.node.json](frontend/tsconfig.node.json#L7) configura `"types": ["node"]` y limita este proyecto a `vite.config.ts` ([línea 23](frontend/tsconfig.node.json#L23)).
- [frontend/tsconfig.json](frontend/tsconfig.json) referencia tanto el proyecto de la aplicación como `tsconfig.node.json`.
- [frontend/vite.config.ts](frontend/vite.config.ts#L4) importa `node:path`; por eso los tipos de Node son pertinentes para el archivo incluido en `tsconfig.node.json`.
- [frontend/tsconfig.app.json](frontend/tsconfig.app.json#L7) usa `vite/client` para el código de la aplicación. La configuración diferencia los tipos del navegador y los de la configuración de Vite.

La hipótesis de que `"types": ["node"]` sea una configuración incorrecta también se descarta: [tsconfig.node.json](frontend/tsconfig.node.json#L7) incluye `vite.config.ts` ([línea 23](frontend/tsconfig.node.json#L23)), que importa `node:path` ([vite.config.ts](frontend/vite.config.ts#L4)). `tsconfig.app.json` pide `vite/client` y el manifiesto incluye Vite. Ambos diagnósticos son consistentes con dependencias ausentes en el `node_modules` local de Codespaces.

### Pruebas realizadas

Los siguientes resultados corresponden a comandos y comprobaciones que sí se ejecutaron. Los fallos de `npm ci`, `npm run build` y la petición a `/api/metrics` son resultados de pruebas; no se presentan como afirmaciones independientes sobre el código.

- En Codespaces, `npm ls @types/node --depth=0` (antes y después del intento de instalación) mostró que no había dependencias instaladas:

	```text
	frontend@0.0.0 /workspaces/aie-molic-gv-financial-dashboard-context-project/frontend
	└── (empty)
	```

- `npm ci`, ejecutado desde `frontend`, no terminó. El error relevante fue:

	```text
	npm error code EACCES
	npm error syscall mkdir
	npm error path /workspaces/aie-molic-gv-financial-dashboard-context-project/frontend/node_modules/@babel
	```

- El primer `ls -ld frontend frontend/node_modules` falló porque el directorio actual ya era `frontend`, por lo que esas rutas relativas no existían desde allí. El comando corregido, `ls -ld . node_modules`, sí se ejecutó y devolvió:

	```text
	drwxrwxrwx+ 5 codespace root 4096 Oct  8 08:30 .
	drwxr-xr-x+ 2 root      root 4096 Oct  8 08:30 node_modules
	```

- `npm run build` ejecutó el script `tsc -b && vite build`, pero terminó con código `127`:

	```text
	sh: 1: tsc: not found
	```

	Por lo tanto, no llegó a ejecutar el compilador de TypeScript ni Vite.

- El diagnóstico de VS Code seguía informando ambos tipos faltantes: `node` en `tsconfig.node.json` y `vite/client` en `tsconfig.app.json`.

### Dependencias locales y volumen de Docker

- En el host de Codespaces, `frontend/node_modules` es un directorio normal, vacío y propiedad de `root:root` con modo `755`, según `stat`. `findmnt` lo ubicó dentro del filesystem del workspace (`/workspaces`, `ext4`); no es un punto de montaje independiente.
- El `docker-compose.yml` monta `./frontend` en `/app` y declara además un volumen anónimo en `/app/node_modules` ([líneas 9-10](docker-compose.yml#L9)). Ese volumen Docker se monta sobre la ruta del `node_modules` del host y mantiene sus archivos separados.
- `frontend/Dockerfile` ejecuta `npm install` durante la construcción de la imagen ([línea 4](frontend/Dockerfile#L4)). En el contenedor activo, `docker inspect` confirmó el bind mount y el volumen anónimo; `docker exec id` devolvió `uid=0(root) gid=0(root)`, y `stat /app/node_modules` mostró `root:root`, modo `755`.
- Dentro del contenedor, `npm ls @types/node vite --depth=0` sí encontró `@types/node@24.12.2` y `vite@8.0.8`. Por tanto, la instalación del contenedor no es la misma instalación vacía del host.
- Git, antes de esta actualización documental, mostró `M verification.md` en `git status --short`. El `git diff` limitado a código fuente, configuraciones, manifiestos y lockfile no produjo salida: no se habían modificado esos archivos.

Estas son pruebas ejecutadas, no afirmaciones adicionales sobre el proyecto: `npm ci` falló por permisos, `npm run build` no encontró `tsc`, y la comprobación de Git encontró solo cambios en la documentación.

### Ejecución del frontend y API

- `curl http://localhost:5173/` respondió `frontend HTTP 200`: el servidor frontend sí sirve la página dentro de Docker aunque VS Code no pueda resolver los tipos locales.
- `curl --max-time 5 http://localhost:5173/api/metrics` terminó con `curl: (28) Operation timed out after 5002 milliseconds with 0 bytes received` y `metrics HTTP 000`. Así, el dashboard puede cargar su interfaz, pero no se ha confirmado que pueda recibir las métricas; la comunicación con el backend sigue fallando.

### Causa identificada

La carpeta local `frontend/node_modules` pertenece a `root:root` y tiene permisos `drwxr-xr-x`; el directorio de trabajo pertenece a `codespace`. El usuario `codespace` no podía crear `node_modules/@babel`, lo que produjo `EACCES` e impidió que `npm ci` instalara las dependencias locales. Docker, por separado, monta un volumen anónimo en `/app/node_modules`, ejecuta como `root` y tiene Vite y `@types/node` instalados allí. La evidencia identifica la causa de la instalación local fallida, pero no demuestra que Docker haya creado el directorio `frontend/node_modules` del host.

### Estado actual

- **Confirmado:** `@types/node` está declarado en `package.json` y `package-lock.json`; `tsconfig.node.json` solicita correctamente ese tipo para `vite.config.ts`.
- **No resuelto en Codespaces:** no se completó `npm ci`; faltan `@types/node` y `vite/client` en los `node_modules` locales y VS Code muestra ambos diagnósticos.
- **Docker:** la página frontend responde HTTP 200 y sus dependencias están instaladas en el volumen. Sin embargo, `/api/metrics` expira; que se sirva la página no significa que los datos del backend estén disponibles.
- **Build pendiente:** `npm run build` no pudo probar la compilación porque no encontró `tsc`; no se puede concluir que el frontend compile correctamente.
- **Alcance de cambios:** no se modificaron código, dependencias, configuraciones ni permisos. No se hizo commit; esta actualización afecta únicamente a `verification.md`.

### Posibles soluciones no ejecutadas

1. Para corregir los diagnósticos del editor local, hacer que solo `frontend/node_modules` sea escribible por `codespace` (por ejemplo, corregir su propietario con ayuda de un administrador) y luego ejecutar `npm ci` desde `frontend`.
2. Si no se puede cambiar el propietario existente, recrear el directorio generado `frontend/node_modules` con propietario `codespace` y después ejecutar `npm ci`.

Ambas alternativas corrigen el bloqueo de permisos del host sin cambiar `package.json`, `package-lock.json` ni los `tsconfig`; no alteran directamente el volumen anónimo que Docker monta en `/app/node_modules`. Cambiar permisos del directorio local no repararía por sí mismo el timeout de `/api/metrics`. No se ejecutó ninguna solución. Tras una instalación local autorizada habría que repetir `npm ls @types/node --depth=0` y `npm run build`; el problema de conexión requiere un diagnóstico separado.

## Estado de la Fase 1

- **Verificado:** las cinco afirmaciones principales A1–A5 y la arquitectura frontend/backend documentada.
- **Funciona:** el servidor frontend dentro de Docker responde HTTP 200.
- **Pendiente:** la ruta `/api/metrics` sigue expirando; su causa raíz no está identificada. En Codespaces faltan dependencias locales, `npm ci` está bloqueado por permisos y el build aún no ha podido ejecutarse.

## Fase 3 — Validación de reglas de agentes

Se registran tres ejecuciones de prueba realizadas al aplicar las reglas frontend y backend. Los resultados de tests comprueban el comportamiento del código; la aplicación de reglas se evalúa por separado según el cambio observado. Estas pruebas no validan todas las reglas de los archivos.

| Prueba | Objetivo | Resultado del test automático | Validación de reglas |
|---|---|---|---|
| Frontend: ingresos cero | Comprobar la fórmula de margen cuando no hay ingresos. | En host: `npm test` no arrancó (`vitest: not found`). En Docker: `docker exec aie-molic-gv-financial-dashboard-context-project-frontend-1 npm test` terminó con **5 tests pasados**. | ✅ Se siguió el patrón Vitest y el test tipado; se amplió únicamente la prueba existente. |
| Backend: operación inválida | Comprobar que `operation_type=refund` se rechaza según el contrato `Literal`. | `docker exec aie-molic-gv-financial-dashboard-context-project-backend-1 pytest tests/test_routes.py::test_metrics_endpoint_rejects_invalid_operation_type`: **1 pasado**, 1 advertencia. | ✅ Se usó `TestClient` y se comprobaron estado HTTP y ubicación del error; solo se modificó el archivo de tests. |
| Backend: suite completa | Comprobar que la nueva prueba y los casos existentes siguen pasando juntos. | `docker exec aie-molic-gv-financial-dashboard-context-project-backend-1 pytest`: **16 pasados**, 1 advertencia. | ✅ Se ejecutó la suite backend completa tras el test focalizado; no se cambiaron rutas ni lógica de producción. |

### 1. Frontend: margen sin ingresos

- **Objetivo:** validar la regla de [frontend.md](.agents/rules/frontend.md#L39) que exige cubrir condiciones límite del cálculo, y [AGENTS.md](AGENTS.md#L42), que prescribe fixtures tipados y resultados esperados.
- **Tarea realizada:** se pidió añadir una regresión para ingresos cero. Como ya existía un caso con solo gastos, el agente amplió ese test en vez de duplicarlo: ahora verifica `totalIncome: 0`, `totalOutcome: 350`, `profit: -350` y `profitPercent: 0` en [financial-utils.test.ts](frontend/src/lib/financial-utils.test.ts#L47).
- **Reglas aplicadas:** Vitest, fixture `FinancialMovement` tipado y aserción sobre valores esperados. El cálculo de producción conserva la guarda `totalIncome > 0 ? ... : 0` en [financial-utils.ts](frontend/src/lib/financial-utils.ts#L31); no se modificó.
- **Pruebas ejecutadas:** desde `frontend`, `npm test` no pudo ejecutarse en el host porque el shell informó `vitest: not found`. El mismo script en el contenedor, `docker exec aie-molic-gv-financial-dashboard-context-project-frontend-1 npm test`, pasó los 5 tests del archivo.
- **Resultado:** ✅ regla de pruebas validada en este caso; el test pasó en Docker. La ejecución local no pudo realizarse por falta de Vitest en el host.
- **Observaciones:** se respetó el alcance de test-only. No se validaron con esta ejecución las demás reglas frontend.

### 2. Backend: valor de operación fuera del contrato

- **Objetivo:** validar las reglas de [backend.md](.agents/rules/backend.md#L22) y [backend.md](.agents/rules/backend.md#L34): conservar los valores `Literal` y probar rutas con `TestClient`, verificando estado y payload.
- **Tarea realizada:** se pidió identificar un caso límite no cubierto. Se añadió `test_metrics_endpoint_rejects_invalid_operation_type` en [test_routes.py](backend/tests/test_routes.py#L90), que envía `operation_type=refund` y espera HTTP `422` con ubicación `query.operation_type`.
- **Evidencias del contrato:** [routes.py](backend/app/routes.py#L11) restringe `OperationType` a `income`/`outcome`; [routes.py](backend/app/routes.py#L253) usa ese alias en el parámetro de `/api/metrics`. La petición inválida es rechazada por la validación de FastAPI.
- **Prueba focalizada ejecutada:** el comando pytest del contenedor backend pasó **1 test**; pytest emitió una advertencia deprecada de Starlette/httpx, pero la prueba terminó correctamente.
- **Resultado:** ✅ reglas de validación de entrada y pruebas de endpoint aplicadas en este caso. No se modificaron rutas ni lógica de producción.
- **Observaciones:** el agente eligió un valor fuera del `Literal` existente y mantuvo la nomenclatura snake_case del test, conforme a [backend.md](.agents/rules/backend.md#L16). La advertencia de dependencia no se investigó ni corrigió en esta validación.

### 3. Backend: suite completa

- **Objetivo:** verificar que la nueva regresión no rompe los tests existentes de filtros, respuestas y datos generados, de acuerdo con [backend.md](.agents/rules/backend.md#L34) y la indicación de verificar cambios de pruebas en [AGENTS.md](AGENTS.md#L42).
- **Tarea realizada:** después del test focalizado, se ejecutó pytest sobre toda la suite backend.
- **Evidencia:** comando `docker exec aie-molic-gv-financial-dashboard-context-project-backend-1 pytest`; resultado real: **16 passed**, 1 advertencia deprecada de Starlette/httpx.
- **Resultado:** ✅ la suite existente y la regresión nueva pasan juntas en el contenedor.
- **Observaciones:** el test de código superado verifica compatibilidad de la suite en ese entorno; por sí solo no demuestra la calidad de todas las reglas ni otros entornos de ejecución.

### Evaluación conjunta

Las validaciones cubrieron de forma acotada reglas de testing, límites financieros, validación del contrato FastAPI y contención de cambios en archivos de prueba. El comportamiento del agente observado coincide con esas reglas: inspeccionó implementación/tests, cambió solo los tests solicitados y ejecutó primero pruebas focalizadas y después la suite backend. Los tests frontend pasaron en Docker, no en el host; los tests backend pasaron en Docker con una advertencia no relacionada.

No hay evidencia en estas validaciones que obligue a refinar las reglas probadas. Tampoco se han validado todas las reglas: quedan fuera, entre otras, nomenclatura de componentes, cambios reales de contrato entre frontend y backend, montajes/proxy de Docker y la decisión pendiente sobre zona horaria. No se afirma que toda la suite de reglas esté validada.
