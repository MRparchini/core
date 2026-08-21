# Modifiers worksheet and service

## Purpose

Store individual choices inside a ModifierGroup, such as Mash, No Gravy, Mint Sauce or Extra Cheese.

## Exact headers

```text
ID
ModifierGroupID
Name
PriceAdjustmentPence
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `ModifierGroupID`: required existing ModifierGroups ID.
- `Name`: required.
- `PriceAdjustmentPence`: integer; default 0; may be positive, zero or negative.
- `SortOrder`: non-negative integer; default 0.
- `IsActive`: boolean; default true.
- `CreatedAt`: backend-generated UTC ISO timestamp; immutable.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

The pair `ModifierGroupID + Name` must be unique using trimmed, case-insensitive Name comparison. The same Name may appear in different groups.

## Backend task

Create the Modifiers service following existing repository patterns.

It must support:

- create;
- get by ID;
- update;
- activate/deactivate;
- paginated list;
- search by Name;
- filter by ModifierGroupID and IsActive;
- batch upsert by ModifierGroupID plus normalized Name for Clover import.

Reject unknown ModifierGroupID values. Do not physically delete a Modifier referenced by OrderItemModifiers.

## Frontend task

Create a simple management page with:

- group filter;
- search and pagination;
- add/edit form;
- group selector;
- price adjustment displayed in pounds but submitted/stored as integer pence;
- sort order and active status;
- deactivate confirmation.

## Scope restrictions

- Do not add ingredient, allergen or recipe tables.
- Do not create separate Modifier records for the same group/name during repeat import.
- Do not implement order entry in this task.

## Definition of done

- Group relationship is validated.
- Pence conversion is exact.
- Repeat import is idempotent.
- Deactivation preserves historical references.
- Relevant checks pass and changed files are reported.

