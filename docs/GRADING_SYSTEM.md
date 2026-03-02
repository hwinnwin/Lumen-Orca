# Lumen AAA/AA/A Grading System

## Overview

The Lumen grading system translates raw numeric quality metrics into user-friendly letter grades (AAA to F), similar to credit ratings. This provides clear, actionable quality indicators while maintaining precise numeric enforcement in the backend.

## Philosophy

**Frontend**: Simple, interpretable grades for stakeholders  
**Backend**: Precise numeric thresholds for Six-Nines governance enforcement

## Grade Scale

| Grade | Description  | Quality Level            |
|-------|--------------|--------------------------|
| AAA   | Exceptional  | Best-in-class            |
| AA    | Excellent    | Production-ready         |
| A     | Strong       | High quality             |
| BBB   | Good         | Acceptable               |
| BB    | Adequate     | Needs improvement        |
| B     | Acceptable   | Marginal                 |
| C     | Marginal     | Requires attention       |
| D     | Poor         | Not production-ready     |
| F     | Failing      | Critical issues          |

## Metric Thresholds

### Coverage

| Grade | Range       |
|-------|-------------|
| AAA   | ≥ 95%       |
| AA    | 90-95%      |
| A     | 85-90%      |
| BBB   | 80-85%      |
| BB    | 75-80%      |
| B     | 70-75%      |
| C     | 60-70%      |
| D     | 40-60%      |
| F     | < 40%       |

### Mutation Score

| Grade | Range       |
|-------|-------------|
| AAA   | ≥ 0.90      |
| AA    | 0.87-0.90   |
| A     | 0.80-0.87   |
| BBB   | 0.75-0.80   |
| BB    | 0.70-0.75   |
| B     | 0.65-0.70   |
| C     | 0.50-0.65   |
| D     | 0.30-0.50   |
| F     | < 0.30      |

### Determinism

| Grade | Range       |
|-------|-------------|
| AAA   | ≥ 99.99%    |
| AA    | 99.9-99.99% |
| A     | 99.5-99.9%  |
| BBB   | 99.0-99.5%  |
| BB    | 98.0-99.0%  |
| B     | 97.0-98.0%  |
| C     | 95.0-97.0%  |
| D     | 90.0-95.0%  |
| F     | < 90.0%     |

### Flake Rate (lower is better)

| Grade | Range       |
|-------|-------------|
| AAA   | ≤ 0.10%     |
| AA    | 0.10-0.50%  |
| A     | 0.50-1.0%   |
| BBB   | 1.0-2.0%    |
| BB    | 2.0-5.0%    |
| B     | 5.0-10.0%   |
| C     | 10.0-20.0%  |
| D     | 20.0-40.0%  |
| F     | > 40.0%     |

### Reliability / F_total (lower is better)

| Grade | Range        |
|-------|--------------|
| AAA   | ≤ 1 × 10⁻⁶   |
| AA    | 1-10 × 10⁻⁶  |
| A     | 10-100 × 10⁻⁶|
| BBB   | 1-10 × 10⁻⁴  |
| BB    | 1-10 × 10⁻³  |
| B     | 1-10 × 10⁻²  |
| C     | 0.1-1.0      |
| D     | 1.0-10.0     |
| F     | > 10.0       |

## Overall Grade Calculation

The overall system grade is computed as the **average** of all component grades:

```typescript
const gradeValues = { AAA: 9, AA: 8, A: 7, BBB: 6, BB: 5, B: 4, C: 3, D: 2, F: 1 };
const avg = Math.round(sum(componentGrades) / componentCount);
const overallGrade = reverseMap[avg];
```

## Display Rules

### Public Dashboard
- Show only letter grades (AAA/AA/A/etc.)
- Include tooltips with grade descriptions
- Use color coding for quick visual assessment

### Admin View
- Show letter grades + raw numeric values
- Provide detailed breakdowns per metric
- Enable drill-down into historical trends

### CI/CD Pipeline
- Enforce numeric thresholds (F_total ≤ 1e-6)
- Log both grades and raw metrics
- Fail builds on F_total violations (regardless of grade)

## Implementation

### Backend (Grading Logic)

```typescript
import { applyGrades } from '@lumen/qa/grading/applyGrades';

const rawMetrics = {
  coverage: 96.5,
  mutation: 0.89,
  determinism: 99.994,
  flake: 0.08,
  reliability: 8.1e-7,
};

const grades = applyGrades(rawMetrics);
// { coverage: 'AAA', mutation: 'AA', ..., overall: 'AA' }
```

### Frontend (Display)

```tsx
import { GradeBadge } from '@/components/dashboard/GradeBadge';

<GradeBadge grade="AAA" metric="Coverage" />
```

## Governance Integration

The grading system is **purely presentational**. The backend Six-Nines gate continues to enforce:

```
F_total ≤ 1 × 10⁻⁶
```

Even if a system achieves an "AA" overall grade, CI will **block** deployment if F_total exceeds the numeric threshold.

## Benefits

1. **Stakeholder Communication**: Non-technical stakeholders understand "AAA" better than "8.1e-7"
2. **Quick Assessment**: Instant visual indication of system health
3. **Trend Tracking**: Easier to spot quality degradation over time
4. **Team Motivation**: Clear targets for improvement
5. **Backward Compatibility**: Raw metrics still enforced in CI

## API Endpoints

### Public Metrics (Grades Only)
```
GET /api/metrics/public
Response: { coverage: 'AAA', mutation: 'AA', ... }
```

### Admin Metrics (Grades + Raw)
```
GET /api/metrics/admin
Response: { 
  grades: { coverage: 'AAA', ... },
  raw: { coverage: 96.5, ... }
}
```

### Feature Flag
Control metric exposure via environment variable:

```env
LUMEN_METRICS_EXPOSE=none      # Show grades only (default)
LUMEN_METRICS_EXPOSE=admin     # Show grades + raw (RBAC-protected)
LUMEN_METRICS_EXPOSE=all       # Show everything (dev only)
```

## References

- [Six-Nines Governance](./GO_NO_GO_CHECKLIST.md)
- [Quality Metrics](./OPERATIONAL_STATUS.md)
- [LLM Provider System](./LLM_PROVIDER_SYSTEM.md)
