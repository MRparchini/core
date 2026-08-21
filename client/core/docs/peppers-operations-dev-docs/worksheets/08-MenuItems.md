# MenuItems worksheet and service

## Live status

MenuItems already has headers and data in Google Sheets. No matching MenuItems backend service, frontend API client, store, components or page was present in the inspected `MRparchini/core` source. Preserve the live sheet structure and data while creating the missing module.

## Purpose

Connect a Product to a Menu and store the name, description and price used in that Menu.

## Exact live headers

```text
ID
MenuID
ProductID
DisplayName
DescriptionOverride
BasePricePence
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `MenuID`: required existing Menu ID.
- `ProductID`: required existing Product ID.
- `DisplayName`: required customer-facing name for this menu.
- `DescriptionOverride`: optional; blank means use Product Description where appropriate.
- `BasePricePence`: required non-negative integer.
- `SortOrder`: non-negative integer; default 0.
- `IsActive`: boolean; default true.
- `CreatedAt`: backend-generated UTC ISO timestamp; immutable.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

The pair `MenuID + ProductID` must be unique in the MVP.

## Backend task

Create the MenuItems service using the existing Customers, Products and Menus files as the technical pattern. Do not refactor those working services unless a small shared change is genuinely required.

It must support:

- create;
- get by ID;
- update;
- activate/deactivate;
- paginated list;
- search by DisplayName plus joined Product Name and KitchenName;
- filters for MenuID and IsActive;
- joined read output containing useful Menu and Product labels;
- safe upsert for Clover import.

Validate MenuID and ProductID before writing. Do not trust a price submitted as a formatted pound string; convert and validate it at the boundary, then store pence.

## Frontend task

Create a management page consistent with the existing Products and Menus pages, with:

- menu selector;
- product selector with search;
- display name and optional description override;
- price input displayed as pounds;
- sort order and active status;
- paginated/searchable list;
- readable product and menu names instead of UUID-only display.

## Clover import behaviour

- Match the Product by Products.CloverID.
- Resolve the one active Base menu.
- Create/update one Base MenuItem for each imported Product.
- Convert Price to BasePricePence.
- Preserve manually edited DisplayName, DescriptionOverride and SortOrder on ordinary reimport.
- Update BasePricePence and IsActive from the source.

## Scope restrictions

- Do not add ProductVariants to this relationship in the MVP.
- Do not place modifier selections in MenuItems.
- Do not add time scheduling or channel-specific price engines.

## Definition of done

- Existing live MenuItem data loads through the new service without being rewritten or lost.
- Relationships and uniqueness are validated.
- Price conversion is exact.
- Repeat Clover import does not duplicate MenuItems.
- Joined labels display correctly.
- Relevant checks pass and changed files are reported.
