# Reglas del frontend

## Objetivo

Mantener la arquitectura, los contratos y los cálculos existentes del frontend al ampliar el dashboard financiero.

## Justificación

La aplicación separa los componentes del dashboard, componentes reutilizables, tipos y utilidades. `App.tsx` carga los movimientos de la API; las utilidades financieras preparan los KPI y las series mensuales. Los componentes y sus props tienen tipos explícitos y hay pruebas Vitest para las fórmulas principales.

## Reglas

### Arquitectura y nomenclatura

- Coloca componentes propios del dashboard en `frontend/src/components/dashboard/` y elementos reutilizables en `frontend/src/components/ui/`.
- Sigue el patrón observado en los componentes: archivos kebab-case, componentes exportados PascalCase e interfaces de props declaradas junto al componente.
- Mantén los tipos y utilidades compartidas en `frontend/src/lib/`; evita duplicar cálculos en componentes de presentación.

### Datos y dominio

- Usa los tipos de `frontend/src/lib/financial-types.ts`. Los valores existentes incluyen `income`/`outcome`, las categorías `suppliers`, `sales`, `operational`, `administrative`, `others` y los tipos `B2B`/`B2C`.
- Si cambia el contrato financiero, coordina el cambio con los modelos y validaciones del backend; no renombres campos ni valores solo en el frontend.
- `create_date` llega como fecha ISO. El código agrupa con getters locales, pero el repositorio no define una zona horaria contable. Confirma el requisito antes de cambiar el parseo o la agrupación.

### Cálculos

- Centraliza los cálculos financieros en `frontend/src/lib/financial-utils.ts`.
- Conserva la definición probada: beneficio = ingresos - gastos; margen = beneficio / ingresos * 100, o cero si no hay ingresos.
- Cuando cambies una fórmula, actualiza o añade pruebas con entradas y resultados esperados explícitos.

### Errores y carga

- Al cambiar la carga de datos en `App.tsx`, conserva la comprobación de `response.ok`, el estado de error y la finalización del estado de carga incluso si la petición falla.
- La interfaz actual presenta un mensaje genérico; no presupongas que el usuario ve el detalle técnico de la respuesta.

### Pruebas

- Usa Vitest para las utilidades frontend y sigue el patrón existente de fixtures tipados y aserciones sobre resultados.
- Para cambios de cálculos, cubre al menos el resultado normal y las condiciones límite que afecten a la fórmula, como ingresos iguales a cero.

### DX y configuración

- En desarrollo, `frontend/vite.config.ts` reenvía `/api` a `http://backend:8000`; coordina cambios de ruta o puerto con el servicio `backend` de Compose.
- Compose monta el código en `/app` y un volumen anónimo separado en `/app/node_modules`. No asumas que las dependencias del host y las del contenedor comparten el mismo directorio.
- Los scripts disponibles están definidos en `frontend/package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run test:watch` y `npm run test:coverage`.

## Ejemplo correcto e incorrecto

El código actual protege la división por cero y sigue la fórmula cubierta por las pruebas:

```ts
const profit = totalIncome - totalOutcome;
const profitPercent = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
```

No reemplaces el margen por el porcentaje de gastos ni elimines la guarda:

```ts
const profitPercent = (totalOutcome / totalIncome) * 100;
```

La segunda variante calcula otra métrica y puede dividir por cero. Referencia del patrón: `frontend/src/lib/financial-utils.ts` y `frontend/src/lib/financial-utils.test.ts`.
