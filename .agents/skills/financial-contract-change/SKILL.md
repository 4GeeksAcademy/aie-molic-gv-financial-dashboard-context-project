---
name: financial-contract-change
description: Coordinate approved changes to this dashboard's financial API contract, Pydantic and TypeScript movement types, KPI formulas, API consumers, and tests. Trigger when a request changes financial fields, allowed values, filters, response shapes, aggregation, or the meaning of income, expenses, profit, or margin. Do not use for isolated UI styling, generic FastAPI/React questions, or changes that do not affect financial data, calculations, or API contracts.
---

# Financial Contract Change

## Objetivo

Implementar cambios aprobados al contrato o comportamiento financiero sin desalinear FastAPI, TypeScript, cálculos, consumidores ni pruebas. No inventar requisitos ni cambiar fórmulas, zona horaria, datos mock o semántica financiera sin confirmación explícita.

## Entradas

Necesarias:
- Requisito concreto y resultado financiero/API esperado.
- Indicación de si cambia el contrato público, el cálculo, o ambos.

Opcionales:
- Ejemplos de requests/responses antes y después.
- Casos límite y política esperada para fechas, redondeos o valores nulos.
- Endpoints y consumidores conocidos.

Si el requisito no define el significado del cambio —especialmente zona horaria, margen, redondeo o comportamiento cuando ingresos son cero—, hacer una pregunta antes de editar.

## Salidas esperadas

- Cambios coordinados solo en las capas afectadas, con lista de archivos.
- Pruebas actualizadas con entradas y resultados esperados.
- Comandos ejecutados, resultados y limitaciones del entorno.
- Confirmación explícita de que no se alteraron reglas financieras fuera del requisito.

## Procedimiento

1. **Leer el contexto vigente.** Consultar `AGENTS.md`, `.agents/rules/frontend.md`, `.agents/rules/backend.md` y `memory-bank/product.md`. Verificar después el código y tests actuales; no tratar como vigentes observaciones históricas de `verification.md` sin reproducirlas.

2. **Clasificar el cambio.** Determinar si afecta a campos/valores, parámetros de consulta, formato de respuesta, filtrado, generación/agregación o fórmula. Si no afecta datos financieros ni contrato, no aplicar esta skill.

3. **Mapear contrato y consumidores antes de editar.** Revisar conjuntamente:
   - Backend: `backend/app/routes.py`, sus modelos Pydantic, aliases `Literal`, parámetros `Query` y `response_model`.
   - Frontend: `frontend/src/lib/financial-types.ts`, `frontend/src/App.tsx` y búsqueda de consumidores de `fetch`, `/api/` u otros clientes HTTP en `frontend/src`.
   - Cálculos: `frontend/src/lib/financial-utils.ts` y, si aplica, funciones de métricas en `backend/app/routes.py`.
   - Pruebas cercanas en `backend/tests/` y `frontend/src/lib/`.

   La pantalla actual consume `GET /api/metrics`; no asumir que los demás endpoints backend tienen consumidores en la UI.

4. **Acordar la semántica, sin inferirla.** Mantener los campos compartidos actuales (`create_date`, `amount`, `operation_type`, `category`, `business_type`) y los valores permitidos hasta que el requisito aprobado indique lo contrario. El beneficio actual es ingresos menos gastos; el margen es beneficio / ingresos * 100 y vale cero si los ingresos son cero. La agrupación frontend usa fechas locales y la zona horaria contable no está definida: pedir confirmación antes de cambiarla.

5. **Actualizar las capas necesarias en conjunto.** Si cambia el contrato, coordinar modelo/validación Pydantic, tipos TypeScript y consumidores. Mantener `response_model`, `Literal`, defaults y límites `Query` salvo que el requisito los cambie. Si cambia una fórmula, centralizarla en `frontend/src/lib/financial-utils.ts`; no duplicarla en componentes. Preservar `generate_mock_movements(seed=42)` y sus expectativas de reproducibilidad salvo requisito explícito.

6. **Añadir pruebas según el impacto.**
   - Para lógica o fórmulas frontend, ampliar `frontend/src/lib/financial-utils.test.ts` con fixtures `FinancialMovement` tipados y resultados numéricos explícitos; incluir el caso normal y los límites afectados, como ingresos cero o cruce de año.
   - Para rutas/validación backend, ampliar `backend/tests/test_routes.py` con `TestClient`, status HTTP, forma/contenido del payload, filtros y valores inválidos relevantes.
   - Para cambios compartidos, cubrir ambos lados y comprobar que los nombres y valores del JSON coinciden con TypeScript.
   - No inventar zonas horarias ni expectativas de redondeo para hacer pasar un test: resolverlas con el requisito primero.

7. **Verificar según el entorno y el alcance.** Desde `backend/`, ejecutar `pytest` (pytest está en `backend/requirements.txt`). Desde `frontend/`, ejecutar `npm test`; ejecutar `npm run build` si se modifican tipos, consumidores o código de compilación. Confirmar que las dependencias están disponibles en ese entorno; si un comando no arranca, reportarlo como bloqueado, no como test fallido ni como código defectuoso. Ejecutar lint si se modificaron componentes o presentación.

## Criterios de aceptación

- Se inspeccionaron modelo Pydantic, tipos TypeScript y consumidores afectados antes de editar.
- Contrato, validación y payload quedan alineados en ambos lados; no se cambió un solo lado de un contrato compartido.
- Las fórmulas siguen centralizadas y cualquier cambio de negocio tiene definición aprobada y tests con valores esperados.
- Las pruebas backend/frontend pertinentes se ejecutaron o sus bloqueos se reportaron con precisión.
- Se conservaron semilla y semánticas existentes no incluidas explícitamente en el requisito.
- El resumen distingue cambios realizados, tests ejecutados y cuestiones aún sin definir.

## Ejemplo práctico

Si un requisito aprobado cambia la definición del margen, primero confirmar su fórmula y qué debe ocurrir con ingresos iguales a cero. Hoy `computeKPIs` y `computeMonthlyData` calculan `(income - outcome) / income * 100`; el test de `computeKPIs` espera `1250` de beneficio sobre `1500` de ingresos y el test sin ingresos espera margen `0`. Actualizar la fórmula centralizada y todas las ubicaciones que calculen ese mismo indicador, modificar esos resultados esperados y añadir los límites pertinentes en `frontend/src/lib/financial-utils.test.ts`. Si el cambio también altera una respuesta API, coordinar el modelo/endpoint en `backend/app/routes.py`, el tipo en `frontend/src/lib/financial-types.ts` y pruebas de `backend/tests/test_routes.py`; ejecutar `npm test`, `npm run build` y `pytest` según el alcance. No cambiar el significado por iniciativa propia.