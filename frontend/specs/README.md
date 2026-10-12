# Contrato de datos del dashboard financiero

## Alcance y fuentes

Esta guía describe las respuestas y parámetros publicados actualmente por OpenAPI y los tipos TypeScript existentes para las tres funcionalidades. El contrato activo se consultó en `http://localhost:8000/openapi.json` (OpenAPI 3.1.0). La semántica de filtros y cálculos se contrastó con `backend/app/routes.py` y `backend/tests/test_routes.py`.

Los requisitos del Product Manager (PM) no modifican el contrato real. Cuando difieren, esta guía presenta ambos por separado. Los estados y mensajes UI mencionados son requisitos de producto, no respuestas literales de la API.

## Tipos compartidos existentes

En `frontend/src/lib/financial-types.ts` están definidos:

- `OperationType = "income" | "outcome"`.
- `Category = "suppliers" | "sales" | "operational" | "administrative" | "others"`.
- `BusinessType = "B2B" | "B2C"`.
- `FinancialMovement`: `create_date: string` (fecha ISO), `amount: number`, `operation_type: OperationType`, `category: Category`, `business_type: BusinessType`.

En `frontend/specs/param-types.ts` están definidos `DateRangeFilter`, `AlertsParams` y `TopCategoriesParams`. En `frontend/specs/api-types.ts` están definidos `FacetsResponse`, `AlertEntry`, `AlertsResponse`, `CategoryEntry`, `TopCategoriesResponse`, `MetricsSummaryItem` y `MetricsSummaryResponse`.

## Funcionalidad 1: filtro de fechas del dashboard

### Endpoints

**`GET /api/metrics`** devuelve `FinancialMovement[]` y acepta estos parámetros de query:

