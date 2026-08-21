# Products worksheet and service

## Live status

Products already has a working header row and an existing CRUD implementation. The Clover import requires two additional optional columns appended at the end.

## Purpose

Store the stable internal identity and operational name of each sellable item.

## Target headers

The first eight already exist. Append `CloverID` and `PrepStation`; do not reorder the existing columns.

```text
ID
Name
KitchenName
Category
IsActive
Description
CreatedAt
UpdatedAt
CloverID
PrepStation
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `Name`: required customer-facing base name.
- `KitchenName`: required short operational name. Default to Name on import but allow manual editing.
- `Category`: required ordinary text for the MVP.
- `IsActive`: boolean; default true.
- `Description`: optional default description.
- `CreatedAt`: backend-generated UTC ISO timestamp; immutable.
- `UpdatedAt`: backend-generated UTC ISO timestamp on every successful update.
- `CloverID`: optional for manually created items; unique when present; stored as text.
- `PrepStation`: one of `KITCHEN`, `COUNTER`, `BOTH`, `UNASSIGNED`.

## Backend task

Extend the existing Products service without breaking its current routes or data.

It must support:

- create;
- get by ID;
- update;
- activate/deactivate;
- paginated list;
- search by Name and KitchenName;
- optional filters for Category, IsActive and PrepStation;
- lookup by CloverID for the import service.

Name should not be used as the unique external match key. CloverID must be unique when supplied.

Deactivation sets IsActive to false. Do not physically remove referenced products.

## Frontend task

Extend the existing Products pages with:

- Clover ID display as read-only ordinary text;
- PrepStation selector;
- existing search and pagination;
- active/category/station filters where they fit the current design;
- add/edit/deactivate flows.

Do not make CloverID mandatory for a manually created Product.

## Migration safety

- Do not insert the two new headers in the middle of the live sheet.
- Do not overwrite the existing Product row.
- Existing records may have blank CloverID and PrepStation.
- The Clover importer must refuse a confirmed import until the two required headers are present.

## Scope restrictions

- Do not infer ProductVariants from Product names.
- Do not add prices to Products; prices belong to MenuItems.
- Do not add stock, recipe or cost calculations.

## Definition of done

- Existing Product CRUD still works.
- Old rows with blank new fields load safely.
- CloverID uniqueness is enforced when present.
- PrepStation validation works.
- Deactivation preserves historical references.
- Relevant checks pass and changed files are reported.

