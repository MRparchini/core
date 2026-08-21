# OrderItemModifiers worksheet and optional service

## Purpose

Store the modifier choices actually selected for an OrderItem, including their names and price adjustments at order time.

## Exact headers

```text
ID
OrderItemID
ModifierID
NameSnapshot
Quantity
PriceAdjustmentPence
LineTotalPence
CreatedAt
UpdatedAt
```

## Field rules

- `ID`: backend-generated UUID; immutable.
- `OrderItemID`: required existing editable OrderItem ID.
- `ModifierID`: required active Modifier ID when selected.
- `NameSnapshot`: copied from Modifier Name at selection time.
- `Quantity`: positive integer; default 1.
- `PriceAdjustmentPence`: copied from Modifier at selection time.
- `LineTotalPence`: Quantity multiplied by PriceAdjustmentPence.
- timestamps: backend-generated UTC ISO values.

Snapshots must not change when the source Modifier is renamed or repriced later.

## Backend task

Create this service only after basic Orders and OrderItems are stable.

It must support:

- list selections for an OrderItem;
- replace the complete selection set while the Order is editable;
- validate that selected Modifiers belong to groups linked to the Product;
- validate ModifierGroup required and maximum quantities;
- recalculate the OrderItem and parent Order totals.

Use a coherent batch operation when replacing the complete set. Do not leave partial selections after a validation failure.

## Frontend task

Extend the line-item editor with grouped choices:

- show only active linked ModifierGroups and Modifiers;
- display required/maximum rules;
- display price changes in pounds;
- prevent obvious invalid choices in the interface;
- rely on backend validation as final authority.

## Scope restrictions

- Do not create free-form custom modifier definitions.
- Do not add ingredient-level stock deduction.
- Do not allow modifier changes on locked orders.

## Definition of done

- Relationship and quantity rules are enforced.
- Snapshot price/name values are stable.
- OrderItem and Order totals recalculate exactly.
- Failed validation produces no partial save.
- Relevant checks pass and changed files are reported.

