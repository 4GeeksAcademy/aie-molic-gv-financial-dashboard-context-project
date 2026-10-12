# Especificación: filtro de rango de fechas

## Objetivo y usuario

Permitir que el equipo de finanzas centre el dashboard principal en un intervalo concreto sin perder acceso a todos los datos disponibles.

## Historia de usuario

Como integrante del equipo de finanzas, quiero seleccionar una fecha inicial y una final para consultar los KPI y gráficos del dashboard dentro de ese período, y conocer los límites temporales del conjunto de datos.

## Contexto verificado

- `frontend/src/App.tsx` carga los movimientos desde `GET /api/metrics` y calcula KPI y series mensuales a partir de esos movimientos.
- Los datos visibles actualmente son los cuatro KPI de `KPIRow` y los gráficos `IncomeOutcomeChart` y `ProfitPercentChart`.
- `GET /api/metrics` acepta `start_date` y `end_date` opcionales como fechas. `GET /api/metrics/facets` devuelve `min_date` y `max_date` además de las facetas. Evidencia contrastada en `frontend/specs/verification.md` y `backend/app/routes.py`.
- Los límites del filtro son inclusivos. Si ambas fechas se omiten, la API no filtra por fecha; si no hay movimientos para el intervalo, `/api/metrics` devuelve una lista vacía.
- El encabezado actual recibe la etiqueta fija `2024 - Full Year` en `App.tsx`; esta especificación define cómo refleja el rango activo.

## Componente propuesto y props

**Componente:** `DashboardDateRangeFilter`, situado en la parte superior del dashboard, junto al encabezado y antes de los KPI.

Contrato conceptual de props, alineado con los tipos de Fase 2:

| Prop | Tipo | Significado |
|---|---|---|
| `value` | `DateRangeFilter` (`frontend/specs/param-types.ts`) | Fechas actualmente seleccionadas; `start_date` y `end_date` son opcionales y admiten `null`. |
| `facets` | `FacetsResponse \| null` (`frontend/specs/api-types.ts`) | Límites mínimo y máximo disponibles y opciones devueltas por la API; el control muestra `min_date` y `max_date`. |
| `loading` | `boolean` | Indica carga inicial o actualización de datos/facetas. |
| `error` | `string \| null` | Error visible asociado a la carga de datos o de límites temporales. |
| `onChange` | `(value: DateRangeFilter) => void` | Notifica el rango seleccionado con los nombres de parámetro de la API. |

## Requisitos funcionales

1. Presentar dos controles de fecha identificados como inicio y fin en la parte superior del dashboard.
2. Mostrar junto a los controles las fechas mínima y máxima disponibles de `FacetsResponse`.
3. Tratar cada fecha como opcional; enviar las fechas definidas como `start_date` y `end_date` en formato `YYYY-MM-DD` y omitir los valores vacíos.
4. Actualizar automáticamente los datos visibles al cambiar una fecha cuando el rango resultante sea válido, sin requerir una acción explícita de aplicar.
5. Si ambas fechas están vacías, mostrar todos los movimientos disponibles y etiquetar el encabezado `Todo el período`.
6. Aplicar un límite inicial, final o ambos a ingresos, gastos, beneficio, margen y sus series gráficas; incluir movimientos de ambas fechas límite.
7. Mantener coherentes KPI y gráficos para un mismo rango; no combinar datos filtrados con valores de un rango anterior.
8. Mostrar en el encabezado ambas fechas como `start_date – end_date`, solo fecha inicial como `Desde start_date`, solo fecha final como `Hasta end_date` y ningún filtro como `Todo el período`.
9. Si `start_date` es posterior a `end_date`, mostrar `La fecha de inicio no puede ser posterior a la fecha de fin.`, no aplicar ni enviar ese rango y conservar el último rango válido.
10. Mantener el rango activo al navegar entre el dashboard principal y la página comparativa, y al volver.

## Estados

