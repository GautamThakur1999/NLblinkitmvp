---
name: Efficient Commerce System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d8'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1b'
  on-surface-variant: '#4e4634'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#7f7662'
  outline-variant: '#d1c5ae'
  surface-tint: '#755b00'
  primary: '#755b00'
  on-primary: '#ffffff'
  primary-container: '#f8cb46'
  on-primary-container: '#6e5600'
  inverse-primary: '#edc13d'
  secondary: '#006e16'
  on-secondary: '#ffffff'
  secondary-container: '#99f98f'
  on-secondary-container: '#0e751c'
  tertiary: '#5f5e5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#d2cfd0'
  on-tertiary-container: '#595859'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe08f'
  primary-fixed-dim: '#edc13d'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#99f98f'
  secondary-fixed-dim: '#7ddc76'
  on-secondary-fixed: '#002203'
  on-secondary-fixed-variant: '#00530e'
  tertiary-fixed: '#e5e2e3'
  tertiary-fixed-dim: '#c8c6c7'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474647'
  background: '#fcf9f8'
  on-background: '#1b1c1b'
  surface-variant: '#e4e2e1'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  small:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-semibold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base_unit: 4px
  desktop_max_width: 1280px
  columns: '12'
  gutter: 20px
  margin_mobile: 16px
  stack_tight: 4px
  stack_base: 8px
  stack_loose: 16px
---

## Brand & Style

The design system is engineered for high-velocity, utilitarian grocery procurement. It adopts a "Tool-like" aesthetic, prioritizing information density and ease of scanning over marketing-led persuasion. The interface functions as an extension of the pantry—organized, predictable, and quiet.

The style is a blend of **Modern Minimalism** and **Systematic Utility**. It avoids emotional triggers, gamification, and urgency tactics. The visual language is defined by a "packed-shelf" density, where products are the primary focus, supported by a neutral, light-washed color palette and structured hairline boundaries. AI-assisted suggestions are indicated subtly with a signature sparkle mark, ensuring they feel like a helpful assistant rather than an intrusive advertisement.

## Colors

The palette is anchored by functional utility rather than brand expression.
- **Background & Surfaces**: Use `#fcf9f8` for the global canvas to provide a warm, non-clinical base. Surface cards are pure `#ffffff` to stand out against the tinted background.
- **Brand Yellow**: `#f8cb46` is used for brand presence and specific navigational cues. All text on yellow backgrounds must use `#755b00` to ensure legibility and a sophisticated tonal relationship.
- **Action Green**: `#006e16` is reserved exclusively for "Add-to-cart" and quantity management. This color signals a successful utility action.
- **Typography**: Primary text uses `#1b1b1c` for maximum contrast. Secondary metadata uses `#4e4634`, which maintains a relationship with the warm background tint.
- **Boundaries**: Hairline borders use `#e5e2e1`. Do not use colored borders for status or emphasis.

## Typography

This design system uses **Inter** exclusively to lean into its systematic and legible qualities. 
- **Scale**: The hierarchy is tight. Use `H1` only for major category entry points. 
- **Tone**: Copy must remain neutral and descriptive. Avoid exclamation marks or emotive adjectives. Focus on product specs (weight, volume, variety) and basket status.
- **Alignment**: Standardize on left-aligned text for all product data to facilitate rapid vertical scanning.

## Layout & Spacing

The layout philosophy is based on a **packed-shelf** density model. Content should feel abundant and tightly organized.
- **Grid**: A 12-column grid is used for desktop (max 1280px). On mobile, a 2-column or 3-column product grid is preferred to maintain a "tool-like" efficiency.
- **Density**: Use the 4px scale. Components should be placed as close as legibility allows to minimize scrolling.
- **Breakpoints**: 
  - Mobile: < 600px (Fluid, 16px margins).
  - Tablet: 600px - 1024px (12 columns, 20px margins).
  - Desktop: 1024px+ (Fixed 1280px, centered).
- **Navigation**: Avoid "Discover" or "Explore" paradigms. Use a search-first and category-first navigation structure.

## Elevation & Depth

This design system uses a flat, layered approach rather than traditional depth.
- **Base Layer**: The `#fcf9f8` background.
- **Surface Layer**: White cards (`#ffffff`) with a 1px hairline border (`#e5e2e1`).
- **Shadows**: 
  - **Default**: `0 4px 12px rgba(0,0,0,0.05)` — used for cards to provide subtle separation from the background.
  - **Hover**: `0 8px 24px rgba(0,0,0,0.08)` — used for interactive product states.
- **Transitions**: Surfaces should never appear as modals or popups. Use **side-surfaces** (drawers) or inline expansions to maintain the user's flow and context.

## Shapes

The shape language differentiates between containers and actions:
- **Product & Surface Cards**: 16px radius. This provides a soft, approachable container for high-density information.
- **Interactive Buttons**: 8px radius. A sharper radius signals a "tool" that can be clicked or toggled.
- **Chips & Tags**: Full pill-shaped. Used for category tags or filters to distinguish them clearly from rectangular product cards.

## Components

- **Buttons**:
  - **Add-to-Cart**: Uses `Action Green` (#006e16) with white text. Once an item is added, it transforms into a stepper control ([-] 1 [+]) to maintain density.
  - **Primary**: Brand Yellow (#f8cb46) with dark yellow text (#755b00).
- **Product Cards**:
  - No star ratings or reviews.
  - No discount badges or "original price" strike-throughs. Display the current price clearly in `label-semibold`.
  - Image should occupy 60% of the card height.
- **AI Suggestions**:
  - Surfaces containing AI-recommended items should have a subtle 5% yellow tint background.
  - A small, static sparkle icon (single color, `#755b00`) appears in the top-right of the section.
  - No loading spinners; content should be pre-fetched or appear instantly with a simple fade.
- **Lists**:
  - Standardized hairline dividers between items.
  - Content-heavy; include weight/unit information in `small` secondary text directly under the product title.
- **Inputs**:
  - Search bar is the primary anchor of the UI. It should be persistent, using an 8px radius and a subtle hairline border.
- **Side Surfaces**:
  - All "details" or "cart" views slide in from the right (Desktop) or bottom (Mobile). No center-aligned modals.