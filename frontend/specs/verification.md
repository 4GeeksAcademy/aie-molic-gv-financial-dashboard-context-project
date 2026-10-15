# Verificación de requisitos y API

## Objetivo y alcance

Cerrar la Fase 1 contrastando los requisitos originales del PM con el OpenAPI servido actualmente y con la lógica/pruebas backend. No se modifica ni adapta el requisito para ajustarlo a la API. OpenAPI se consultó en `http://localhost:8000/openapi.json` (HTTP 200, OpenAPI 3.1.0); la lógica se contrastó en `backend/app/routes.py` y `backend/tests/test_routes.py`.

## Endpoints y contratos comprobados

| Endpoint | Parámetros OpenAPI | Respuesta OpenAPI |
|---|---|---|
| `GET /api/metrics` | `start_date`, `end_date`: query opcional `string/date` nullable; `category`: opcional, nullable, enum `suppliers\|sales\|operational\|administrative\|others`; `operation_type`: opcional, nullable, enum `income\|outcome`. Sin defaults publicados. | `200`: array `FinancialMovement` (`create_date`, `amount`, `operation_type`, `category`, `business_type`, todos requeridos). `422`: `HTTPValidationError`. |
| `GET /api/metrics/facets` | Sin parámetros. | `200`: `MetricsFacets`; requeridos `operation_types`, `business_types`, `categories`, `min_date`, `max_date`. No publica respuesta `422`. |
| `GET /api/metrics/alerts` | `threshold`: number, default `0.3`, mínimo `0`; `group_by`: enum `day\|week\|month`, default `month`; `start_date`, `end_date`: opcionales nullable `string/date`; `business_type`: opcional nullable enum `B2B\|B2C`. | `200`: array `MetricsAlert` con `period`, `outcome_total`, `baseline_average`, `increase_ratio`. `422`: `HTTPValidationError`. |
| `GET /api/metrics/categories/top` | `operation_type`: enum `income\|outcome`, default `outcome`; `limit`: integer, default `5`, mínimo `1`, máximo `20`; `start_date`, `end_date`: opcionales nullable `string/date`; `business_type`: opcional nullable enum `B2B\|B2C`. | `200`: array `TopCategoryItem` con `category`, `operation_type`, `total_amount`. `422`: `HTTPValidationError`. |
| `GET /api/metrics/summary` (relevante al total comparativo) | `group_by` (`day\|week\|month`, default `month`), fechas opcionales, `category`, `operation_type` y `business_type` opcionales. | `200`: array `MetricsSummaryItem` (`period`, `income`, `outcome`, `net`). `422`: `HTTPValidationError`. |

Los parámetros opcionales de fechas y negocio no publican valor default explícito en el OpenAPI servido. Las respuestas `422` documentan validación, pero no enumeran mensajes/casos de error concretos.

## Trazabilidad requisito–API

