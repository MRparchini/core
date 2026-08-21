# Customers worksheet and service

## Live status

This worksheet already contains legacy customer data and an existing service. Preserve its headers and rows.

## Purpose

Store the contact and delivery details used to find a returning customer quickly.

## Exact live headers

```text
ID
code
Name
Address
postcode
Telephone number
Notes
```

Do not rename these headers during this task.

## Field rules

- `ID`: existing stable legacy identifier. Never renumber existing rows.
- `code`: legacy customer code. It currently often matches ID; preserve it for compatibility.
- `Name`: customer name or existing recognisable customer label.
- `Address`: delivery address as text.
- `postcode`: UK postcode stored as text and normalised to uppercase for new/edited records.
- `Telephone number`: stored as text so leading zeroes are preserved.
- `Notes`: optional internal delivery or customer note.

## Backend task

Audit and complete the existing Customers service rather than rewriting it.

It must support:

- create;
- get by ID;
- update;
- paginated list;
- search by Name, Telephone number, postcode and Address.

For new records, follow the existing safe ID/code generation convention. Do not change IDs on update. Reject an update if ID does not exist.

## Frontend task

The existing customer pages must provide:

- searchable customer list;
- pagination;
- add customer;
- edit customer;
- readable validation errors;
- click/select behaviour that can later be reused in the order-entry page.

## Scope restrictions

- Do not restructure or clean all historical customer rows automatically.
- Do not merge possible duplicates automatically.
- Do not add marketing, loyalty or consent modules.
- Do not add CreatedAt/UpdatedAt columns in this task.

## Definition of done

- Existing customer data still loads.
- Search preserves telephone/postcode text.
- New and edited customers persist correctly.
- Existing IDs and codes are unchanged.
- Relevant checks pass and changed files are reported.

