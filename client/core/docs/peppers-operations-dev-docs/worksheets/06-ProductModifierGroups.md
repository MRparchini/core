# ProductModifierGroups worksheet and service

## Purpose

Link a Product to the ModifierGroups that may be used with it. This is a relationship table; it does not contain modifier choices itself.

## Exact headers

```text
ID
ProductID
ModifierGroupID
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `ProductID`: required existing Product ID.
- `ModifierGroupID`: required existing ModifierGroup ID.
- `SortOrder`: non-negative integer; default 0.
- `IsActive`: boolean; default true.
- `CreatedAt`: backend-generated UTC ISO timestamp; immutable.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

The pair `ProductID + ModifierGroupID` must be unique.

## Backend task

Create a small relationship service that supports:

- list groups linked to a Product;
- replace or update a Product's ordered group links safely;
- activate/deactivate a link;
- batch upsert for Clover import.

Validate both foreign IDs before writing. Use one batch operation when saving the complete set of group links for a Product.

## Frontend task

Do not create a separate top-level management page unless the existing navigation requires one.

Add a section to Product editing that can:

- show available active ModifierGroups;
- select groups linked to the Product;
- set their display order;
- save the relationship set;
- show loading and error states.

Keep this interface simple. No drag-and-drop requirement is included; numeric SortOrder is sufficient.

## Clover import note

In the Items sheet, a row with a Clover ID begins an item. Following blank-ID rows containing Modifier Groups values belong to that item. Each parsed relationship creates or updates one ProductModifierGroups row.

## Definition of done

- Duplicate links cannot be created.
- Invalid ProductID or ModifierGroupID is rejected.
- Repeat Clover import does not duplicate links.
- Product editing can display and save linked groups.
- Relevant checks pass and changed files are reported.

