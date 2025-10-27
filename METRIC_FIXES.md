# Metric Calculation Fixes

## Files That Need Updates

### 1. Fix Position Change Calculation in `app/api/data/fetch-comprehensive-metrics/route.ts`

**Location:** Lines 500, 506, 512

**Current Code:**
```typescript
position: calculateChange(prevWeek.position, current.position) // Inverted for position
```

**Fixed Code:**
```typescript
// Import the new utility
import { calculatePositionChange } from '@/lib/utils/metric-calculations';

// Update all three occurrences:
position: calculatePositionChange(current.position, prevWeek.position)
position: calculatePositionChange(current.position, prevMonth.position)
position: calculatePositionChange(current.position, yearAgo.position)
```

### 2. Fix CTR Aggregation in `lib/analytics/comparisons.ts`

**Location:** Lines 123-125

**Current Code:**
```typescript
ctr: filtered.length > 0
  ? filtered.reduce((sum, item) => sum + (item.ctr || 0), 0) / filtered.length
  : 0,
```

**Fixed Code:**
```typescript
// Import the new utility
import { calculateAggregateCTR } from '@/lib/utils/metric-calculations';

// Update the CTR calculation:
ctr: calculateAggregateCTR(filtered),
```

### 3. Fix CTR Calculation in `components/report/DataVisualizations.tsx`

**Location:** Lines 73-81 (calculateSummary function)

**Current Code:**
```typescript
const totals = searchData.byDate.reduce((acc: any, item: any) => {
  acc.clicks += item.clicks || 0;
  acc.impressions += item.impressions || 0;
  acc.ctrSum += item.ctr || 0;
  acc.positionSum += item.position || 0;
  acc.count += 1;
  return acc;
}, { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 });

return {
  totalClicks: totals.clicks,
  totalImpressions: totals.impressions,
  avgCTR: totals.count > 0 ? totals.ctrSum / totals.count : 0,
  avgPosition: totals.count > 0 ? totals.positionSum / totals.count : 0
};
```

**Fixed Code:**
```typescript
import { calculateCTR, calculateAveragePosition } from '@/lib/utils/metric-calculations';

const totals = searchData.byDate.reduce((acc: any, item: any) => {
  acc.clicks += item.clicks || 0;
  acc.impressions += item.impressions || 0;
  if (item.position > 0) {
    acc.positions.push(item.position);
  }
  return acc;
}, { clicks: 0, impressions: 0, positions: [] });

return {
  totalClicks: totals.clicks,
  totalImpressions: totals.impressions,
  avgCTR: calculateCTR(totals.clicks, totals.impressions),
  avgPosition: calculateAveragePosition(totals.positions)
};
```

### 4. Fix Engagement Rate Calculation in `app/api/data/fetch-comprehensive-metrics/route.ts`

**Location:** Lines 600-604

**Current Code:**
```typescript
if (totals.sessions > 0) {
  totals.engagementRate = totals.engagedSessions / totals.sessions;
  totals.bounceRate = totalBounceRate / totals.sessions;
  totals.avgSessionDuration = totalSessionDuration / totals.sessions;
}
```

**Fixed Code:**
```typescript
import { calculateEngagementRate, calculateWeightedAverage } from '@/lib/utils/metric-calculations';

if (totals.sessions > 0) {
  totals.engagementRate = calculateEngagementRate(totals.engagedSessions, totals.sessions);
  totals.bounceRate = totalBounceRate / totals.sessions; // This is already weighted correctly
  totals.avgSessionDuration = totalSessionDuration / totals.sessions; // This is already weighted correctly
}
```

### 5. Update CTR Aggregation in Multiple Functions

**File:** `app/api/data/fetch-comprehensive-metrics/route.ts`

**Function:** `extractTopQueries` (Lines 449-456)

**Current Code:**
```typescript
.map(data => ({
  ...data,
  position: data.count > 0 ? data.position / data.count : 0,
  ctr: data.impressions > 0 ? data.clicks / data.impressions : 0
}))
```

**Fixed Code:**
```typescript
import { calculateCTR } from '@/lib/utils/metric-calculations';

.map(data => ({
  ...data,
  position: data.count > 0 ? data.position / data.count : 0,
  ctr: calculateCTR(data.clicks, data.impressions)
}))
```

**Function:** `extractTopPages` (Lines 485-491)

Apply the same fix as above for the CTR calculation.

## Implementation Steps

1. **Create the utility file** - ✅ DONE (`lib/utils/metric-calculations.ts`)

2. **Update imports in affected files:**
   ```typescript
   import {
     calculateCTR,
     calculateAggregateCTR,
     calculatePositionChange,
     calculateEngagementRate,
     calculateWeightedAverage,
     calculateAveragePosition
   } from '@/lib/utils/metric-calculations';
   ```

3. **Replace calculations with utility functions** as shown above

4. **Test all changes** to ensure metrics are calculated correctly

5. **Add unit tests** for the new utility functions

## Benefits of These Fixes

1. **Correctness**: Position changes will show improvement correctly
2. **Accuracy**: CTR will be calculated properly from totals, not averaged
3. **Consistency**: All calculations use the same validated logic
4. **Maintainability**: Centralized calculation logic is easier to update
5. **Testing**: Can unit test calculation logic independently
6. **Error Handling**: Consistent validation and edge case handling

## Testing Checklist

- [ ] Position improvements show as positive percentages
- [ ] Position declines show as negative percentages
- [ ] CTR is calculated from total clicks/impressions
- [ ] CTR never exceeds 100%
- [ ] Division by zero returns 0, not NaN or Infinity
- [ ] Percentage changes are capped at reasonable limits
- [ ] All metrics display with correct decimal places
- [ ] Weighted averages calculate correctly for bounce rate
- [ ] Engagement rate shows correct values