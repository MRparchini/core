# Menus worksheet and service

## Live status

Menus already has headers, data and an existing service. Preserve the live structure.

## Purpose

Represent a price/display context such as the internal Base menu, Sunday Takeaway menu or a future special-event menu.

Menus are not Product categories. Product Category remains in Products.

## Exact live headers

```text
ID
Name
Description
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `Name`: required and unique using trimmed, case-insensitive comparison.
- `Description`: optional.
- `SortOrder`: non-negative integer; default 0.
- `IsActive`: boolean; default true.
- `CreatedAt`: backend-generated UTC ISO timestamp; immutable.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

## Backend task

Audit and complete the existing Menus service instead of rewriting it.

It must support:

- create;
- get by ID;
- update;
- paginated list;
- search by Name and Description;
- active-status filter;
- activate/deactivate.

Do not physically delete a Menu referenced by MenuItems or historical orders.

The Clover importer requires exactly one active Menu named `Base`. If none or more than one exists, return a clear blocking error.

## Frontend task

Preserve the existing management page and ensure it provides:

- list, search and pagination;
- add/edit form;
- sort order;
- active status;
- deactivate confirmation.

## Scope restrictions

- Do not store product prices directly in Menus.
- Do not treat categories such as Coffee or Burgers as new Menus automatically.
- Do not add scheduling, day-of-week or availability windows in the MVP.

## Definition of done

- Existing Base menu remains intact.
- Name uniqueness and active filtering work.
- Referenced menus are deactivated rather than deleted.
- Clover import can resolve one active Base menu.
- Relevant checks pass and changed files are reported.