- **Carga:** mostrar el estado de carga de KPI y gráficos mientras se obtienen o actualizan datos; presentar los límites cuando las facetas estén disponibles.
- **Error de carga:** si falla la carga de movimientos o facetas, mostrar `No se pudieron cargar los datos financieros. Inténtalo de nuevo` y no presentar resultados anteriores como actuales.
- **Error de validación:** para un rango invertido, mostrar `La fecha de inicio no puede ser posterior a la fecha de fin.` y conservar el último rango válido.
- **Sin datos:** si el intervalo válido no contiene movimientos, mostrar `No hay datos disponibles para el período seleccionado`; mantener visibles filtro y límites, sin métricas ni gráficos obsoletos.

## Criterios de aceptación

1. Los dos controles aparecen en la parte superior junto a `min_date` y `max_date` disponibles.
2. Cada fecha puede quedar vacía; las definidas se envían como `start_date`/`end_date` en formato `YYYY-MM-DD`.
3. Cambiar una fecha actualiza automáticamente el dashboard si el rango es válido; sin fechas se muestran todos los movimientos y el encabezado dice `Todo el período`.
4. Un límite único aplica solo esa fecha; dos límites incluyen ambos extremos y filtran los cuatro KPI y ambos gráficos con el mismo conjunto.
5. El encabezado representa el rango activo con ambas fechas, una sola fecha o `Todo el período` según los requisitos.
6. Un rango invertido muestra `La fecha de inicio no puede ser posterior a la fecha de fin.`, no se aplica y conserva el último rango válido.
7. Un rango válido sin movimientos muestra `No hay datos disponibles para el período seleccionado`, sin resultados de otro rango.
8. Durante la carga se indica el estado; un error de datos o facetas muestra `No se pudieron cargar los datos financieros. Inténtalo de nuevo`.
9. El rango seleccionado se conserva al navegar a la página comparativa y regresar.

## Fuera de alcance

- Cambiar fórmulas financieras, semántica de zona horaria o datos generados por el backend.
- Alertas de anomalías y la vista comparativa B2B/B2C.
- Añadir o cambiar endpoints o el contrato de la API.

## Decisiones pendientes


---

## Funcionalidad 2: tabla de alertas de anomalías

### Objetivo y usuario

Ayudar al equipo de finanzas a identificar períodos con incrementos inesperados del gasto y comparar el gasto registrado con la media móvil requerida.

### Historia de usuario

Como integrante del equipo de finanzas, quiero ver bajo los gráficos los períodos en los que el gasto supera un umbral configurable respecto de la media de los tres períodos anteriores, para detectar anomalías dentro del rango seleccionado.

### Componente propuesto y props

**Componente:** `AnomalyAlertsTable`, ubicado debajo de los gráficos existentes del dashboard.

Contrato conceptual de props, alineado con los tipos de Fase 2:

| Prop | Tipo | Significado |
|---|---|---|
| `alerts` | `AlertsResponse` (`frontend/specs/api-types.ts`) | Alertas recibidas; cada entrada usa `AlertEntry`. |
| `threshold` | `NonNullable<AlertsParams["threshold"]>` (`frontend/specs/param-types.ts`) | Umbral numérico activo, limitado por el requisito del PM a `0.01–1.0`; valor inicial `0.3`. |
| `dateRange` | `DateRangeFilter` (`frontend/specs/param-types.ts`) | Rango activo de la Funcionalidad 1 que delimita las alertas solicitadas. |
| `loading` | `boolean` | Indica que se están cargando o actualizando alertas. |
| `error` | `string \| null` | Error de carga que debe mostrarse al usuario. |
| `onThresholdChange` | `(value: number) => void` | Comunica el nuevo umbral seleccionado. |
| `onDateRangeChange` | `(value: DateRangeFilter) => void` | Mantiene el rango compartido con la Funcionalidad 1. |

### Requisitos funcionales