| Requisito original del PM | Capacidad verificada | Estado y evidencia |
|---|---|---|
| **Filtro:** dos fechas opcionales `YYYY-MM-DD`; ambos vacíos muestran todo; filtrar lo existente; mostrar mínimo/máximo disponibles. | `/api/metrics` acepta ambas fechas opcionales `date`; `/api/metrics/facets` entrega `min_date`/`max_date`. En `filter_movements_by_date()` los límites se comparan inclusivamente (`>=`, `<=`); con ambos `None` devuelve movimientos sin filtrar. | ✅ Contrato y comportamiento de filtrado en `backend/app/routes.py` (`get_metrics()`, `filter_movements_by_date()`, `get_metrics_facets()`). ✅ Pruebas de bordes y filtrado en `test_filter_movements_by_date_includes_range_edges()` y `test_metrics_endpoint_respects_date_filters()` de `backend/tests/test_routes.py`. ❓ El formato ISO calendario `YYYY-MM-DD` se publica como `string/date`; la presentación en inputs y la aplicación a todos los elementos de UI pertenecen al frontend y no están verificadas aquí. |
| **Alertas:** columnas período, gasto registrado, media móvil de 3 períodos y porcentaje; umbral `0.01–1.0`, default `0.3`; estado vacío explícito; respetar rango. | `/api/metrics/alerts` acepta fechas y threshold default `0.3`, pero OpenAPI solo fija mínimo `0`. `MetricsAlert` aporta `period`, `outcome_total`, `baseline_average`, `increase_ratio`. `get_metrics_alerts()` filtra fechas antes de resumir y detectar alertas. | ❌ Desajuste: `detect_outcome_alerts()` calcula la media de **todos** los períodos anteriores disponibles en el resumen filtrado, no una ventana de tres. ❌ El backend admite threshold desde `0`, sin máximo; no aplica el rango PM `0.01–1.0`. ✅ La fórmula es `(outcome_actual - baseline) / baseline`; alerta solo si baseline `> 0` y ratio `> threshold`. Sin historial previo o con baseline cero no genera alerta. Evidencia: `detect_outcome_alerts()` y `get_metrics_alerts()` en `backend/app/routes.py`. ❓ La UI de tabla y estado vacío no existen en API. |
| **Comparativa:** vistas paralelas B2B/B2C, cinco categorías de ingresos, porcentaje del total de grupo, gráfico de total ingresos, filtro de fechas y categorías de facets. | `categories/top` acepta un único `business_type`, `operation_type=income`, `limit=5` y fechas; devuelve categorías ordenadas con `total_amount`. `facets` expone categorías y tipos de negocio. `summary` filtra por `business_type` y fechas y devuelve ingresos por período. | ✅ Se pueden consultar B2B y B2C por separado en `get_top_categories()`; los valores superiores son los importes de las cinco categorías, no un campo de total global. ❌ Ninguna de esas respuestas da directamente el total completo del grupo; `summary` da `income` por período, que se puede agregar para el período solicitado. No sumar las categorías top como sustituto del total explícito. Evidencia: `get_top_categories()`, `build_top_categories()`, `get_metrics_summary()` y `summarize_movements()` en `backend/app/routes.py`. ❓ El gráfico, porcentajes, maquetación y navegación son frontend, no contrato API. |

## Desajustes y aspectos no verificados

- ❌ La media de alertas pedida por el PM (tres períodos) contradice el baseline acumulativo actual.
- ❌ El rango de umbral pedido por el PM es más restrictivo que la validación backend publicada (`>= 0`, sin máximo). El default coincide.
- ✅ `start_date`/`end_date` invertidas o sin coincidencias dejan una lista vacía en `/api/metrics`: resultado de las comparaciones en `filter_movements_by_date()` y retorno de `get_metrics()`. ❓ No existe prueba explícita de rangos invertidos o sin datos; las pruebas cubren un intervalo con resultados.
- ❓ Alertas: no hay prueba de regresión para media, ratio, historial insuficiente, baseline cero o comparación estricta con threshold. `test_metrics_alerts_returns_anomaly_candidates()` solo comprueba status/shape.
- ❓ Al aplicar rango a alertas, `get_metrics_alerts()` recorta movimientos antes de calcular períodos y baseline; no se ha especificado si el historial anterior al rango debe contar para la media móvil requerida.
- ❓ OpenAPI no fija reglas de calendario como `start_date <= end_date`, ni especifica mensajes de error. No se debe inferir una política distinta de la lista vacía que produce el filtrado actual.

## Implicaciones para las futuras especificaciones

- ✅ Mantener separados los requisitos PM y los límites actuales del backend; documentar explícitamente la media móvil de tres períodos y el rango de threshold solicitado como cambios de comportamiento respecto a lo existente.
- ✅ Precisar si el baseline de alertas puede usar períodos anteriores al rango seleccionado y cómo representar `increase_ratio` como porcentaje en la columna.
- ✅ Definir cómo obtener/mostrar el total completo por grupo usando el agregado `summary`, sin confundirlo con `total_amount` de las cinco categorías principales.
- ❓ Especificar estados vacíos, validación/presentación de fechas y resultados sin datos para los elementos frontend; la API no define esos detalles de interfaz.
