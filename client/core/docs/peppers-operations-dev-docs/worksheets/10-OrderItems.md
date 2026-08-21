# OrderItems worksheet and service

## Purpose

Store the products, quantities and price snapshots that belong to one Order.

## Exact headers

```text
ID
OrderID
MenuItemID
DisplayNameSnapshot
KitchenNameSnapshot
Quantity
UnitPricePence
LineTotalPence
Notes
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `OrderID`: required existing editable Order ID.
- `MenuItemID`: required active MenuItem ID when adding a new line.
- `DisplayNameSnapshot`: copied from MenuItem when the line is created.
- `KitchenNameSnapshot`: copied from Product KitchenName when the line is created.
- `Quantity`: positive integer.
- `UnitPricePence`: copied from MenuItem BasePricePence when the line is created.
- `LineTotalPence`: backend-calculated integer pence.
- `Notes`: optional line-specific kitchen note.
- timestamps: backend-generated UTC ISO values.

Snapshots are not silently refreshed when a Product or MenuItem later changes.

## Backend task

Create the OrderItems service as a child of Orders.

It must support:

- add item to a draft/editable order;
- update quantity and notes;
- remove a line only while the order is editable;
- list lines for an Order;
- recalculate the parent Order totals after every successful line change.

LineTotalPence equals base quantity value plus any attached modifier line totals when OrderItemModifiers are enabled. Until then it equals Quantity multiplied by UnitPricePence.

Do not allow changes to items after the parent Order reaches a locked status unless an explicit future correction flow is approved.

## Frontend task

Add a line-item editor inside the order-entry page with:

- active MenuItem search;
- display name, kitchen name and formatted price;
- quantity control;
- optional note;
- add/edit/remove actions;
- backend-returned line and order totals.

## Scope restrictions

- Do not store arrays or JSON line items inside Orders.
- Do not look up current prices when displaying historical orders; use snapshots.
- Do not implement modifiers in this task unless OrderItemModifiers is selected as part of the same explicitly approved work.

## Definition of done

- Invalid OrderID/MenuItemID values are rejected.
- Price/name snapshots are correct and stable.
- Quantity and line totals are exact integers.
- Parent order totals recalculate after changes.
- Locked orders reject line edits.
- Relevant checks pass and changed files are reported.

