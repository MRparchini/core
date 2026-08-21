# Settings worksheet and service

## Purpose

Store a small number of non-secret business settings that may change without editing source code.

## Exact headers

```text
Key
Value
ValueType
Description
UpdatedAt
```

## Field rules

- `Key`: required unique uppercase key using letters, numbers and underscores.
- `Value`: required text representation of the setting.
- `ValueType`: `TEXT`, `NUMBER`, `BOOLEAN` or `JSON`.
- `Description`: required plain explanation of what the setting controls.
- `UpdatedAt`: backend-generated UTC ISO timestamp.

Example non-secret settings:

```text
CURRENCY = GBP
TIME_ZONE = Europe/London
DEFAULT_MENU_NAME = Base
DELIVERY_FEE_CF44_PENCE = 300
DELIVERY_FEE_CF45_PENCE = 500
DEFAULT_PAGE_SIZE = 25
```

## Backend task

Create a small Settings service with:

- list settings;
- get setting by Key;
- create/update setting with type validation;
- parsed typed-value helper for other services;
- clear missing/invalid-setting errors.

Cache settings only if the existing Apps Script architecture already has a safe invalidation approach. Otherwise prefer simple correct reads.

## Frontend task

Create a minimal admin-only settings page with:

- list of Key, Value, type and description;
- edit non-protected values;
- validation based on ValueType;
- warning that secrets do not belong here.

Do not add settings merely because they might be useful someday. Add only settings required by an implemented feature.

## Security restrictions

Never store:

- Clover OAuth token;
- API keys;
- passwords;
- card information;
- private certificates;
- database credentials.

Secrets belong in Apps Script Properties or the repository's approved secret mechanism.

## Definition of done

- Key uniqueness and ValueType parsing work.
- Other services can request typed values safely.
- Invalid configuration produces a clear error.
- No secrets are present in the worksheet or sample data.
- Relevant checks pass and changed files are reported.

