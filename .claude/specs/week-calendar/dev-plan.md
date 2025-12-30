# Week Calendar View - Development Plan

## Overview
Add a weekly calendar view to display 7 days of time blocks with tab navigation.

## Requirements
- Week view showing Mon-Sun with time blocks per day
- Tab navigation: Day/Week view switching
- View-only: clicking a day navigates to day view
- Week starts on Monday

## Tasks

### Task 1: week-helpers
**Description**: Add week calculation utilities
**Scope**: `src/utils/schedule.ts`
**Dependencies**: none
**Deliverables**:
- `getWeekStartMonday(date: Date): Date` - returns Monday of that week
- `getWeekDates(date: Date): Date[]` - returns 7 dates Mon-Sun

**Test**: `npm run build`

---

### Task 2: week-view
**Description**: Create WeekView component
**Scope**: `src/components/WeekView.vue`
**Dependencies**: week-helpers
**Deliverables**:
- Compute `weekDates` from `scheduleStore.currentDate`
- Display each day with time blocks via `getTimeBlocksForDate`
- Show activity type colors from `ACTIVITY_TYPE_META`
- Emit `select-date` event when clicking a day
- Responsive 7-column grid layout

**Test**: `npm run build`

---

### Task 3: app-integration
**Description**: Integrate week view into App.vue
**Scope**: `src/App.vue`
**Dependencies**: week-view
**Deliverables**:
- Add `viewMode` ref: `'day' | 'week'`
- Tab navigation UI (日视图 / 周视图) with Tailwind styling
- Conditional render: TimelineView or WeekView
- Handle WeekView `select-date`: call `goToDate()` + switch to day view

**Test**: `npm run build`

---

## Execution Order
```
week-helpers (parallel: independent)
     ↓
week-view (depends on week-helpers)
     ↓
app-integration (depends on week-view)
```

## UI Notes
- Uses existing Tailwind CSS patterns
- 7-column grid for desktop, responsive for mobile
- Reuse `ACTIVITY_TYPE_META` colors for consistency
