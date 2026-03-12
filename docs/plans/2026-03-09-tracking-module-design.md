# Diseño: Módulo de Tracking

> **Fecha:** 2026-03-09
> **Estado:** Pendiente de aprobación

---

## Resumen

Sistema de registro de movimientos de viajes para dos depósitos (PL2 y PL3). Cada depósito gestiona viajes B2C y B2B con columnas diferentes pero estados compartidos. Todos los roles tienen acceso.

## Flujo de Navegación

```
/tracking → Selector de Depósito (PL2 | PL3) → Tabs (B2C | B2B) → Tabla de viajes
```

**Pantalla de selección de depósito:** Dos tarjetas grandes para elegir PL2 o PL3.
**Dentro del depósito:** Tabs superiores B2C / B2B, cada uno con su tabla y botón para agregar registro.

---

## Esquema de Datos

### Estados compartidos (B2C y B2B)

| Valor | Etiqueta |
|-------|----------|
| `released` | Liberado |
| `pending` | Pendiente |
| `picking` | Pickeando |
| `closing_pending_invoice` | Cerrando Pnd Fac |
| `invoiced` | FAC |
| `cancelled` | Cancelado |

### Columnas B2C

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Fecha | `date` | Fecha del viaje |
| Transporte | `select` (predefinido) | Empresa de transporte |
| Viaje | `string` (6 dígitos) | Número de viaje |
| Operario/os | `multi-select` (predefinido) | Personal asignado |
| Cant. Pallets | `number` (max 2 dígitos) | Pallets del viaje |
| Puerto | `string` (alfanumérico) | Dársena asignada |
| Cant/Tareas | `number` | Cantidad de tareas |
| Estado | `select` (6 estados) | Estado actual |
| Pallets Despachados | `number` (max 2 dígitos) | Pallets ya despachados |
| Etiquetador | `select` (predefinido) | Personal que etiqueta |
| Papeles | `boolean` | Documentación impresa |

### Columnas B2B

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Fecha | `date` | Fecha del viaje |
| Transporte | `select` (predefinido) | Empresa de transporte |
| Dominio | `string` | Patente del vehículo |
| Viaje | `string` | Número de viaje |
| Cliente | `string` | Nombre del cliente |
| Turno en el cliente | `string` | Franja horaria u otra info |
| Cant/Tareas | `number` | Cantidad de tareas |
| Puerto | `string` (alfanumérico) | Dársena asignada |
| Pallets | `number` (max 2 dígitos) | Cantidad de pallets |
| Operario/os | `multi-select` (predefinido) | Personal asignado |
| Papeles | `boolean` | Documentación impresa |
| Detalle | `text` | Texto libre |
| Comentarios | `text` | Texto libre |
| Carga Granel | `boolean` | Si es carga a granel |
| Estado | `select` (6 estados) | Estado actual |

### Listas predefinidas (configurables por Admin)

- **Transportes:** Empresas de transporte disponibles
- **Operarios:** Personal del depósito
- **Etiquetadores:** Personal de etiquetado

---

## Arquitectura Propuesta

### Enfoque: Una tabla unificada con tipo (`b2c`/`b2b`)

Una sola tabla `tracking_trips` en Supabase con todos los campos posibles. Los campos exclusivos de B2B (`dominio`, `cliente`, `turno_cliente`, `detalle`, `comentarios`, `carga_granel`) son nullable. La columna `trip_type` distingue B2C de B2B.

**Ventajas:** Consultas simples, un solo endpoint, estadísticas cruzadas fáciles.
**Desventaja:** Campos nullable para campos exclusivos de cada tipo.

### Tablas de Supabase

```
tracking_trips          → Viajes (B2C y B2B unificados)
tracking_trip_operators  → Relación N:N viaje ↔ operario
tracking_carriers        → Transportes predefinidos
tracking_operators       → Operarios predefinidos
tracking_labelers        → Etiquetadores predefinidos
```

### Estructura de Archivos

```
src/
├── app/(dashboard)/tracking/
│   ├── page.tsx                    ← Selector PL2/PL3
│   └── [warehouse]/
│       └── page.tsx                ← Tabs B2C/B2B + Tabla
├── components/tracking/
│   ├── WarehouseSelector.tsx       ← Tarjetas PL2/PL3
│   ├── TrackingTabs.tsx            ← Tabs B2C/B2B
│   ├── B2CTable.tsx                ← Tabla con columnas B2C
│   ├── B2BTable.tsx                ← Tabla con columnas B2B
│   ├── TripFormB2C.tsx             ← Modal/formulario para crear B2C
│   ├── TripFormB2B.tsx             ← Modal/formulario para crear B2B
│   └── StatusBadge.tsx             ← Badge de estado con colores
├── app/api/tracking/
│   ├── trips/
│   │   └── route.ts                ← GET (listar) + POST (crear)
│   └── trips/[id]/
│       └── route.ts                ← GET + PUT + DELETE
└── types/
    └── tracking.ts                 ← Tipos del módulo
```

---

## Diseño Visual

- **Selector de depósito:** Dos tarjetas con ícono de warehouse, nombre "PL2" / "PL3", fondo con hover sutil.
- **Tabs B2C/B2B:** Estilo de tabs del diseño actual (coherente con shadcn/ui).
- **Tabla:** TanStack Table con filtros, ordenamiento, paginación. Las filas usan colores sutiles según estado.
- **Botón "Nuevo Viaje":** En la esquina superior derecha de cada tab.
- **StatusBadge:** Colores por estado (verde=Liberado, amarillo=Pendiente, azul=Pickeando, naranja=Cerrando, morado=FAC, rojo=Cancelado).

---

## Permisos

Según la matriz existente en `permissions.ts`:
- **Ver:** Todos los roles
- **Crear/Editar:** Supervisor, Manager, Admin
- **Eliminar:** Manager, Admin
- **Cambiar estado:** Supervisor, Manager, Admin
