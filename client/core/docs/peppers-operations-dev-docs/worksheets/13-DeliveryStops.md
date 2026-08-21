# DeliveryStops worksheet and service

## Purpose

Place one delivery Order into a DeliveryRun, define its sequence and track delivery/payment-collection information.

## Exact headers

```text
ID
DeliveryRunID
OrderID
StopNumber
PaymentMethod
AmountDuePence
Status
DriverNotes
DeliveredAt
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `DeliveryRunID`: required existing DeliveryRun ID.
- `OrderID`: required DELIVERY Order ID.
- `StopNumber`: required positive integer, unique within one run.
- `PaymentMethod`: `CASH`, `CARD`, `ONLINE` or `UNKNOWN`.
- `AmountDuePence`: non-negative integer snapshot calculated from Order total minus successful Payments at assignment/update time.
- `Status`: `PLANNED`, `OUT_FOR_DELIVERY`, `DELIVERED` or `FAILED`.
- `DriverNotes`: optional.
- `DeliveredAt`: backend timestamp when marked delivered.
- `CreatedAt`, `UpdatedAt`: backend UTC ISO timestamps.

The pair `DeliveryRunID + OrderID` must be unique.

## Backend task

Create the DeliveryStops service with:

- assign an eligible delivery Order to a planned run;
- list ordered stops for a run;
- resequence stops safely;
- update payment method and driver notes;
- mark out for delivery, delivered or failed;
- refresh AmountDuePence from recorded successful Payments when appropriate;
- remove an assignment only while the run is planned.

Joined read output must include OrderNumber, CustomerName, TelephoneNumber, Address and Postcode from the Order snapshot. Do not duplicate those address fields in DeliveryStops.

## Frontend task

Create the driver-focused run view with:

- stop number;
- customer name and telephone;
- address and postcode;
- order number;
- amount due formatted as pounds;
- expected payment method;
- delivered/failed actions;
- driver note.

Keep the page readable on a phone. A simple ordered list is sufficient.

## Scope restrictions

- Do not add maps, live navigation or route optimisation.
- Do not store card details.
- Do not allow COLLECTION orders to become delivery stops.

## Definition of done

- Duplicate order assignments and stop numbers are prevented.
- Only DELIVERY orders are accepted.
- Driver view uses order snapshots correctly.
- Amount due reconciles with successful Payments.
- DeliveredAt is backend-controlled.
- Relevant checks pass and changed files are reported.

