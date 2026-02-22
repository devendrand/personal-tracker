# PRD Addendum — Module B: Swim Performance Tracker

**Addendum Version:** 1.0 | **Date:** February 2026 | **Status:** Draft
**Parent Document:** `PersonalTracker_PRD_v2.0.md`
**Adds to Section:** 4 (Functional Requirements), 6 (Data Model), 7 (API Design), 8 (User Stories), 9 (Milestones), 10 (Open Questions)

> This addendum defines only the incremental requirements for Module B. All platform-level decisions (tech stack, auth, NFRs, deployment) are inherited from the parent PRD and are not repeated here. FR numbering, user story IDs, and milestone numbering continue from where the parent document left off.

---

## 1. Module Summary

The Swim Performance Tracker allows a parent to manually log a swimmer's competitive event times, automatically track personal bests (PRs) per event, and visualize improvement over time through charts and a PR dashboard. It shares the existing Angular frontend, FastAPI backend, and PostgreSQL database.

**Key capabilities added by this module:**
- Single swimmer profile with age auto-calculation
- Pre-populated standard event catalog (all strokes × distances, SCY / SCM / LCM)
- Manual time entry with meet grouping
- Automatic PR detection and flagging on entry
- Event progression line chart with PR markers
- PR summary dashboard across all events

---

## 2. Additions to Section 4 — Functional Requirements

### 4.5 Swimmer Profile

#### FR-16: Single Swimmer Profile
The system shall maintain one swimmer profile containing full name, date of birth (used to auto-calculate age), and optional club/team name. The profile shall be editable at any time.

---

### 4.6 Event Catalog

#### FR-17: Standard Event Definitions
The system shall ship with a pre-populated catalog of valid competitive events. An event is defined by distance, unit, and stroke. Users select from the catalog — they do not create events manually.

Supported strokes: Freestyle, Backstroke, Breaststroke, Butterfly, Individual Medley (IM).

Supported pool types and distances:

| Pool Type | Distances |
|-----------|-----------|
| Short Course Yards (SCY) | 25y, 50y, 100y, 200y, 400y, 500y, 1000y, 1650y |
| Short Course Meters (SCM) | 25m, 50m, 100m, 200m, 400m, 800m, 1500m |
| Long Course Meters (LCM) | 50m, 100m, 200m, 400m, 800m, 1500m |

Only valid stroke/distance combinations shall be presented in the UI (e.g., 1650y IM is not a real event and shall be excluded).

---

### 4.7 Time Entry & Meet Logging

#### FR-18: Manual Time Entry
Users shall log a swim time by selecting an event, entering the time in `mm:ss.hh` format, selecting a date (defaults to today), selecting pool type (SCY/SCM/LCM), and optionally entering a meet name and free-text notes. Time format shall be validated on submission. Times shall be stored internally as decimal seconds for sorting and comparison.

#### FR-19: Edit and Delete
Users shall be able to edit or delete any previously entered time. Any edit shall trigger a re-evaluation of PR status for the affected event.

#### FR-20: Meet Grouping
A meet record is auto-created when a new meet name is typed during time entry. The meet log view shall show all meets in reverse chronological order. Selecting a meet shows all events swum, the time recorded per event, and whether each time was a PR at that meet.

---

### 4.8 Personal Best (PR) Detection

#### FR-21: Automatic PR Calculation
The system shall determine the PR for each event as the fastest recorded time for that swimmer in that event and pool type. PR status shall be recalculated on every add, edit, or delete.

#### FR-22: PR Flag on Entry
When a new time beats the current PR, the system shall display a visual congratulatory indicator on confirmation (e.g., "🏆 New Personal Best!") and immediately update the PR dashboard.

#### FR-23: PR History Preservation
When a PR is broken, the previous PR record shall remain in the database with its `is_pr` flag set to `false`. This preserves the full PR evolution history for use in the progression chart.

---

### 4.9 Swim Reporting & Visualization

