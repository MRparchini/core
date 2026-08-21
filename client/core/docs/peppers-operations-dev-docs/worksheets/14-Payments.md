# Payments worksheet and service

## Purpose

Record money received or expected for an Order so cash/card totals and remaining balances can be calculated.

## Exact headers

```text
ID
OrderID
Method
AmountPence
Status
Reference
PaidAt
Notes
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `OrderID`: required existing Order ID.
- `Method`: `CASH`, `CARD` or `ONLINE`.
- `AmountPence`: required positive integer.
- `Status`: `PENDING`, `PAID`, `FAILED` or `REFUNDED`.
- `Reference`: optional safe reference such as Clover payment/order reference; never card data.
- `PaidAt`: backend UTC ISO timestamp when status becomes PAID.
- `Notes`: optional operational note.
- `CreatedAt`, `UpdatedAt`: backend UTC ISO timestamps.

An Order may have more than one Payment, allowing split payments later without changing the table.

## Backend task

Create the Payments service with:

- record payment;
- list payments for an Order;
- update status through allowed transitions;
- paginated management list;
- filters for date range, method and status;
- calculate paid total and remaining balance for an Order;
- provide date-level cash/card/online totals.

Allowed simple transitions:

- PENDING to PAID or FAILED;
- PAID to REFUNDED only through an explicit action;
- FAILED and REFUNDED are terminal in the MVP.

Do not physically delete Payments.

## Frontend task

Add payment controls to the Order view and create a simple payment list/reconciliation view showing:

- order number;
- method;
- amount;
- status;
- paid time;
- safe reference;
- remaining order balance;
- date-level method totals.

## Security restrictions

- Never store card number, expiry, CVV, magnetic stripe data or payment token in this worksheet.
- This module records a result; it does not process card payments.

## Scope restrictions

- Do not implement a payment gateway.
- Do not implement complex partial refunds or accounting exports.
- Do not automatically mark an Order completed solely because it is paid.

## Definition of done

- Amount and status validation works.
- Paid totals and remaining balance are exact integer-pence calculations.
- Method totals support Sunday reconciliation.
- No sensitive card data is accepted or stored.
- Relevant checks pass and changed files are reported.

