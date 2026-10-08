# Reglas del backend

## Objetivo

Preservar los contratos, la validación, la reproducibilidad de datos y las pruebas de la API financiera.

## Justificación

El backend usa FastAPI y Pydantic. Los modelos y tipos restringidos definen los movimientos y las respuestas; las rutas exponen filtros tipados y las pruebas usan `TestClient` para verificar tanto códigos HTTP como contenido y filtros.

## Reglas

### Arquitectura y nomenclatura

- `backend/app/main.py` crea la aplicación FastAPI e incluye el router; las rutas, modelos y funciones de métricas actuales están en `backend/app/routes.py`.
- Sigue la nomenclatura observada: funciones y rutas en snake_case, modelos Pydantic en PascalCase y aliases de tipos con nombres descriptivos.
- Mantén pruebas backend en `backend/tests/`, junto al patrón existente de pruebas de funciones y endpoints.

### Contratos y validación

- Define los movimientos y respuestas con modelos Pydantic y conserva `response_model` en las rutas que lo usan.
- Mantén los valores restringidos con los aliases `Literal` existentes: `OperationType`, `Category`, `BusinessType` y `GroupBy`.
- Conserva los tipos, nombres, valores por defecto y restricciones de los parámetros `Query`; verifica los consumidores frontend antes de cambiar el contrato.
- Coordina cambios de campos o valores con `frontend/src/lib/financial-types.ts` y sus pruebas.

### Datos de demostración

- Las rutas actuales generan datos de demostración usando `generate_mock_movements(seed=42)`. Conserva la reproducibilidad que requieren los tests.
- El generador usa `random.seed(seed)`, que modifica el estado aleatorio global. Ten en cuenta ese efecto al cambiarlo o reutilizar aleatoriedad en el proceso.
- Las fechas se calculan a partir de `date.today()` y no representan necesariamente un año fijo ni datos persistidos.

### Pruebas

- Para endpoints, usa el `TestClient` de FastAPI y comprueba el estado HTTP y el contenido relevante del payload, incluidos filtros u orden si aplican.
- Para cambios en generación o cálculos, conserva o amplía las pruebas de cantidad, orden, límites y resultados esperados.
- Las pruebas están en `backend/tests/`; pytest figura en `backend/requirements.txt`. No hay un script backend dedicado documentado en el manifiesto frontend o README, así que confirma el entorno antes de añadir un comando oficial.

### Errores y validación de entrada

- Deja que FastAPI valide las entradas de acuerdo con las anotaciones, aliases `Literal`, `Query` y modelos de respuesta existentes.
- Al cambiar parámetros o respuestas, actualiza las pruebas que demuestran el comportamiento válido y los filtros afectados.

## Ejemplo correcto e incorrecto

El endpoint actual restringe el tipo de operación y valida la respuesta con el modelo de movimiento:

```py
OperationType = Literal["income", "outcome"]

class FinancialMovement(BaseModel):
    create_date: date
    amount: float
    operation_type: OperationType
    category: Category
    business_type: BusinessType

@router.get("/api/metrics", response_model=list[FinancialMovement])
def get_metrics(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    category: Category | None = Query(default=None),
    operation_type: OperationType | None = Query(default=None),
) -> list[FinancialMovement]:
    movements = generate_mock_movements(seed=42)
    filtered = filter_movements(
        movements, start_date, end_date, category, operation_type
    )
    return ensure_chronological_order(filtered)
```

No relajes el campo a una cadena arbitraria:

```py
class FinancialMovement(BaseModel):
    operation_type: str
```

La segunda variante acepta valores fuera del contrato que el frontend modela como `"income" | "outcome"`. Referencia del patrón: `backend/app/routes.py` y `frontend/src/lib/financial-types.ts`.
