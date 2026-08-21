# Master prompt for Codex

Open the `MRparchini/core` repository on its `main` branch, run Codex from the repository root, and copy the prompt below after replacing `TARGET_DOCUMENT` with the worksheet document you want to implement.

```text
Read these files completely before editing code:

1. ./client/core/AGENTS.md
2. ./client/core/docs/peppers-operations-dev-docs/00_SHARED-RULES.md
3. TARGET_DOCUMENT

Confirm that the repository remote is MRparchini/core and that the expected client/core and server/appScripts paths exist. Inspect the existing repository architecture, current git diff, and the existing Customers, Products and Menus implementations. Do not assume MenuItems is already implemented merely because its worksheet contains data.

Implement only the module described in TARGET_DOCUMENT, end-to-end in the existing Apps Script backend and frontend. Do not implement unrelated or deferred modules. Preserve working code and existing data compatibility.

After implementation:

1. Run the relevant checks available in the repository.
2. Fix errors caused by your changes.
3. Review the final diff.
4. Report every file created or changed.
5. Report anything incomplete or unverified.
```

Example for Orders:

```text
Read these files completely before editing code:

1. ./client/core/AGENTS.md
2. ./client/core/docs/peppers-operations-dev-docs/00_SHARED-RULES.md
3. ./client/core/docs/peppers-operations-dev-docs/worksheets/09-Orders.md

Confirm that the repository remote is MRparchini/core and inspect the existing architecture, current git diff, and the existing Customers, Products and Menus implementations. Do not assume MenuItems is already implemented merely because its worksheet contains data.

Implement only the Orders module described in the target document, end-to-end in the existing Apps Script backend and frontend. Do not implement unrelated or deferred modules. Preserve working code and existing data compatibility.

After implementation, run the relevant checks, fix errors caused by the changes, review the final diff, report every changed file, and state anything incomplete or unverified.
```
