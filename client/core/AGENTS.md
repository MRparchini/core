# Repository Guidelines

## Project Structure & Module Organization

This repository is a React + TypeScript app built with Vite. Application source lives in `src/`: `main.tsx` mounts the React tree, `App.tsx` contains the current root component, and `App.css` / `index.css` hold component and global styles. Static assets imported by React live in `src/assets/`; public files served from the site root live in `public/`, such as `icons.svg` and `favicon.svg`. Additional project notes are in `docs/`.

## Build, Test, and Development Commands

Install dependencies with `npm install`.

- `npm run dev`: start the Vite development server with hot module replacement.
- `npm run build`: run TypeScript project build checks, then create a production bundle with Vite.
- `npm run lint`: run ESLint across the repository.
- `npm run preview`: serve the production build locally for inspection.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing style: two-space indentation, single quotes, no semicolons, and trailing commas where the formatter or compiler allows them. Name React components in `PascalCase`, hooks and local functions in `camelCase`, and CSS classes/IDs descriptively according to the UI role, such as `counter`, `hero`, or `next-steps`. Keep browser-facing assets in `public/` only when they must be referenced by absolute URL.

## Testing Guidelines

No test framework is configured yet. For now, use `npm run lint` and `npm run build` as the required verification steps before submitting changes. When adding tests, prefer colocated `*.test.ts` or `*.test.tsx` files near the code they cover, and add the corresponding `npm test` script to `package.json`.

## Commit & Pull Request Guidelines

The Git history currently contains only `first commit`, so no project-specific commit convention is established. Use short, imperative commit subjects, for example `Add customer docs page` or `Fix hero asset sizing`. Pull requests should include a brief summary, verification commands run, linked issues when applicable, and screenshots or screen recordings for visible UI changes.

## Agent-Specific Instructions

Do not overwrite existing contributor documentation without checking first. Keep changes scoped, preserve the Vite/React setup, and avoid committing generated output such as `dist/` or `node_modules/`.
