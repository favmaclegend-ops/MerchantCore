# Contributing to MerchantCore

Thank you for your interest in contributing! This document outlines best practices, conventions, and workflows to keep the codebase clean and maintainable.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Component Guidelines](#component-guidelines)
- [Styling Guidelines](#styling-guidelines)
- [TypeScript Guidelines](#typescript-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Performance](#performance)
- [Accessibility](#accessibility)

## Code of Conduct

- Be respectful and constructive in all interactions
- Focus on what is best for the project and the community
- Accept constructive feedback gracefully
- Show empathy towards other contributors

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/merchant-core.git`
3. Add the upstream remote: `git remote add upstream https://github.com/ORIGINAL_OWNER/merchant-core.git`
4. Install dependencies: `npm install`
5. Create a branch: `git checkout -b feature/your-feature-name`
6. Start the dev server: `npm run dev`

## Development Workflow

1. **Sync before you start**: Always pull the latest `main` from upstream before creating a branch
2. **Branch naming**: Use conventional prefixes:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation changes
   - `refactor/` - Code refactoring
   - `chore/` - Maintenance tasks
   - `perf/` - Performance improvements
3. **Work in small increments**: Keep commits focused and atomic
4. **Test locally**: Run `npm run build` and `npm run lint` before pushing
5. **Rebase, don't merge**: Rebase your branch on `main` before opening a PR

## Coding Standards

### General

- Use **2 spaces** for indentation (configured in `.editorconfig`)
- Use **single quotes** for strings (enforced by Prettier/ESLint)
- Use **trailing commas** in multiline objects and arrays
- Maximum line length: **120 characters**
- **No unused variables** or imports
- **No console.log** in production code (use proper logging utilities)

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `DesktopSidebar` |
| Files (components) | PascalCase | `DesktopSidebar.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Functions/variables | camelCase | `getUserData` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `Product`, `CreditEntry` |
| CSS classes | kebab-case (Tailwind) | `bg-slate-900` |

### File Organization

```tsx
// 1. Imports (ordered: external, internal, types)
import { useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { type Product } from '@/types'

// 2. Types and interfaces
interface Props { ... }

// 3. Constants
const ITEMS_PER_PAGE = 20

// 4. Component definition
export function InventoryPage() { ... }
```

## Component Guidelines

### Structure

- Use **functional components only** (no class components)
- Export components as **named exports**, not default exports
- Keep components under **150 lines**; extract sub-components when larger
- Use the `cn()` utility from `@/lib/utils` for conditional class names

```tsx
// Good
export function ProductCard({ name, price }: Props) {
  return <div className={cn('...', isActive && '...')}>...</div>
}

// Bad
export default function product_card({ name, price }: Props) { ... }
```

### Props

- Define props with **TypeScript interfaces**, not inline types
- Destructure props in the function signature
- Use **optional props** with defaults when appropriate
- Avoid prop drilling; use context or state management for deep trees

```tsx
interface Props {
  title: string
  items?: Product[]
  onAdd?: (id: string) => void
}

export function ProductList({ title, items = [], onAdd }: Props) {
  ...
}
```

### State

- Use `useState` for local component state
- Use `useMemo` for expensive computations
- Use `useCallback` for functions passed as props to memoized children
- Avoid putting derived state into `useState`

## Styling Guidelines

### Tailwind CSS

- Use **Tailwind utility classes** exclusively; avoid custom CSS
- Use the **`@/lib/utils` cn()** helper for conditional classes
- Follow **mobile-first** responsive design (base = mobile, `lg:` = desktop)
- Use **spacing scale** consistently (e.g., `p-3`, `gap-4`, not arbitrary values)
- Use **semantic color tokens** (`slate-900` for primary, `emerald-500` for success, etc.)

```tsx
// Good
<div className={cn(
  'bg-white rounded-lg border p-4',
  isActive && 'border-slate-900'
)} />

// Bad
<div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px' }} />
```

### Responsive Breakpoints

| Breakpoint | Prefix | Target |
|------------|--------|--------|
| Default | (none) | Mobile (< 1024px) |
| Large | `lg:` | Desktop (>= 1024px) |
| Extra Large | `xl:` | Wide screens (>= 1280px) |
| Small | `sm:` | Small screens (>= 640px) |

### Layout Rules

- Use `min-w-0` on `flex-1` children to prevent flex overflow
- Wrap tables in `overflow-x-auto` containers
- Use `truncate` on text that might overflow its container
- Add `flex-shrink-0` to icons and avatars in flex containers

## TypeScript Guidelines

### Strict Mode

- **No `any` types** - use `unknown` or proper interfaces instead
- **No `@ts-ignore` / `@ts-expect-error`** without a documented reason
- Enable **strict null checks** (already enabled in tsconfig)

### Interfaces vs Types

- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, and mapped types

```tsx
// Interface for object shapes
interface Product {
  id: string
  name: string
  price: number
}

// Type for unions
type ProductStatus = 'in-stock' | 'low-stock' | 'out-of-stock'
```

### Path Aliases

Use `@/` for all internal imports:

```tsx
import { cn } from '@/lib/utils'
import { products } from '@/data/mockData'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, no logic change) |
| `refactor` | Code refactoring (no feature or fix) |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance, config, deps |

### Examples

```
feat(pos): add checkout confirmation modal
fix(inventory): prevent negative stock values
docs: update CONTRIBUTING.md with TypeScript guidelines
refactor(dashboard): extract stats cards into sub-components
chore: bump react to 19.2.5
```

### Rules

- Keep subject line under **72 characters**
- Use **imperative mood** ("add" not "added" or "adds")
- Do not end the subject line with a period
- Separate subject from body with a blank line

## Pull Requests

### Before Submitting

1. [ ] Run `npm run lint` and fix all errors
2. [ ] Run `npm run build` and verify it succeeds
3. [ ] Test your changes in both desktop and mobile views
4. [ ] Rebase on the latest `main`
5. [ ] Write a clear PR description

### PR Description Template

```markdown
## Summary
- What changed and why

## Changes
- Bullet point 1
- Bullet point 2

## Screenshots (if UI change)
- Before/after screenshots

## Testing
- [ ] Desktop layout verified
- [ ] Mobile layout verified
- [ ] Build passes
- [ ] Lint passes
```

### Review Process

- All PRs require at least one review before merging
- Address review comments promptly and respectfully
- Squash commits on merge for a clean history

## Testing

- Write tests for utility functions in `src/lib/`
- Test user-facing interactions (clicks, form submissions)
- Test edge cases (empty lists, missing data, error states)
- Mock API calls when testing components that fetch data

## Performance

### Component Performance

- Memoize expensive computations with `useMemo`
- Memoize callback functions passed to child components with `useCallback`
- Avoid inline object/array creation in render
- Use `React.memo` for components that re-render frequently with the same props

### Bundle Size

- Tree-shake imports: `import { Bell } from 'lucide-react'` (not the entire library)
- Lazy-load routes with `React.lazy` when adding new pages
- Avoid importing large libraries; prefer lightweight alternatives

### Rendering

- Keep component trees shallow
- Avoid unnecessary re-renders by lifting state only when needed
- Use keys that are stable and unique (not array indexes)

## Accessibility

- Use **semantic HTML** (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`)
- All interactive elements must be **keyboard accessible**
- Buttons must have **accessible names** (text content or `aria-label`)
- Maintain **color contrast ratios** (WCAG AA minimum: 4.5:1 for normal text)
- Use `sr-only` class for visually hidden but screen-reader accessible text
- Images and icons that convey meaning need `alt` text or `aria-label`

```tsx
// Good
<button aria-label="Close dialog" onClick={onClose}>
  <X className="w-4 h-4" />
</button>

// Bad
<button onClick={onClose}>
  <X className="w-4 h-4" />
</button>
```

---

Questions? Open an issue or reach out to the maintainers.
