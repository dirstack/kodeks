---
name: formatting
description: Code formatting and style rules not handled by auto-formatters (oxfmt). Use when writing or modifying TypeScript/React code. Covers function declarations, exports, types, comments, JSX, naming conventions, and import patterns.
---

# Code Formatting Rules

Style guide for code formatting decisions not handled by auto-formatters (oxfmt).

## 1. Function Declaration Style

Use `function` declarations for named functions — components, hooks, and
utilities. Reserve arrow functions for inline callbacks passed as arguments.

```typescript
// Correct
export function processData(input: string): string {
  return `Processed: ${input}`
}

// Correct — inline callback stays an arrow
const ids = users.map(user => user.id)

// Avoid — named function written as an arrow const
export const processData = (input: string): string => {
  return `Processed: ${input}`
}
```

---

## 2. Export Patterns

Use named exports only. Never use default exports.

```typescript
// Correct
export function Button() {
  return <button>Click me</button>
}

// Avoid
function Button() {
  return <button>Click me</button>
}
export default Button
```

---

## 3. Early Returns

Use early returns for validation and edge cases to keep the main logic flat.
Single-line guards stay unbraced; brace only when the body wraps to its own line.

```typescript
export function processUser(user: User | null) {
  if (!user) return
  if (!user.isActive) return

  return doSomething(user)
}
```

---

## 4. Type Definitions

Prefer `interface` over `type` for object shapes. Use `type` for unions,
intersections, and mapped types. Group related types under a namespace.

```typescript
// Correct
export interface User {
  id: string
  name: string
}

// Avoid — object shape as a `type` alias
export type User = {
  id: string
  name: string
}

// `type` is still correct for unions and mapped types
export type Status = "active" | "archived"

// Namespaces for related types
export namespace UserApi {
  export interface Request {
    userId: string
  }
  export interface Response {
    user: User
  }
}
```

---

## 5. File Structure

Follow a standard file order to maintain consistency across the codebase:
1. Imports (grouped: builtin, external, internal)
2. Type definitions
3. Constants and Helpers
4. Main exports (Components/Functions)

---

## 6. Curly Braces

Function declarations always use a braced body with an explicit `return`.
Trivial inline callbacks may stay in concise (shorthand) form.

```typescript
// Correct — declaration has a braced body
export function getName(user: User) {
  return user.name
}

// Correct — trivial inline callback stays concise
const ids = users.map(user => user.id)

// Avoid — pointless braces and return on a trivial callback
const ids = users.map(user => {
  return user.id
})
```

---

## 7. Variable Naming

Use full, descriptive words. Avoid abbreviations like `err`, `req`, `res`, or `btn`.

```typescript
// Correct
const error = new Error("Failed")
const request = await fetch(url)
const button = document.querySelector("button")

// Avoid
const err = new Error("Failed")
const req = await fetch(url)
const btn = document.querySelector("button")
```

**Function name prefixes:**
- `parse*` (e.g., `parseInput`)
- `generate*` (e.g., `generateId`)
- `get*` / `fetch*` (e.g., `getUser`)
- `is*` / `has*` (e.g., `isValid`, `hasPermission`)
- `validate*` (e.g., `validateEmail`)

---

## 8. Comments

Write comments as full sentences with proper capitalization and punctuation. Place them above the subject.

```typescript
// Correct
// This calculates the final price including tax and discounts.
const finalPrice = calculatePrice(items)

// Avoid
const finalPrice = calculatePrice(items) // calculate price
```

**Inline comments** are allowed for arrays, object properties, and complex types:
```typescript
export interface Config {
  timeout: number // Timeout in milliseconds.
  retries: number // Number of retry attempts.
}
```

---

## 9. Array Type Syntax

Use the `T[]` shorthand instead of the generic `Array<T>` syntax.

```typescript
// Correct
const tags: string[] = ["react", "typescript"]

// Avoid
const tags: Array<string> = ["react", "typescript"]
```

---

## 10. Nullish Coalescing

Use the nullish coalescing operator `??` instead of logical OR `||` for default values.

```typescript
// Correct
const port = process.env.PORT ?? 3000
const username = user.name ?? "Anonymous"

// Avoid
const port = process.env.PORT || 3000
```

---

## 11. Template Literals

Always use template literals for string composition. Never use `+` for string concatenation.

```typescript
// Correct
const message = `Hello, ${user.name}!`

// Avoid
const message = "Hello, " + user.name + "!"
```

---

## 12. Bare Return

When a function returns `| undefined`, use a bare `return` instead of `return undefined`.

```typescript
// Correct
export function findItem(items: Item[], id: string): Item | undefined {
  const item = items.find(i => i.id === id)
  if (!item) return
  return item
}

// Avoid
if (!item) return undefined
```

---

## 13. Void Prefix

Use the `void` operator for intentionally non-awaited async calls (fire-and-forget).

```typescript
// Correct
void trackEvent("page_view")

// Avoid
trackEvent("page_view")
```

---

## 14. Empty Catch

Use an empty `catch {}` block for expected or ignorable failures, and return a safe default.

```typescript
export function safeParseJson(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {}
}
```

---

## 15. Config via Constants

Isolate all `process.env` access in dedicated constants or environment modules. Business logic should never touch `process.env`.

```typescript
// Correct (in ~/lib/env.ts)
export const DATABASE_URL = process.env.DATABASE_URL

// Avoid (in business logic)
const client = new Client(process.env.DATABASE_URL)
```

---

## 16. JSX Attributes

Order attributes logically: `id` first, then standard props, then `className`, and finally event handlers (`on*`).

```tsx
// Correct
<Button
  id="submit-btn"
  type="submit"
  disabled={isLoading}
  className="w-full bg-blue-500"
  onClick={handleSubmit}
>
  Submit
</Button>
```

---

## 17. Path Aliases

Always use `~/*` path aliases for imports. Never use relative paths like `./` or `../`.

```typescript
// Correct
import { Button } from "~/components/ui/button"

// Avoid
import { Button } from "../../components/ui/button"
```

---

## 18. TypeScript Strict

Maintain strict TypeScript usage. Never use `any`. Use `unknown` if the type is truly unknown, or define a specific type/interface.

```typescript
// Correct
export function handleData(data: unknown) {
  if (typeof data === "string") {
    return data.toUpperCase()
  }
}

// Avoid
export function handleData(data: any) {
  return data.toUpperCase()
}
```