#### FR-24: Event Progression Chart
For any selected event, the system shall render a line chart of all recorded times over time. The x-axis is date, the y-axis is time (displayed as `mm:ss.hh`). PR times shall be visually distinguished (e.g., gold marker). An optional best-fit trend line shall be toggleable. The chart shall be filterable by pool type.

#### FR-25: PR Dashboard
The PR dashboard shall show one row per event with at least one logged time, displaying: event name, pool type, current PR, date achieved, first-ever time, improvement (seconds and %), and total times logged. The table shall be sortable by any column and filterable by pool type.

#### FR-26: Time History Log
A full filterable log of all times shall be available. Filters: event, pool type, date range, meet name, and PR-only toggle. Results shall be sortable and exportable to CSV.

---

## 3. Additions to Section 6 — Data Model

New tables to be added to the shared PostgreSQL schema:

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `swimmer` | id, name, date_of_birth, team_name, created_at | Single row in v1 |
| `swim_event` | id, distance, unit (yards/meters), stroke, pool_type | Pre-seeded catalog; not user-editable |
| `swim_meet` | id, name, date, location, notes | Auto-created on first time entry referencing it |
| `swim_time` | id, swimmer_id, event_id, meet_id, time_seconds, recorded_date, pool_type, notes, is_pr, created_at | Core record; `is_pr` recalculated on write |

---

## 4. Additions to Section 7 — API Design

New routes to be added under the `/api/swim/` prefix:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/swim/profile` | Get swimmer profile |
| PUT | `/api/swim/profile` | Update swimmer profile |
| GET | `/api/swim/events` | List all valid events from the catalog |
| GET | `/api/swim/times` | List times (filterable by event, date, meet, pool type, is_pr) |
| POST | `/api/swim/times` | Log a new time; triggers PR recalculation |
| PUT | `/api/swim/times/{id}` | Edit a time; triggers PR recalculation |
| DELETE | `/api/swim/times/{id}` | Delete a time; triggers PR recalculation |
| GET | `/api/swim/meets` | List all meets |
| POST | `/api/swim/meets` | Create a meet explicitly |
| GET | `/api/swim/reports/prs` | Current PR per event (PR dashboard data) |
| GET | `/api/swim/reports/event/{event_id}` | Full time history + chart data for one event |

---

## 5. Additions to Section 8 — User Stories

| ID | As a swim parent, I want to... | Acceptance Criteria |
|----|-------------------------------|---------------------|
| US-08 | Log my daughter's 100y freestyle time after a meet. | Time saved with event, date, meet name, pool type, and optional notes. |
| US-09 | See immediately if a new time is a personal best. | New PR flagged visually on entry; PR dashboard updated instantly. |
| US-10 | View a chart of all her 100y freestyle times over time. | Line chart shows all times for the selected event with date x-axis, PR markers, and optional trend line. |
| US-11 | See all her current personal bests across every event in one view. | PR dashboard shows current PR, date achieved, and improvement % per event. |
| US-12 | Look back at what she swam at a specific meet last season. | Meet log shows all events and times recorded under that meet name, with PR flags. |

---

## 6. Additions to Section 9 — Milestones

| Milestone | Target | Deliverables |
|-----------|--------|-------------|
| M5 – Swim Tracker | Sprint 8–9 | Swimmer profile, event catalog seeding, time entry form with validation, PR auto-detection logic, meet auto-creation, meet log view, event progression chart, PR dashboard, time history log with filters and CSV export |

---

## 7. Additions to Section 10 — Open Questions

- **Course conversion:** Should the system convert times between SCY, SCM, and LCM for cross-comparison, or keep PRs strictly within each pool type? (Current spec: strictly separate — no conversion.)
- **Age group standards:** Should times be benchmarked against USA Swimming published age group time standards (A, AA, AAA, etc.) in a future version?
- **Multiple swimmers:** Is there a future need for a second swimmer profile (e.g., a sibling)?
- **Meet import:** Should a future version support importing times from USA Swimming meet results or Hy-Tek export files to reduce manual entry?

---

*Module B Addendum v1.0 | February 2026 | Confidential*
