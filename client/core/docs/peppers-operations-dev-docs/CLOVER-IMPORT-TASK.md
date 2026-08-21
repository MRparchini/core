# Clover inventory import — implementation task

## Goal

Implement a small, safe import feature for the supplied Clover `inventory-export.xlsx` format.

Read `PRD.md` and `00_SHARED-RULES.md` before editing code.

## Source workbook contract

Required sheets and headers:

### Items

```text
Clover ID
Name
Alternate Name
Price
Price Type
Price Unit
Tax Rates
Cost
Product Code
SKU
Modifier Groups
Quantity
Printer Labels
Hidden
Non-revenue item
```

### Modifier Groups

```text
Modifier Group Name
Pop-up Automatically
Modifier
Price
Required Quantity
Max Quantity
```

### Categories

The first row contains category names across columns. The item names belonging to each category appear underneath that category's column.

### Tax Rates

```text
Name
Tax Rate
Default
```

## Required parser behaviour

1. An Items row with a nonblank Clover ID starts a new item.
2. Following rows with blank item fields but a Modifier Groups value belong to the most recent item.
3. A Modifier Groups row with a nonblank Modifier Group Name starts a new group.
4. Following rows with a blank group name and a Modifier value belong to the most recent group.
5. Parse Categories by column, not by ordinary row records.
6. Never match imported products by visible Name when Clover ID is available.

## MVP screens

Create one management screen with two stages:

### Preview

- file picker accepting `.xlsx` only;
- required-sheet and header validation;
- counts for items, categories, modifier groups and modifiers;
- warning list;
- blocking-error list;
- no Google Sheets writes.

### Import result

- created count;
- updated count;
- unchanged/skipped count;
- failed count;
- downloadable or copyable error summary;
- clear finish state.

## Backend behaviour

1. Use the repository's existing Apps Script service conventions.
2. Use shared spreadsheet configuration.
3. Require `Products.CloverID` and `Products.PrepStation` before allowing a confirmed import.
4. Match Products by CloverID.
5. Create/update MenuItems under the single active Base menu.
6. Convert pound prices to integer pence safely.
7. Import ModifierGroups, Modifiers and ProductModifierGroups only when their target headers are present.
8. If modifier target sheets are not ready, allow a products-and-menu-items-only import and report modifier records as deferred, not silently lost.
9. Preserve manual KitchenName, Description and SortOrder values during ordinary reimport.
10. Do not use Clover Quantity for stock control.
11. Do not import incomplete Cost values.
12. Do not import Tax Rates into operational tables in this task.
13. Do not call the live Clover API in this task.

## Product field mappings

```text
Clover ID -> CloverID
Name -> Name
Name -> KitchenName only when creating a new Product
first category -> Category only when creating a new Product or when Category is blank
Printer Labels -> PrepStation
Hidden: Yes -> IsActive false
Hidden: No -> IsActive true
```

PrepStation mapping:

```text
Kitchen -> KITCHEN
Counter -> COUNTER
Counter|Kitchen -> BOTH
anything else -> UNASSIGNED and warning
```

## MenuItem field mappings

```text
active Base Menu ID -> MenuID
imported Product ID -> ProductID
Name -> DisplayName only when creating
blank -> DescriptionOverride
Price x 100 rounded -> BasePricePence
deterministic order -> SortOrder only when creating
Hidden mapping -> IsActive
```

## Idempotency

Importing the same file twice must not duplicate:

- Products;
- MenuItems;
- ModifierGroups;
- Modifiers;
- ProductModifierGroups.

## Scope restrictions

Do not implement:

- live Clover API synchronisation;
- order creation in Clover;
- stock management;
- recipe costing;
- ProductVariants inference;
- tax calculation;
- background jobs;
- extra dashboards.

## Verification

Use fixture data that represents continuation rows and horizontal categories. Verify:

- an item with several modifier groups;
- two different Clover IDs with the same visible Name;
- a hidden item;
- an item in multiple categories;
- an unknown printer label;
- repeated import;
- invalid or missing headers;
- price-to-pence conversion.

