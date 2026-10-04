# Gastosaurus Design System

How the UI is put together so new screens stay consistent. Tokens live in
`src/index.css`; shared building blocks are at the top of `src/App.css`
("DESIGN SYSTEM PRIMITIVES"). Component styles below that should only use tokens.

## Tokens (`src/index.css`)

| Group | Tokens | Notes |
|---|---|---|
| Color | `--brand-primary`, `--brand-accent`, `--text-primary/secondary/muted`, `--color-danger`, `--color-positive`, `--color-success`, `--bg-main/card/tint/muted` | `--color-danger` = "you owe", `--color-positive` = "you are owed" — use these everywhere money direction is shown |
| Type | `--text-2xs` 11 · `xs` 12 · `sm` 13 · `base` 14 · `md` 15 · `lg` 16 · `xl` 18 · `2xl` 20 · `3xl` 24 · `4xl` 28 · `5xl` 32 · `6xl` 40 · `7xl` 48 · `hero` 56 | No half-pixel sizes |
| Weight | `--weight-regular/medium/semibold/bold/extrabold` (400–800) | Plus Jakarta Sans tops out at 800 |
| Role type | `--page-title-size`, `--page-subtitle-size`, `--section-title-size`, `--header-title-size` | Shrink automatically at the md/sm breakpoints |
| Spacing | `--space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `7` 28 · `8` 32 · `10` 40 · `12` 48 · `16` 64 | 4px grid |
| Radius | `--radius-xs` 6 · `sm` 10 · `md` 14 · `lg` 20 (cards) · `xl` 24 · `2xl` 28 (modals) · `full` | |
| Layout | `--container-max` 1120, `--page-gutter` 24 → 16 on phones, `--section-gap`, `--header-height`, `--control-height` 44 | |

## Breakpoints

| Name | Query | What changes |
|---|---|---|
| lg | `max-width: 1024px` | 3-col grids → 2-col, item-split stacks, navbar profile collapses to avatar |
| md | `max-width: 860px` | Two-column page layouts stack (payment, members, invite, calculator), settlements table → cards |
| sm | `max-width: 640px` | Phone UI: `.mobile-only` / `.desktop-only`, smaller gutters, full-width primary buttons |

Use only these three values in media queries.

## Components

- **`<PageHeader>`** (`components/PageHeader.jsx`) — sticky back · title · bell bar for every screen without the navbar. Props: `title`, `subtitle`, `onBack`, `backLabel`, `unreadCount`, `onOpenNotifications`.
- **`<GroupCard>`** (`components/GroupCard.jsx`) — the one group tile used on Dashboard and Groups.
- **Page intro** — `.page-intro` > `.page-intro-text` (`.page-title`, `.page-subtitle`) + optional `.page-actions`.
- **Buttons** — `.btn` + one variant: `btn-primary`, `btn-outline`, `btn-soft`, `btn-muted`, `btn-ghost`, `btn-danger`, `btn-danger-outline`, `btn-text`. Sizes: default 40px, `btn-sm` 34px, `btn-lg` 48px (rounded-rect, for the main CTA of a flow). Modifiers: `btn-block`, `btn-mobile-block` (full-width 48px on phones).
- **Icon buttons** — `.icon-btn` (40px circle), `icon-btn-sm`, `icon-btn-ghost`, `.icon-btn-dot` for the unread dot.
- **Chips** — `.chip-group` > `.chip` (+ `.active`), `chip-sm`. Used for every filter row.
- **Labels** — `.eyebrow` for small uppercase labels above numbers; `.count-pill` next to section titles.
- **Forms** — `.form-group`, `.form-label`, `.form-input`, `.form-select` (+ `.custom-select-wrapper`). All inputs are 44px with the same border/focus ring. `.input-row` for an input with a button.
- **Modals** — `.modal-backdrop` > `.modal-card` > `.modal-header` (`.modal-title-box`, `.modal-close-btn`) … `.modal-actions`. Add a modifier class for width (e.g. `create-group-modal-card`).
- **Feedback** — `.banner .banner-success`, `.form-error-banner`, `.app-toast`, `.empty-state`.

## Rules of thumb

1. No raw hex, px font sizes or px radii in component CSS — reach for a token.
2. One primary (`btn-primary`) action per area; secondary actions use `btn-outline` or `btn-soft`.
3. Cards are `--radius-lg`, `1px solid var(--border-card)`, `var(--shadow-card)`.
4. Grids use `minmax(0, 1fr)` so long names can't push a layout wider than the screen.
5. Check new screens at 1440, 820, 390 and 360px wide.
