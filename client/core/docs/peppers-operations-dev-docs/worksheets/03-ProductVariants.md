# ProductVariants worksheet and optional service

## MVP status

Deferred. Keep this worksheet reserved, but do not build the service until real operational use proves it is needed.

For the Clover import MVP, items such as `Large Beef Dinner` and `Small Beef Dinner` remain separate Products.

## Future purpose

Represent deliberate variations of one Product, such as Small, Standard and Large, after the menu has been manually cleaned.

## Reserved headers

```text
ID
ProductID
Name
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## Future field rules

- `ID`: backend-generated UUID; immutable.
- `ProductID`: required ID from Products.
- `Name`: required variant name.
- `SortOrder`: non-negative integer; default 0.
- `IsActive`: boolean; default true.
- `CreatedAt`: backend-generated UTC ISO timestamp.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

The pair `ProductID + Name` must be unique using trimmed, case-insensitive comparison.

## Instructions for Codex

Unless the user explicitly asks to activate ProductVariants:

- create no backend service;
- create no frontend page;
- change no Product or MenuItem behaviour;
- do not auto-convert Clover item names into variants.

If explicitly activated later, follow `00_SHARED-RULES.md`, add CRUD and safe deactivation, and define the necessary MenuItems relationship in a separate approved migration.

