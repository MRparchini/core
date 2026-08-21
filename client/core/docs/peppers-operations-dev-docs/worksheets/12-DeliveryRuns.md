# DeliveryRuns worksheet and service

## Purpose

Represent one group of deliveries assigned to a driver for a date, usually the Sunday delivery run.

## Exact headers

```text
ID
RunDate
DriverName
Status
StartedAt
CompletedAt
Notes
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `RunDate`: required date in `YYYY-MM-DD` format using Europe/London business date.
- `DriverName`: required plain text in the MVP because there is no Staff worksheet yet.
- `Status`: `PLANNED`, `IN_PROGRESS`, `COMPLETED` or `CANCELLED`.
- `StartedAt`: blank until the run starts; then backend UTC ISO timestamp.
- `CompletedAt`: blank until completion; then backend UTC ISO timestamp.
- `Notes`: optional run-level note.
- `CreatedAt`, `UpdatedAt`: backend UTC ISO timestamps.

## Backend task

Create the DeliveryRuns service with:

- create planned run;
- get run with ordered DeliveryStops;
- update driver/date/notes while planned;
- start run;
- complete run only when stop conditions are satisfied or an explicit override note is provided;
- cancel without deleting;
- paginated list;
- filters for date range, status and driver name.

Starting and completion timestamps are backend-controlled.

## Frontend task

Create a simple run-management page with:

- run list and date/status filters;
- create/edit planned run;
- open run detail;
- ordered stop list supplied by DeliveryStops;
- start and complete actions;
- clear status and timing display.

## Scope restrictions

- Do not create a Staff module.
- Do not add GPS tracking, map optimisation or live driver location.
- Do not add vehicle management.

## Definition of done

- Run status transitions and timestamps are valid.
- Stops are returned in StopNumber order.
- Cancelled/completed runs remain readable.
- Date filtering uses the correct business date.
- Relevant checks pass and changed files are reported.

