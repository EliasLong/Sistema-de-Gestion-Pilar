# Design: Dynamic Operator Management

The tracking system requires a more sophisticated way to manage operators, distributing them by warehouse (PL2, PL3) and sorting them dynamically based on their current shift status.

## Proposed Structure

We will refactor `MOCK_OPERATORS` from a `string[]` to an `Operator[]` array with additional metadata.

```typescript
export interface Operator {
    id: string;
    name: string;
    warehouse: 'PL2' | 'PL3' | 'BOUTIQUE';
    shifts: {
        name: string;      // e.g. "Mañana", "Tarde"
        start: string;     // e.g. "06:00"
        end: string;       // e.g. "14:00"
    }[];
}
```

## Logic Flow

1. **Centralized Helper**: A new function `getOperatorsForContext(warehouseId, currentTime)` will be added to `src/lib/mock-tracking.ts`.
2. **Filtering**: It will only return operators assigned to the requested `warehouseId`.
3. **Sorting**: Operators whose `currentTime` falls within one of their shifts will be placed at the top of the list.
4. **UI Integration**: `B2BTable` and `B2CTable` will use this helper to populate their `OperatorMultiSelect` components.

## Approaches Considered

### 1. Static Sorting (Recommended)
Keep a single list but sort it during render. 
- **Pros**: Simplest implementation, no complex state management.
- **Cons**: Sorts on every render (minimal impact for 5-10 operators).

### 2. Context-Driven State
Inject available operators via a context provider.
- **Pros**: Best for large-scale applications.
- **Cons**: Over-engineering for the current scope.

## Recommended Option
**Option 1: Static Sorting with Helper**. It provides the best balance between "Vibe" (quick implementation) and "Solidez" (centralized logic).
