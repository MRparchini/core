# Product Requirements Document

## Product name

Peppers Operations DEV — Menu, Orders and Sunday Delivery MVP

## 1. Problem

Peppers currently has useful information spread across Clover, Google Sheets, customer records, WhatsApp messages and manual delivery processes. Staff need a simple internal application that can:

- find a customer quickly;
- manage products and menu prices;
- record Sunday delivery and collection orders;
- show the kitchen what must be prepared;
- show the driver the ordered stops and money due;
- record payments;
- reuse the existing Clover inventory export instead of typing hundreds of items manually.

The first release must solve these operational problems without trying to replace Clover or build a full restaurant-management platform.

## 2. Users

### Front-of-house user

Finds customers, records orders, confirms collection or delivery details and takes payment information.

### Kitchen user

Needs a readable list of total quantities and the exact contents of each order.

### Delivery driver

Needs ordered stops, customer/address details, amount due, payment method and delivery status.

### Manager

Maintains products and menu prices, reviews orders, payments and basic sales information.

## 3. Existing system

- GitHub repository: `MRparchini/core`
- Default branch: `main`
- Frontend path: `./client/core`
- Existing project documentation path: `./client/core/docs`
- Apps Script backend path: `./server/appScripts/src`
- Database-style storage: Google Sheets file `Peppers Operations DEV`
- Existing code services/pages: Customers, Products and Menus
- Existing worksheet data without a matching code service at inspection time: MenuItems
- Future integration: Clover API
- Initial Clover data source: manually exported `inventory-export.xlsx`

## 4. What the Clover export contains

The supplied workbook contains four sheets:

1. `Items`
2. `Modifier Groups`
3. `Categories`
4. `Tax Rates`

Observed source size:

- 386 Clover items with 386 unique Clover IDs;
- 78 modifier groups;
- 562 modifier rows;
- 41 categories;
- 3 tax rates.

Important source characteristics:

- Item-to-modifier-group relationships use continuation rows. A row with a Clover ID begins an item; following rows with a blank ID and a Modifier Group value belong to that item.
- Modifier groups also use continuation rows. A nonblank group name begins a group; following blank group-name rows belong to that group.
- Categories are stored horizontally. Each category is a column and the item names are listed underneath it.
- Some different Clover items have the same visible name. Matching must use Clover ID, not Name.
- Some items belong to more than one category.
- All 386 items use the Fixed price type.
- Quantity values are 310 negative and 76 zero, so they are not suitable as trustworthy stock counts for this MVP.
- Only 34 items have a nonzero Cost, so cost and profit reporting cannot rely on this export yet.

## 5. MVP scope

### Included

1. Maintain customers, products, menus and menu items.
2. Upload and validate the supplied Clover inventory `.xlsx` structure.
3. Show a preview before importing.
4. Import or update products using Clover ID.
5. Import base prices into MenuItems under the existing Base menu.
6. Import modifier groups, modifiers and product-to-group links.
7. Record delivery and collection orders.
8. Record order items and optional modifiers.
9. Create delivery runs and ordered delivery stops.
10. Record cash, card or online payments.
11. Keep a clear import summary containing created, updated, skipped and failed rows.

### Explicitly excluded from the MVP

- automatic background Clover synchronization;
- sending new orders to Clover;
- stock control based on Clover Quantity;
- recipe costing or profitability based on the incomplete Cost column;
- automatic ProductVariants conversion;
- a complete tax calculation engine;
- staff rota, annual leave and payroll;
- route optimisation or live vehicle tracking;
- customer-facing online ordering;
- card processing or storage of card details.

## 6. Simplifying decision for products and variants

For the MVP, every Clover item is imported as one Product. An item called `Large Beef Dinner` remains a Product named `Large Beef Dinner` rather than being automatically split into Product `Beef Dinner` and Variant `Large`.

Reasons:

- the source contains many inconsistent names;
- automatic splitting could create incorrect data;
- the restaurant can start using the application sooner;
- ProductVariants can be introduced later after a deliberate menu-cleaning exercise.

## 7. Clover-to-application mapping

### Items to Products

| Clover field | Destination | Rule |
|---|---|---|
| Clover ID | `Products.CloverID` | Stable external match key |
| Name | `Products.Name` | Preserve source text after trimming outside spaces |
| Name | `Products.KitchenName` | Use Name initially; allow manual shortening later |
| Categories | `Products.Category` | Use the first category in source order; flag additional categories for review |
| Printer Labels | `Products.PrepStation` | Map Kitchen, Counter or Both; unknown values become UNASSIGNED |
| Hidden | `Products.IsActive` | Yes becomes false; No becomes true |
| Description | `Products.Description` | Leave blank because the export contains no reliable description |

