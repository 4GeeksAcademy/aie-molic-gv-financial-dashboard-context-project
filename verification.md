# Verificación del proyecto

Basada únicamente en las comprobaciones de código realizadas.

| Afirmación original | Archivos revisados | Resultado | Corrección o paso siguiente |
|---|---|---|---|
| El frontend solicita los movimientos mediante `GET /api/metrics`. | `frontend/src/App.tsx` | ✅ verificada en código | No aplica. |
| El backend genera datos simulados para esa ruta. | `backend/app/routes.py` | ✅ verificada en código | No aplica. |
| El frontend calcula los indicadores y agrupa los datos por mes. | `frontend/src/lib/financial-utils.ts` | ✅ verificada en código | No aplica. |
| El backend tiene endpoints adicionales que la pantalla actual no solicita. | `backend/app/routes.py`, `frontend/src/App.tsx` | ✅ verificada en código | No aplica. |
| El encabezado muestra 2024, pero las fechas generadas por el backend dependen de la fecha actual. | `frontend/src/App.tsx`, `backend/app/routes.py` | ✅ verificada en código | No aplica; las fechas efectivas dependen del momento de ejecución. |
| Si falla la petición, el frontend muestra el mensaje de error reportado. | `frontend/src/App.tsx` | ✅ verificada en código | No aplica. |
| La causa concreta del fallo actual es que el backend está detenido, falla el proxy u otra razón. | `frontend/src/App.tsx`, `frontend/vite.config.ts`, `backend/app/main.py` | ❓ sin verificar | Ejecutar la app y revisar la petición `/api/metrics` en la pestaña Network del navegador y los logs del backend para identificar la causa. |

## Verificación del error de conexión

- **Problema detectado:** Desde `frontend`, las peticiones a `backend:8000` expiran; a través de Vite, `/api/metrics` devuelve `502`. El navegador muestra `504`.
- **Causa detectada:** Timeout TCP entre los contenedores al conectar con `172.18.0.2:8000`. El nombre `backend` resuelve y ambos contenedores están en la misma red Compose. FastAPI respondió `200` desde su propio contenedor antes del reinicio; la causa raíz del bloqueo de red sigue sin identificarse.
- **Solución probada:** `docker compose restart backend frontend`. No lo resolvió: la comprobación posterior volvió a dar timeout y Vite devolvió `502`.
- **Ficheros afectados:** No se modificaron archivos de la aplicación. Los implicados son `frontend/src/App.tsx` (petición), `frontend/vite.config.ts` (proxy), `backend/app/main.py` y `backend/app/routes.py` (API), y `docker-compose.yml` (servicios/red). Solo se actualizó este archivo de verificación.
