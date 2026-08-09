# Sunday Delivery Architecture

This document records the future architecture for Peppers Sunday Delivery. It is intentionally documentation only. The current implementation target remains the Customers module.

## Goals

Sunday Delivery is an internal restaurant workflow for taking, preparing, delivering, and closing Sunday roast orders. The system should support incomplete telephone tickets, dense operational views, print-friendly kitchen output, and later reporting without storing duplicate summary totals.

## Customer Linkage

Orders must not require a customer record. Staff may only know an address and postcode during a busy telephone order.

Future `Order` records should support:

```ts
interface Order {
  id: string
  customerId: string | null
  customerNameSnapshot: string
  addressSnapshot: string
  postcodeSnapshot: string
  telephoneSnapshot: string
  orderDate: string
  deliveryRunId: string | null
}
```

The snapshot fields represent what was known at order time. If an order is later linked to a customer, historical order details still keep the original snapshots. Customer order history should be derived by querying orders where `order.customerId === customer.id`. Do not store order history inside the customer row.

## Order Builder Workflow

Sunday Order Entry should behave like a form plus a shopping cart:

1. Select Sunday/date.
2. Search for an existing customer by ID, name, address, postcode, telephone, or notes.
3. Optionally select a customer.
4. Allow order creation with incomplete customer identity.
5. Add food items.
6. Configure every item independently.
7. Calculate prices.
8. Select Delivery or Collection.
9. Add delivery fee.
10. Select payment method/status.
11. Save.

The builder must not model the order contents as one free-text string.

## Product And Item Model

Use a normalized model:

- `Products`
- `ProductVariants`
- `ModifierGroups`
- `Modifiers`
- `Orders`
- `OrderItems`
- `OrderItemModifiers`

Example product setup:

- Product: Roast Beef Dinner
- Variants: Small, Standard, Large
- Modifier Group: Potato Choice
- Modifiers: Mash, New Potatoes, Roasties
- Modifier Group: Sauces
- Modifiers: Horseradish, Mint Sauce, Cranberry

The UI must not hard-code Beef, Lamb, or Chicken into business logic. Products, variants, modifier groups, and modifiers should come from data.

Each independently configured meal is an `OrderItem`. `OrderItem.quantity` may be greater than 1 only when all options and modifiers are identical.

Example:

- 3 Large Beef, Mash, Gravy
- 1 Large Beef, New Potatoes, Gravy
- 1 Large Beef, New Potatoes, No Gravy

These are three separate `OrderItems`, not one line of text.

Paid modifiers multiply by item quantity:

```ts
extraGravyTotal = modifier.unitPriceDelta * orderItem.quantity
```

A future Duplicate Item action should copy an item so staff can change only one option.

## Kitchen View And Printable Kitchen Sheet

The kitchen needs a live view and a print view. The print view is especially important and should be optimized with print CSS, likely A4 landscape.

For each selected Sunday/date, the printable document should include two complementary sections.

### A. Total Preparation Summary

The summary must be derived from `OrderItems` and `OrderItemModifiers`, not manually stored.

Example categories:

- Beef by size: Small, Standard, Large
- Lamb by size
- Chicken by size
- Extras: Gravy, Extra Gravy, Mint Sauce, Cranberry, Horseradish, Mash, New Potatoes
- Desserts: each dessert type and total quantity

### B. Individual Order Blocks

Each order block should show the complete contents of one customer/order bag:

```text
#8 JESSIE

2 LARGE LAMB
New Potatoes
Gravy
Mint Sauce

Bag:
2 meals
2 gravy portions
```

The kitchen worker must see total production quantities, complete customer order contents, expected number of meals/items in each bag, and special modifications such as No Gravy.

## Weekly And Sunday Separation

Do not create one database table or sheet per Sunday. Orders should contain a date. Operational views filter by Sunday/date.

A `DeliveryRun` represents a particular delivery session, for example:

```text
RUN-2026-08-16-A
```

Views filtered by date/run include:

- Orders
- Kitchen
- Driver
- Reports
- Sunday Close

## Delivery And Driver View

Future Driver View must work well on mobile and also keep a dense desktop/table view because the historical Google Sheet layout is operationally useful.

Driver records should display:

- route sequence number
- customer or order identifier
- address
- postcode
- telephone
- order summary
- food subtotal
- delivery fee
- total
- payment status
- payment method
- amount due
- tip
- delivery status

Future actions:

- Navigate
- Call
- Mark Delivered

## Route Planning

Route order is operationally critical. The current manual workflow is:

1. Plot delivery addresses on Google Maps.
2. Manually choose the best sequence.
3. Consider special delivery constraints.
4. Number destinations.
5. Copy route numbers into the Google Sheet.
6. Print the order sheet.
7. Write the same route number on each physical delivery bag.

Version 1 should support manual drag-and-drop route ordering, automatically assign sequence numbers, and show that number everywhere:

- Driver View
- Kitchen print
- Order/bag label

Model:

```ts
interface DeliveryRun {
  id: string
  date: string
  name: string
  status: 'planning' | 'active' | 'closed'
}

interface DeliveryStop {
  id: string
  deliveryRunId: string
  orderId: string
  sequence: number
  priority: 'normal' | 'priority'
  deliveryWindowStart: string | null
  deliveryWindowEnd: string | null
  driverNote: string
  deliveredAt: string | null
  cashCollected: number
  tip: number
}
```

Do not implement paid Google route optimization initially. Keep the model open for a future route optimization service.

Special delivery requirements should be operational constraints, such as Priority delivery, Deliver before a specified time, or Deliver after a specified time. Avoid storing medical diagnoses unless there is a clear legal and operational reason.

## Sunday Close

The system must separately track:

- `foodSubtotal`
- `deliveryFee`
- `tip`
- `total`
- `amountPaid`
- `amountDue`
- `paymentMethod`
- `paymentStatus`

This enables end-of-run reporting:

- Food sales
- Delivery fees
- Tips
- Gross total
- Paid/Card
- Bank transfer
- Cash expected
- Driver cash collected

Later, Sunday Close should allow entering actual counted cash and calculating the difference.

## Reporting

Reports should be derived from normalized order data. Required future reports include:

- total revenue
- number of orders
- average order value
- product quantity sold
- product revenue
- food sales
- delivery revenue
- tips
- delivery vs collection
- payment method totals

Period comparison should support:

- This Sunday vs previous Sunday
- This month vs previous month
- Last 4 Sundays vs previous 4 Sundays
- Custom date range

## Storage Boundaries

Google Sheets is currently the backend through Google Apps Script. React pages should not couple directly to sheet layouts. Continue using API/service layers such as `src/apis/customers-api.ts`, and typed application models in the UI.

Long-term domain separation:

Peppers Operations data:

- Customers
- Products
- ProductVariants
- ModifierGroups
- Modifiers
- Orders
- OrderItems
- OrderItemModifiers
- DeliveryRuns
- DeliveryStops
- Payments
- GiftVouchers

Staff/HR data:

- Staff
- Contracts
- Availability
- Shifts
- Timesheets
- LeaveRequests

Finance and Payroll should remain separately controlled. Do not migrate all legacy Google Sheets until the operational domain model and API boundaries are stable.