Ignored in MVP: Alternate Name, Price Type, Price Unit, Cost, Product Code, SKU, Quantity and Non-revenue item. These values may be included in the preview report but do not become operational source-of-truth fields.

### Items to MenuItems

| Clover field | Destination | Rule |
|---|---|---|
| Name | `MenuItems.DisplayName` | Initial customer-facing name |
| Price | `MenuItems.BasePricePence` | Multiply pounds by 100 and store a rounded integer |
| Hidden | `MenuItems.IsActive` | Same active rule as Product |
| Category order | `MenuItems.SortOrder` | Use deterministic sequence; allow manual changes later |

Every imported MenuItem uses the existing active `Base` menu. If it is missing or duplicated, the import must stop with a clear error rather than guessing.

### Modifier Groups to ModifierGroups

| Clover field | Destination |
|---|---|
| Modifier Group Name | `Name` |
| Pop-up Automatically | `PopupAutomatically` |
| Required Quantity | `RequiredQuantity` |
| Max Quantity | `MaxQuantity` |

The export does not supply stable Clover IDs for modifier groups. For repeat imports, match a group by a normalized exact Name and report ambiguous duplicates.

### Modifiers to Modifiers

| Clover field | Destination |
|---|---|
| Modifier Group | `ModifierGroupID` after group lookup |
| Modifier | `Name` |
| Price | `PriceAdjustmentPence` |

Match repeat imports by the pair `ModifierGroupID + normalized Name`.

### Item modifier groups to ProductModifierGroups

Each modifier group listed under a Clover item creates or updates one link between the imported Product and ModifierGroup.

### Categories

Categories are used to populate `Products.Category`. Items in multiple categories are not duplicated. The first category is used and the remaining categories appear in the import-review report.

### Tax Rates

Tax rates are read and displayed in the preview, but not imported into operational worksheets in the MVP. Clover remains responsible for tax behaviour until a separate tax requirement is approved.

## 8. Import user flow

1. Manager opens the Clover Inventory Import page.
2. Manager selects an `.xlsx` file.
3. Application checks filename type, required sheet names and exact source headers.
4. Application parses the workbook without writing to Google Sheets.
5. Application displays counts, warnings and errors.
6. Manager confirms the import.
7. Backend performs deterministic create/update operations.
8. Application shows the final result: created, updated, skipped and failed.
9. A failed import must not leave partly written relationships without a clear report.

## 9. Import safety

- Reimporting the same file must not create duplicate Products or MenuItems.
- Products are matched by `CloverID`.
- A duplicate Clover ID inside the upload is a blocking error.
- A missing required source sheet or header is a blocking error.
- Invalid prices are blocking errors for the affected item.
- Unknown modifier-group relationships are reported and skipped safely.
- No live write occurs during preview.
- Existing manually edited Description, KitchenName and SortOrder values must not be overwritten on ordinary update imports unless the user explicitly chooses a replacement option.
- Import actions must be auditable through a final summary.

## 10. Order flow

1. Staff finds or creates the customer.
2. Staff selects Delivery or Collection.
3. Staff selects active menu items and quantities.
4. Staff records optional modifiers and notes.
5. Backend calculates item totals, subtotal, delivery fee, discount and total.
6. Staff confirms the order.
7. Kitchen views item totals and individual order details.
8. Delivery orders are assigned to a DeliveryRun and ordered DeliveryStops.
9. Payment is recorded separately.
10. Order is completed or cancelled without deleting its history.

## 11. Success criteria

The MVP is successful when:

- the provided Clover export can be previewed without changing data;
- the same export can be imported twice without duplicating records;
- imported item prices exactly match the source after conversion to pence;
- staff can create a delivery or collection order;
- kitchen users can see what must be prepared and per-order details;
- the driver can see stop order, money due and delivery status;
- cash/card totals can be reconciled from recorded Payments;
- no secret or card information is stored in Google Sheets;
- deferred modules have not been built merely because empty worksheets exist.

## 12. Recommended delivery order

1. Confirm headers and shared configuration.
2. Complete Products and MenuItems support for CloverID and PrepStation.
3. Build the Clover import preview and safe import.
4. Build ModifierGroups, Modifiers and ProductModifierGroups.
5. Build Orders and OrderItems.
6. Build DeliveryRuns, DeliveryStops and Payments.
7. Add OrderItemModifiers when the basic order flow is stable.
8. Consider ProductVariants only after real operational use proves it is needed.