| Parámetro | OpenAPI | Default/restricciones |
|---|---|---|
| `start_date` | fecha nullable | Opcional; no publica default. |
| `end_date` | fecha nullable | Opcional; no publica default. |
| `category` | string nullable | Opcional; enum `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| `operation_type` | string nullable | Opcional; enum `income`, `outcome`. |

La respuesta `200` es una lista ordenada de movimientos. Todos los campos de `FinancialMovement` son requeridos en cada movimiento. OpenAPI documenta `422 HTTPValidationError` para parámetros inválidos.

**`GET /api/metrics/facets`** no acepta parámetros. Su respuesta `200` es `FacetsResponse`, con campos requeridos:

- `operation_types: OperationType[]`.
- `business_types: BusinessType[]`.
- `categories: Category[]`.
- `min_date: string` con formato OpenAPI `date`.
- `max_date: string` con formato OpenAPI `date`.

OpenAPI no publica respuesta `422` para esta ruta. Las facetas son globales; no reciben el rango activo.

### Tipos de petición y respuesta

- Petición TypeScript: `DateRangeFilter` (`start_date?: string | null`, `end_date?: string | null`).
- Respuesta de movimientos: `FinancialMovement[]` (`frontend/src/lib/financial-types.ts`).
- Respuesta de límites y opciones: `FacetsResponse` (`frontend/specs/api-types.ts`).

Las fechas de query deben expresarse como `YYYY-MM-DD`. El tipo OpenAPI es `string` con formato `date`; no especifica política de UI ni formato visual distinto.

### Límites y casos borde

1. **Sin fechas:** omitir ambos parámetros devuelve todos los movimientos disponibles. La UI muestra el encabezado `Todo el período`.
2. **Un límite o límites coincidentes:** el backend compara `create_date >= start_date` y `create_date <= end_date`; los extremos son inclusivos. La UI muestra `Desde YYYY-MM-DD`, `Hasta YYYY-MM-DD` o el rango completo, según aplique.
3. **Inicio posterior al fin:** el backend no valida el orden; la comparación produce una lista vacía si el rango se envía. La UI debe impedir el envío, mostrar `La fecha de inicio no puede ser posterior a la fecha de fin.` y conservar el último rango válido. No hay prueba específica para el rango invertido.
4. **Rango sin movimientos:** `/api/metrics` responde `200` con `[]`. La UI muestra `No hay datos disponibles para el período seleccionado`, no resultados antiguos.
5. **Error de consulta:** OpenAPI declara `422` para parámetros inválidos. Si falla la carga de datos o facetas, la UI muestra `No se pudieron cargar los datos financieros. Inténtalo de nuevo`.

La prueba `test_filter_movements_by_date_includes_range_edges()` cubre los extremos; `test_metrics_endpoint_respects_date_filters()` cubre un rango con resultados. La aplicación del filtro a todos los KPI y gráficos y sus mensajes UI son requisitos frontend, no efectos descritos por OpenAPI.

## Funcionalidad 2: alertas de anomalías

### Endpoint y contrato

**`GET /api/metrics/alerts`** responde `MetricsAlert[]`, representado por `AlertsResponse = AlertEntry[]`.

| Parámetro | OpenAPI | Default/restricciones |
|---|---|---|
| `threshold` | number | Opcional, default `0.3`, mínimo API `0`, sin máximo publicado. |
| `group_by` | string | Opcional, default `month`; enum `day`, `week`, `month`. |
| `start_date`, `end_date` | fecha nullable | Opcionales; sin default publicado. |
| `business_type` | string nullable | Opcional; enum `B2B`, `B2C`. |

La respuesta `200` es una lista cuyos campos requeridos son `period: string`, `outcome_total: number`, `baseline_average: number` e `increase_ratio: number`. OpenAPI documenta `422 HTTPValidationError` para parámetros inválidos.

### Tipos de petición y respuesta

- Petición: `AlertsParams` extiende `DateRangeFilter`; añade `threshold?: number`, `group_by?: "day" | "week" | "month"` y `business_type?: BusinessType | null`.
- Respuesta: `AlertsResponse` y `AlertEntry` (`frontend/specs/api-types.ts`). `increase_ratio` es una razón numérica, no un porcentaje ya multiplicado por 100.

### Comportamiento y discrepancias PM/API

- **PM:** baseline = media móvil de exactamente los tres períodos anteriores; exigir los tres períodos; si faltan o la media es cero, no generar alerta. El historial anterior al inicio del rango puede usarse para el baseline, pero solo se muestran alertas dentro del rango.
- **API actual:** `detect_outcome_alerts()` promedia todos los períodos anteriores que recibe, no una ventana de tres. Solo calcula si existe historial y el baseline es mayor que cero. Calcula `(outcome_actual - baseline) / baseline` y genera alerta cuando `increase_ratio > threshold` (comparación estricta).
- **Dependencia obligatoria:** `/api/metrics/alerts` no satisface la media móvil exigida. `AlertsResponse` no puede usarse directamente como fuente de alertas conformes al PM porque `baseline_average` contiene el cálculo acumulativo actual. La futura implementación debe resolver esta dependencia antes de considerar F2 completada.
- **Fuera del alcance de este ejercicio de especificación:** elegir si se adapta el backend o si se obtienen datos adecuados para calcular la media móvil en el frontend. No se presupone que ninguna de esas capacidades exista actualmente.
- **Rango:** `get_metrics_alerts()` filtra movimientos por fechas antes de agrupar y llamar al detector. Por tanto, la API actual no dispone del historial previo a `start_date` para calcular la referencia cuando el rango está activo; no cumple el requisito PM de usarlo.
- **Umbral:** el default `0.3` coincide. El PM exige `0.01–1.0`, inclusive; OpenAPI solo exige `threshold >= 0`, sin máximo. La validación de la UI debe seguir el rango PM, no inferir que el contrato API impone ese máximo.
- Cuando el endpoint no encuentra alertas, devuelve `200` con `[]`; la UI debe mostrar `No se detectaron anomalías para el período seleccionado.`

### Límites y casos borde

1. **Menos de tres períodos anteriores:** el requisito PM no permite calcular baseline ni generar alerta; mostrar el estado explícito de ausencia de anomalías si la lista resultante queda vacía. La API actual puede evaluar con uno o dos períodos: incompatibilidad conocida.
2. **Baseline cero:** el PM decide no generar alerta. El detector actual también omite el cálculo si el promedio es cero.
3. **Incremento igual al umbral:** el backend usa `>`; una igualdad no genera alerta. Esto coincide con “supera el umbral”.
4. **Umbral fuera de `0.01–1.0`:** rechazar en UI conforme al PM aunque algunos valores menores a `0.01` sean admitidos por OpenAPI; valores mayores que `1.0` no tienen máximo de API publicado.
5. **Rango acotado con historial previo:** el requisito permite usar períodos anteriores al rango para baseline y filtrar después las alertas visibles; el endpoint actual recorta antes el historial, así que no puede satisfacer ese caso sin cambiar el comportamiento backend.

`test_metrics_alerts_returns_anomaly_candidates()` verifica status y forma de los campos, no el cálculo del baseline ni los casos borde descritos.

## Funcionalidad 3: comparativa B2B vs B2C

### Endpoints

**`GET /api/metrics/categories/top`** responde `TopCategoryItem[]`, representado por `TopCategoriesResponse = CategoryEntry[]`.

| Parámetro | OpenAPI | Default/restricciones |
|---|---|---|
| `operation_type` | string | Opcional, default `outcome`; enum `income`, `outcome`. La comparativa debe enviar `income`. |
| `limit` | integer | Opcional, default `5`; mínimo `1`, máximo `20`. La comparativa solicita `5`. |
| `start_date`, `end_date` | fecha nullable | Opcionales; sin default publicado. |
| `business_type` | string nullable | Opcional; enum `B2B`, `B2C`. Consultar cada grupo por separado. |

Cada elemento de respuesta requiere `category` (enum de cinco categorías), `operation_type` (enum `income`/`outcome`) y `total_amount: number`. OpenAPI documenta `422 HTTPValidationError` para parámetros inválidos.

**`GET /api/metrics/facets`** no tiene parámetros; `FacetsResponse.categories` enumera categorías globales disponibles. No identifica categorías con ingresos por grupo.

**`GET /api/metrics/summary`** devuelve `MetricsSummaryItem[]`. Admite `group_by` (`day`, `week`, `month`, default `month`), `start_date`, `end_date`, `category`, `operation_type` y `business_type`; salvo `group_by`, los filtros son opcionales y no publican default. OpenAPI documenta `422 HTTPValidationError`.

Cada `MetricsSummaryItem` requiere `period: string`, `income: number`, `outcome: number` y `net: number`; estos campos están tipados en `frontend/specs/api-types.ts`, y `MetricsSummaryResponse` representa el array. La API no devuelve un total global: el total por grupo y rango se obtiene sumando `income` de todos los períodos devueltos.

### Tipos de petición y respuesta

- Petición de categorías: `TopCategoriesParams` (`operation_type?: OperationType`, `limit?: number`, fechas opcionales por `DateRangeFilter`, `business_type?: BusinessType | null`). Aunque sus propiedades son opcionales para reflejar la API, la vista envía `operation_type=income` y `limit=5`.
- Respuesta de categorías: `TopCategoriesResponse` / `CategoryEntry[]`, campos `category`, `operation_type`, `total_amount`.
- Facetas: `FacetsResponse` (`frontend/specs/api-types.ts`).
- Respuesta summary: `MetricsSummaryResponse` (`frontend/specs/api-types.ts`), array de `MetricsSummaryItem`.
- Rango: `DateRangeFilter`; enviar `start_date` y/o `end_date` en `YYYY-MM-DD`, y usar el mismo rango en las consultas de ambas líneas y summary.

### Compatibilidad PM/API y límites

- El endpoint top filtra por un solo `business_type` por consulta, de modo que B2B y B2C se consultan separadamente.
- `limit=5` significa hasta cinco categorías observadas, no garantiza cinco resultados. En el generador demo actual, `_build_movement()` asigna ingresos solo a `sales` y `others`; no inventar filas ni mostrar categorías sin ingresos para completar cinco.
- `facets.categories` es global. Úsese como lista de categorías disponibles; las filas con importes provienen de la respuesta top filtrada para cada grupo.
- El total de cada grupo se obtiene sumando `income` de `summary` para ese `business_type` y rango. No usar la suma de las categorías top como total.
- El porcentaje por categoría es `total_amount / totalIncome * 100`; si `totalIncome` es cero, la UI muestra `—`.
- El PM requiere una página accesible desde la navegación del dashboard y que conserve el rango al navegar y volver. Esto es estado/navegación frontend; no es un parámetro o garantía de estos endpoints.

### Límites y casos borde

1. **Menos de cinco categorías con ingresos:** el endpoint devuelve solo categorías observadas, posiblemente menos de cinco (el demo actual solo genera `sales` y `others` como ingresos). Mostrar solo esas filas; no fabricar categorías ni valores.
2. **Total de ingresos del grupo cero:** si la suma de `income` de summary es cero, mostrar `—` en los porcentajes y el estado sin ingresos correspondiente; no dividir por cero.
3. **Sin movimientos en el rango:** summary puede devolver `[]` y top devuelve `[]`; tratar el total agregado como cero para la presentación y mostrar el estado vacío del grupo/comparación.
4. **Default de `operation_type`:** la API usa `outcome` si se omite; la pantalla debe pedir explícitamente `income` para evitar comparar gastos.
5. **Comparación de rangos:** fechas distintas entre top y summary producen porcentajes y gráfico incoherentes; todas las consultas de ambos grupos deben usar el mismo rango activo.

`test_metrics_summary_by_month_returns_balances()` comprueba los campos del resumen mensual; `test_metrics_summary_by_week_honors_business_type_filter()` comprueba el filtro por tipo de negocio. La prueba top existente comprueba límite y orden, no la vista comparativa completa.

## Reglas para el coding agent

- Distinguir siempre el contrato observado de las reglas de presentación del PM.
- No asumir que `baseline_average` equivale a una media móvil de tres períodos ni que las fechas actuales de `/api/metrics/alerts` incluyen historial previo al rango.
- No sumar las cinco categorías top como total de ingresos del grupo. Agregar `income` de `summary` usando `MetricsSummaryResponse` y `MetricsSummaryItem` definidos en `frontend/specs/api-types.ts`.
- No completar filas de categoría que el endpoint no devolvió y aplicar el mismo rango a las consultas comparativas.
- Los mensajes, navegación, persistencia del rango y estados vacíos son requisitos de UI, no campos o parámetros OpenAPI.