1. Mostrar la tabla debajo de los gráficos actuales del dashboard.
2. Presentar cuatro columnas: período (`period`), outcome registrado (`outcome_total`), media móvil de los tres períodos inmediatamente anteriores e incremento porcentual (`increase_ratio`).
3. Evaluar períodos mensuales (`group_by=month`, default del endpoint); esta funcionalidad no ofrece un selector de granularidad.
4. Exigir tres períodos anteriores para calcular la media móvil; si faltan tres períodos o la media es cero, no generar alerta.
5. Calcular el incremento como `(outcome_actual - media_móvil) / media_móvil`; generar alerta solo cuando supere el umbral y mostrarlo como porcentaje.
6. Permitir configurar un umbral entre `0.01` y `1.0`, inclusive, con valor inicial `0.3`; rechazar valores fuera del intervalo.
7. Enviar `threshold` y respetar `start_date`/`end_date` de la Funcionalidad 1 para determinar qué alertas se muestran.
8. Permitir que períodos anteriores al inicio del rango calculen la referencia, pero mostrar únicamente alertas cuyo período pertenezca al rango seleccionado.
9. Si no se generan alertas, mostrar un mensaje explícito de estado vacío que indique que no se detectaron anomalías para el período seleccionado.

### Estados

- **Carga:** indicar que las alertas se están cargando o actualizando y no presentar filas antiguas como si correspondieran al umbral o rango recién seleccionado.
- **Error:** si falla la consulta, informar que no se pudieron cargar las alertas y conservar visibles el rango y el umbral seleccionados.
- **Sin anomalías:** cuando no haya entradas, mostrar un mensaje explícito de ausencia de anomalías para el período seleccionado; no mostrar filas obsoletas.

### Incompatibilidad verificada con el backend

❌ El requisito exige la media móvil de exactamente los tres períodos anteriores. En `backend/app/routes.py`, `detect_outcome_alerts()` calcula `baseline_average` como la media de **todos** los períodos anteriores que recibe, no de una ventana fija de tres.
❌ `get_metrics_alerts()` filtra los movimientos por fechas antes de resumirlos y calcular el baseline; la API actual no puede usar períodos anteriores a `start_date` para la referencia cuando el filtro está activo.

❌ OpenAPI acepta `threshold` desde `0` (`minimum: 0`) y no publica un máximo, mientras que el requisito del PM limita el valor a `0.01–1.0`. El default `0.3` sí coincide. `AlertsParams.threshold` es `number` y no expresa esos límites estáticamente; la especificación mantiene como regla funcional el intervalo del PM.

✅ La respuesta de alertas utiliza `period`, `outcome_total`, `baseline_average` e `increase_ratio` según `frontend/specs/api-types.ts`. El backend calcula el ratio como `(outcome_actual - baseline) / baseline` y solo genera alerta si el baseline es mayor que cero y el ratio supera estrictamente el umbral (`detect_outcome_alerts()` en `backend/app/routes.py`). Para cumplir la columna porcentual, el sistema debe presentar el ratio como porcentaje, sin confundir el ratio decimal del contrato con un valor ya multiplicado por 100.

### Criterios de aceptación

1. La tabla aparece debajo de los gráficos con período, outcome registrado, baseline de tres períodos e incremento porcentual.
2. El baseline de cada período es la media aritmética de exactamente sus tres períodos mensuales inmediatamente anteriores.
3. Con menos de tres períodos previos o una media igual a cero no se genera alerta.
4. El incremento se calcula respecto al baseline móvil, se muestra como porcentaje y genera alerta solo si supera el umbral.
5. El umbral inicial es `0.3`; se aceptan valores de `0.01` a `1.0`, inclusive, y se rechazan los demás.
6. El historial anterior al rango puede contribuir al baseline, pero solo se muestran alertas cuyo período pertenece al rango activo de la Funcionalidad 1.
7. Si no hay alertas, se muestra un mensaje explícito de ausencia de anomalías para el rango seleccionado.
8. Durante la carga se indica el estado; si falla la consulta se informa el error y no se presentan filas obsoletas.

### Fuera de alcance

- Cambiar los criterios del PM para adaptarlos al baseline acumulativo actual.
- Definir o cambiar endpoints, el contrato de respuesta o fórmulas financieras distintas de la anomalía descrita.
- La vista comparativa B2B/B2C y otros tipos de alertas.


### Decisiones resueltas

- Se requieren tres períodos anteriores; con menos de tres o baseline cero no se genera alerta. El historial previo al rango puede calcular la referencia, pero las alertas visibles deben pertenecer al rango seleccionado.

---

## Funcionalidad 3: vista comparativa B2B vs B2C

