# ModifierGroups worksheet and service

## Purpose

Store groups of choices presented for products, such as Sauce, Bread, Size or Roast Dinner options.

## Exact headers

```text
ID
Name
PopupAutomatically
RequiredQuantity
MaxQuantity
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `Name`: required and unique using trimmed, case-insensitive comparison.
- `PopupAutomatically`: boolean; default true.
- `RequiredQuantity`: optional non-negative integer. Blank means no minimum.
- `MaxQuantity`: optional non-negative integer. Blank means no explicit maximum.
- `SortOrder`: non-negative integer; default 0.
- `IsActive`: boolean; default true.
- `CreatedAt`: backend-generated UTC ISO timestamp; immutable.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

When both quantities are present, RequiredQuantity cannot exceed MaxQuantity.

## Backend task

Create the ModifierGroups service following existing repository patterns.

It must support:

- create;
- get by ID;
- update;
- activate/deactivate;
- paginated list;
- search by Name;
- active-status filter;
- batch lookup by normalized Name for Clover import.

Do not physically delete a group referenced by Products or Modifiers.

## Frontend task

Create a compact management page with:

- list, search and pagination;
- add/edit form;
- automatic-popup checkbox;
- optional minimum and maximum quantity fields;
- sort order;
- active status;
- deactivate confirmation.

Do not build a visual modifier editor or drag-and-drop interface in this task.

## Clover import note

The supplied export has no stable Clover ID for modifier groups. Repeat imports match by normalized exact Name. Ambiguous duplicates must be reported instead of guessed.

## Definition of done

- Validation prevents invalid quantity rules.
- Names are unique case-insensitively.
- Import lookup does not create duplicate groups.
- Referenced groups are deactivated rather than deleted.
- Relevant checks pass and changed files are reported.

