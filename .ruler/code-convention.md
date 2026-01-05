# AI-Agent Code Conventions & Operational Protocols (code-convention.md)

**Project:** simapbe (Bandung Gov-Connect)  
**Standard:** Senior Fullstack Architect & Avant-Garde UI
**Objective:** Enforce zero-fluff, high-performance, and type-safe development using active MCP research.

---

## 1. Research Protocol (REQUIRED BEFORE CODING)
To ensure code is up-to-date and follows the exact implementation of the stack, ALL AI agents must follow this research hierarchy:

### Step 1: Specialized MCP Servers
If the task involves a library with a dedicated MCP server, **YOU MUST** query it first.
- **`shadcn`**: Use for ALL UI component additions, audits, and usage examples.
- **`better-auth`**: Use for any authentication flow, session management, or role-based logic.

### Step 2: Context7 Discovery
If no specialized MCP exists for a package/library:
- **Mandatory Tool:** `context7_resolve-library-id` followed by `context7_query-docs`.
- **Use Case:** Finding latest API change for `ElysiaJS`, `tRPC`, `Prisma`, `TanStack Query`, or any utility library.
- **Prohibition:** Do not rely on training data for library syntax if the library is under active development.

---

## 2. UI/UX "Avant-Garde" Standards
Agents must prioritize "Visual Excellence" and "Intentional Minimalism".

- **Styling:** Use **Tailwind CSS**.
- **Aesthetics:**
    - Avoid generic CSS colors. Use curated HSL tokens.
    - Implement **Glassmorphism**, **Smooth Gradients**, and **Micro-animations**.
    - Typography must use premium fonts (Inter, Outfit, etc.).
- **Responsiveness:** All UI generation must be mobile-first and WCAG AAA compliant.

---

## 3. Backend & Type-Safety Protocols
- **tRPC First:** All client-server communication must use `@simapbe/api` (tRPC). No raw `fetch` calls.
- **Zod Validation:** Every input must be validated via Zod schemas shared in `packages/api`.
- **Prisma Discipline:** 
    - Use the multi-file schema structure in `packages/db/prisma/schema/`.
    - Always use `cuid()` for IDs.
- **Error Handling:** Use custom error classes and handle them in Elysia middleware.

---

## 4. Operational "Ultrathink" Protocol
If the user triggers **"ULTRATHINK"**, agents must:
1. **Suspend Brevity:** Provide exhaustive architectural reasoning.
2. **Performance Analysis:** Detail the repaint/reflow costs and state complexity.
3. **Edge Case Analysis:** Predict failure points (e.g., PDN network latency, SPLP gateway timeouts).

---

## 5. Maintenance & Quality Control
- **Formatting:** Code must pass `bun run check`.
- **Linting:** Resolve all Biome/ESLint errors before submitting.
- **Documentation:** Every new feature must have a corresponding update in `.ruler/*.md`.
