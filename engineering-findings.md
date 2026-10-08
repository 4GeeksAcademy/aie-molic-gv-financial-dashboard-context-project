# Hallazgos de ingeniería

Hallazgos derivados de inspección directa del frontend, backend, pruebas y configuración. Las reglas son propuestas para futuras modificaciones; no son reglas locales ya existentes.

## Frontend

### F1. Arquitectura y nomenclatura de componentes

**Hallazgo:** Los componentes específicos del dashboard están en `components/dashboard`; los elementos reutilizables están en `components/ui`. Los archivos usan kebab-case y los componentes exportados PascalCase. Los componentes reciben datos y opciones mediante props TypeScript.

**Evidencia:** [kpi-row.tsx](frontend/src/components/dashboard/kpi-row.tsx#L6) define `KPIRowProps` y [exporta `KPIRow`](frontend/src/components/dashboard/kpi-row.tsx#L11). [kpi-card.tsx](frontend/src/components/dashboard/kpi-card.tsx#L6) define props y [exporta `KPICard`](frontend/src/components/dashboard/kpi-card.tsx#L34).

**Impacto:** Ubicar componentes en otra capa o cambiar props sin ajustar consumidores puede romper imports y contratos de presentación.

**Regla candidata:** Mantén los componentes de dominio en `components/dashboard`, reserva `components/ui` para piezas reutilizables, usa archivos kebab-case y componentes PascalCase con props tipadas.

**Estado:** ✅ Verificado en código.

### F2. Contrato de movimientos compartido con el backend

**Hallazgo:** El frontend modela los valores de operación, categoría y tipo de cliente mediante uniones TypeScript; el backend define equivalentes con `Literal` y un modelo Pydantic `FinancialMovement`.

**Evidencia:** [financial-types.ts](frontend/src/lib/financial-types.ts#L1) y [FinancialMovement del frontend](frontend/src/lib/financial-types.ts#L5); [Literal y modelo Pydantic](backend/app/routes.py#L11) y [campos del modelo](backend/app/routes.py#L22).

**Impacto:** Cambiar un campo o valor permitido solo en un lado puede producir errores de tipos, respuestas inválidas o valores que el frontend no reconoce.

**Regla candidata:** Cambia conjuntamente los tipos del frontend, el modelo/validador del backend y las pruebas que verifican el contrato de movimientos.

**Estado:** ✅ Verificado en código.

### F3. Cálculos financieros centralizados y probados

**Hallazgo:** `financial-utils.ts` concentra los totales y fórmulas usadas por el dashboard. El beneficio es ingresos menos gastos; el porcentaje es beneficio dividido por ingresos, con cero cuando no hay ingresos. Vitest verifica resultados numéricos y el caso sin ingresos.

**Evidencia:** [computeKPIs](frontend/src/lib/financial-utils.ts#L21), [fórmula y guardia de porcentaje](frontend/src/lib/financial-utils.ts#L30), [test de valores esperados](frontend/src/lib/financial-utils.test.ts#L36) y [test sin ingresos](frontend/src/lib/financial-utils.test.ts#L47).

**Impacto:** Alterar denominadores, políticas para cero o agregaciones cambia métricas visibles aunque el contrato HTTP permanezca igual.

**Regla candidata:** Conserva las definiciones de negocio existentes; al cambiar una fórmula, modifica o añade tests con entradas y resultados numéricos explícitos.

**Estado:** ✅ Verificado en código.

### F4. Agrupación mensual y zona horaria

**Hallazgo:** `create_date` está declarado como fecha ISO, pero la agrupación lo convierte con `new Date(...)` y extrae año/mes con getters locales. El código y los tests no especifican qué zona horaria debe definir el mes contable.

**Evidencia:** [tipo ISO de create_date](frontend/src/lib/financial-types.ts#L6), [getters locales](frontend/src/lib/financial-utils.ts#L8), [conversión para agrupar](frontend/src/lib/financial-utils.ts#L42) y [test mensual existente](frontend/src/lib/financial-utils.test.ts#L64).

**Impacto:** En algunas zonas, una fecha ISO a medianoche UTC puede convertirse al día anterior local y desplazarse de mes/año. La intención del proyecto no queda demostrada por el código disponible.

**Regla candidata:** Antes de cambiar el parseo, confirma si las fechas se interpretan en UTC o en una zona de negocio; cubre límites de mes y año con tests bajo la semántica acordada.

**Estado:** ❓ Pendiente de confirmar la semántica horaria esperada.

### F5. Manejo de errores y ciclo de carga

**Hallazgo:** `App.tsx` comprueba `response.ok`; ante cualquier fallo presenta un mensaje genérico y usa `finally` para terminar el estado de carga.

**Evidencia:** [petición y comprobación HTTP](frontend/src/App.tsx#L15), [captura del error](frontend/src/App.tsx#L35) y [fin de carga](frontend/src/App.tsx#L40).

**Impacto:** Un cambio que omita la rama de error puede dejar el dashboard sin explicación; si no finaliza la carga, los componentes pueden permanecer en skeleton. El mensaje actual no conserva el detalle técnico.

**Regla candidata:** Al modificar la carga de datos, conserva las ramas de respuesta no-OK, error de red y finalización de carga; adapta el mensaje visible si se introduce un flujo distinto.

**Estado:** ✅ Verificado en código.

### F6. Pruebas frontend y configuración de desarrollo

**Hallazgo:** Las pruebas frontend actuales se centran en funciones utilitarias con Vitest. En desarrollo, Vite reenvía `/api` al host de servicio `backend`; Compose monta el código en `/app` y separa `/app/node_modules` en un volumen anónimo.

**Evidencia:** [suite Vitest de utilidades](frontend/src/lib/financial-utils.test.ts#L1), [proxy Vite](frontend/vite.config.ts#L11) y [destino del proxy](frontend/vite.config.ts#L13); [bind mount](docker-compose.yml#L9), [volumen de node_modules](docker-compose.yml#L10), [instalación de dependencias en Docker](frontend/Dockerfile#L6).

**Impacto:** Cambiar el hostname o puerto sin coordinar proxy y Compose rompe las llamadas API. Quitar o cambiar el volumen puede hacer que el bind mount oculte las dependencias instaladas en la imagen.

**Regla candidata:** Si modificas el entorno frontend, valida juntos el proxy de Vite, nombre/puerto del servicio Compose y montajes de `/app` y `/app/node_modules`; amplía Vitest cuando cambie lógica compartida.

**Estado:** ✅ Verificado en código.

## Backend

### B1. Rutas tipadas, validación y pruebas de API

**Hallazgo:** Las rutas declaran `response_model`, anotaciones de parámetros y restricciones `Query`; por ejemplo, `limit` está acotado de 1 a 20. Las pruebas usan FastAPI `TestClient` y comprueban códigos HTTP, filtros y forma/contenido de respuestas.

**Evidencia:** [ruta y modelo de respuesta](backend/app/routes.py#L248), [filtros tipados de movimientos](backend/app/routes.py#L250), [límite de categorías](backend/app/routes.py#L290); [TestClient](backend/tests/test_routes.py#L3), [prueba de filtros por fecha](backend/tests/test_routes.py#L36) y [prueba de resumen mensual](backend/tests/test_routes.py#L121).

**Impacto:** Modificar nombres de parámetros, valores permitidos, defaults, límites o forma de respuesta puede romper consumidores aunque la ruta siga existiendo.

**Regla candidata:** Conserva las anotaciones, restricciones y modelos de respuesta al modificar una ruta; actualiza pruebas de endpoint para cada contrato o filtro afectado.

**Estado:** ✅ Verificado en código.

### B2. Datos mock deterministas y estado aleatorio global

**Hallazgo:** `generate_mock_movements` crea 30 registros por mes para 12 meses y establece la semilla con `random.seed(seed)`. Las rutas solicitan `seed=42` y una prueba comprueba cantidad y orden cronológico.

**Evidencia:** [generador y uso de la semilla global](backend/app/routes.py#L94), [bucle de 30 registros](backend/app/routes.py#L101), [semilla fija de la ruta](backend/app/routes.py#L255) y [test del generador](backend/tests/test_routes.py#L12).

**Impacto:** La semilla global afecta el estado aleatorio compartido del proceso; alterar la semilla o el orden de consumo cambia los datos de ejemplo y puede acoplar otro código aleatorio.

**Regla candidata:** Preserva la reproducibilidad de los endpoints y sus tests; al refactorizar el generador, evita efectos sobre el RNG compartido y actualiza las pruebas si cambia el conjunto de datos esperado.

**Estado:** ✅ Verificado en código.
