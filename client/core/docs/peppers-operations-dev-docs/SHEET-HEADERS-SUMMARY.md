# Peppers Operations DEV — worksheet headers

This is the concise source of truth for the proposed MVP headers.

## 1. Customers

Live legacy headers are preserved:

```text
ID
code
Name
Address
postcode
Telephone number
Notes
```

## 2. Products

The first eight headers already exist. Append the final two fields only when the Clover import work begins.

```text
ID
Name
KitchenName
Category
IsActive
Description
CreatedAt
UpdatedAt
CloverID
PrepStation
```

## 3. ProductVariants

```text
ID
ProductID
Name
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## 4. ModifierGroups

```text
ID
Name
PopupAutomatically
RequiredQuantity
MaxQuantity
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## 5. Modifiers

```text
ID
ModifierGroupID
Name
PriceAdjustmentPence
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## 6. ProductModifierGroups

```text
ID
ProductID
ModifierGroupID
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## 7. Menus

These headers already exist:

```text
ID
Name
Description
SortOrder
IsActive
CreatedAt
UpdatedAt
```

## 8. MenuItems

These headers already exist:

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

## 9. Orders

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

## 10. OrderItems

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

## 11. OrderItemModifiers

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

## 12. DeliveryRuns

```text
ID
RunDate
DriverName
Status
StartedAt
CompletedAt
Notes
CreatedAt
UpdatedAt
```

## 13. DeliveryStops

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

## 14. Payments

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

## 15. Settings

```text
Key
Value
ValueType
Description
UpdatedAt
```

