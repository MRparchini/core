# Orders worksheet and service

## Purpose

Store one customer order and the information needed for delivery or collection, totals and operational status.

## Exact headers

```text
ID
OrderNumber
CustomerID
CustomerName
TelephoneNumber
Address
Postcode
OrderType
RequiredAt
Status
Notes
SubtotalPence
DeliveryFeePence
DiscountPence
TotalPence
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `OrderNumber`: backend-generated short human-readable unique number.
- `CustomerID`: optional for a guest, but must exist when supplied.
- `CustomerName`, `TelephoneNumber`, `Address`, `Postcode`: required operational snapshots as appropriate for the order type.
- `OrderType`: `DELIVERY` or `COLLECTION`.
- `RequiredAt`: required ISO date-time for fulfilment.
- `Status`: `DRAFT`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `COMPLETED` or `CANCELLED`.
- `Notes`: optional order-level note.
- money fields: integer pence; backend-calculated.
- timestamps: backend-generated UTC ISO values.

For DELIVERY, Address and Postcode are required. TelephoneNumber is required for both order types.

## Backend task

Create the Orders service following existing repository patterns.

It must support:

- create a draft order;
- get one complete order;
- update customer/fulfilment details while allowed;
- confirm an order;
- transition order status using explicit allowed transitions;
- cancel without deleting;
- paginated list;
- search by OrderNumber, CustomerName, TelephoneNumber and Postcode;
- filters for date range, OrderType and Status.

The complete-order read should join OrderItems, optional OrderItemModifiers and Payments without changing the storage schema.

Calculate SubtotalPence, DeliveryFeePence, DiscountPence and TotalPence in the backend. Never accept browser totals as authoritative.

## Status rules

- DRAFT may become CONFIRMED or CANCELLED.
- CONFIRMED may become PREPARING or CANCELLED.
- PREPARING may become READY or CANCELLED.
- READY may become OUT_FOR_DELIVERY, COMPLETED or CANCELLED.
- OUT_FOR_DELIVERY may become COMPLETED or CANCELLED.
- COMPLETED and CANCELLED are terminal in the MVP.

## Frontend task

Create an order-entry and order-list flow with:

- customer search/select and quick create;
- delivery/collection choice;
- required date/time;
- customer snapshot fields;
- notes;
- live display of backend-validated totals;
- draft/save/confirm actions;
- status display and allowed status actions;
- search, pagination and filters.

Build only the order shell in this module. Use OrderItems when that module is implemented rather than duplicating line-item storage inside Orders.

## Scope restrictions

- Do not send orders to Clover.
- Do not process card payments.
- Do not add refunds, vouchers, tips, loyalty or table-service modules.
- Do not implement route optimisation.

## Definition of done

- Delivery and collection validation differs correctly.
- Snapshots are preserved when the Customer later changes.
- Totals are backend-controlled.
- Invalid status transitions are rejected.
- Completed/cancelled orders remain readable.
- Relevant checks pass and changed files are reported.