### Objetivo y usuario

Permitir al equipo de finanzas comparar los ingresos de las líneas B2B y B2C, tanto por categorías principales como en el total del período seleccionado.

### Historia de usuario

Como integrante del equipo de finanzas, quiero comparar en una página B2B y B2C dentro de un rango de fechas, para reconocer qué categorías generan más ingresos y cómo se relacionan los ingresos totales de ambos grupos.

### Componentes propuestos y props

**Página:** `BusinessComparisonPage`, una nueva página del dashboard con filtro de fechas, dos secciones de ingresos y un gráfico comparativo.

**Sección de tabla:** `BusinessRevenueSection`, una instancia por línea de negocio.

| Prop de `BusinessRevenueSection` | Tipo | Significado |
|---|---|---|
| `businessType` | `BusinessType` (`frontend/src/lib/financial-types.ts`) | Línea identificada como `B2B` o `B2C`. |
| `categories` | `TopCategoriesResponse` (`frontend/specs/api-types.ts`) | Hasta cinco categorías reales de ingresos recibidas para esa línea y rango; sin filas ni categorías sin ingresos inventadas. |
| `totalIncome` | `number` | Ingresos completos del grupo en el rango; denominador para los porcentajes de categoría. |

**Props conceptuales de `BusinessComparisonPage`:**

| Prop | Tipo | Significado |
|---|---|---|
| `dateRange` | `DateRangeFilter` (`frontend/specs/param-types.ts`) | Rango activo, opcional y compartido por las consultas de comparación. |
| `facets` | `FacetsResponse \| null` (`frontend/specs/api-types.ts`) | Categorías disponibles y demás facetas de la API. |
| `b2bCategories`, `b2cCategories` | `TopCategoriesResponse` (`frontend/specs/api-types.ts`) | Filas de ingresos por categoría para cada línea. |
| `b2bTotalIncome`, `b2cTotalIncome` | `number` | Ingresos completos por grupo, usados en tablas y gráfico. |
| `loading` | `boolean` | Indica carga o actualización de los datos comparativos. |
| `error` | `string \| null` | Error que impide completar la comparación. |
| `onDateRangeChange` | `(value: DateRangeFilter) => void` | Comunica el rango seleccionado, con fechas `YYYY-MM-DD`. |

**Gráfico:** `BusinessRevenueComparisonChart`, situado debajo de ambas secciones, recibe `b2bTotalIncome: number` y `b2cTotalIncome: number`.

### Contrato de datos verificado

- `GET /api/metrics/categories/top` admite `business_type`, `operation_type`, `limit`, `start_date` y `end_date`. Para cada grupo, la consulta debe representar ingresos (`operation_type=income`), solicitar hasta cinco categorías (`limit=5`) y aplicar el rango activo. La respuesta `TopCategoriesResponse` contiene `category`, `operation_type` y `total_amount`.
- `GET /api/metrics/facets` expone `categories`; la lista es global y no está filtrada por negocio ni por tipo de operación.
- `GET /api/metrics/summary` admite `business_type`, `start_date`, `end_date` y `group_by` (default `month`). Devuelve entradas por período con `period`, `income`, `outcome` y `net`, no un total global. Para cada línea, el total del rango se obtiene agregando el campo `income` de todos los períodos de la respuesta. El porcentaje de cada categoría usa ese total completo como denominador, no la suma de las filas top.
- La respuesta OpenAPI de `summary` usa `MetricsSummaryItem` con `period: string`, `income: number`, `outcome: number` y `net: number`. Ese tipo aún no existe en TypeScript; deberá definirse para la futura implementación y no se considera disponible en Fase 2.

### Requisitos funcionales

1. Ofrecer una nueva página del dashboard dedicada a comparar ingresos B2B y B2C, accesible desde la navegación del dashboard y con acceso para volver.
2. Mostrar dos secciones en paralelo: una identificada como B2B y otra como B2C.
3. En cada sección, mostrar hasta cinco categorías principales reales de ingresos, sin inventar filas ni incluir categorías sin ingresos, con columnas de categoría, total de ingresos y porcentaje del total completo del grupo.
4. Obtener las categorías disponibles de `GET /api/metrics/facets` y las categorías con ingresos de `GET /api/metrics/categories/top`, filtrando por `business_type`, `operation_type=income`, `limit=5` y rango activo.
5. Aplicar el filtro de fechas con `start_date` y `end_date` opcionales en formato `YYYY-MM-DD`, compartirlo con la Funcionalidad 1 y conservarlo al navegar entre páginas.
6. Obtener el total completo de ingresos de cada grupo desde `GET /api/metrics/summary`, filtrado por `business_type` y por el mismo rango; agregar los valores `income` de todos los períodos devueltos.
7. Calcular cada porcentaje respecto al total completo de ingresos de su grupo; si el total es cero, mostrar `—`. Las categorías principales no sustituyen ni definen ese total.
8. Mostrar debajo de ambas tablas un único gráfico que compare `b2bTotalIncome` con `b2cTotalIncome` para el mismo rango.

### Estados

- **Carga:** indicar que se están cargando o actualizando las facetas, categorías y totales; evitar presentar mezclas de rangos o datos anteriores como actuales.
- **Error:** informar cuando fallen las consultas necesarias para completar la comparación y no presentar un gráfico o porcentajes como si fueran resultados completos.
- **Sin datos:** si un grupo no tiene ingresos en el rango, mostrar un estado explícito para ese grupo; si ninguno tiene ingresos, mostrar un estado vacío para la comparación. Mantener disponible el filtro de fechas.

### Discrepancias y límites verificados

- ✅ `categories/top` devuelve categorías con ingresos observados, ordenadas hasta `limit`; puede devolver menos de cinco. El generador demo (`_build_movement()` en `backend/app/routes.py`) asigna ingresos solo a `sales` y `others`. Esto es compatible con mostrar hasta cinco categorías reales, sin inventar filas ni incluir categorías sin ingresos.
- ✅ `get_metrics_summary()` en `backend/app/routes.py` filtra por `business_type` y fechas y entrega ingresos por período. La suma de `income` obtiene el total del rango; no existe en esa respuesta un campo agregado de total global.
- ✅ `facets.categories` es una lista global de categorías disponibles; las filas se limitan a categorías reales con ingresos devueltas por `categories/top` para cada grupo.
- ✅ Si el total de ingresos del grupo es cero, se muestra `—` en la columna de porcentaje.

### Criterios de aceptación

1. La nueva página tiene acceso visible desde la navegación del dashboard y permite volver conservando el rango elegido.
2. Presenta dos secciones paralelas, B2B y B2C, con hasta cinco categorías principales reales por grupo y las tres columnas solicitadas.
3. Cada tabla incluye únicamente categorías con ingresos devueltas por `categories/top` para su grupo, tipo `income`, límite cinco y rango; no inventa filas ni categorías sin ingresos.
4. El total completo se obtiene sumando `income` de los `MetricsSummaryItem` de cada grupo y período; no se calcula sumando las categorías principales.
5. El porcentaje usa el total completo del grupo como denominador y muestra `—` cuando ese total es cero.
6. Las facetas de categorías proceden de `facets`; las fechas opcionales usan `start_date`/`end_date` en `YYYY-MM-DD` y el rango se conserva al navegar entre páginas.
7. Debajo de las tablas aparece un único gráfico que compara los ingresos completos B2B y B2C del rango activo.
8. Durante la carga se indica el estado; ante errores se informa que la comparación no pudo completarse; sin ingresos se muestra el estado vacío correspondiente.
9. La documentación de `summary` identifica los campos y tipos de `MetricsSummaryItem` y deja claro que aún falta su tipo TypeScript para la futura implementación.

### Fuera de alcance

- Cambiar los endpoints o añadir un total global que no forma parte del contrato actual.
- Sustituir el total de ingresos del grupo por la suma de las categorías top.
- La media móvil y alertas de la Funcionalidad 2, así como KPI ajenos a ingresos.

### Comportamiento aún por precisar

### Decisiones resueltas
- Se muestran hasta cinco categorías reales por grupo, sin inventar filas ni incluir categorías sin ingresos; con total cero, el porcentaje es `—`.
