---
name: Aureum Noctis
colors:
  surface: '#181209'
  surface-dim: '#181209'
  surface-bright: '#40382d'
  surface-container-lowest: '#130d05'
  surface-container-low: '#211b11'
  surface-container: '#251f15'
  surface-container-high: '#30291e'
  surface-container-highest: '#3b3429'
  on-surface: '#eee0d0'
  on-surface-variant: '#d6c4ac'
  inverse-surface: '#eee0d0'
  inverse-on-surface: '#372f24'
  outline: '#9e8e78'
  outline-variant: '#514532'
  surface-tint: '#ffba38'
  primary: '#ffd79b'
  on-primary: '#432c00'
  primary-container: '#ffb300'
  on-primary-container: '#6b4900'
  inverse-primary: '#7e5700'
  secondary: '#c2c7ce'
  on-secondary: '#2c3137'
  secondary-container: '#444a50'
  on-secondary-container: '#b4b9c0'
  tertiary: '#a4e7ff'
  on-tertiary: '#003543'
  tertiary-container: '#00d2fe'
  on-tertiary-container: '#00566a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdeac'
  primary-fixed-dim: '#ffba38'
  on-primary-fixed: '#281900'
  on-primary-fixed-variant: '#604100'
  secondary-fixed: '#dee3ea'
  secondary-fixed-dim: '#c2c7ce'
  on-secondary-fixed: '#171c21'
  on-secondary-fixed-variant: '#42474d'
  tertiary-fixed: '#b5ebff'
  tertiary-fixed-dim: '#43d6ff'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e60'
  background: '#181209'
  on-background: '#eee0d0'
  surface-variant: '#3b3429'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 57px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.25px
  display-md:
    fontFamily: Inter
    fontSize: 45px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0px
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0px
  title-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.15px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  gutter: 16px
  padding-card: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

This design system is built on the pillars of **precision, high performance, and technical sophistication**. It targets users who value efficiency and power, evoking the feeling of a high-end cockpit or a specialized engineering tool.

The visual style is **Modern Corporate with a Material 3 foundation**, characterized by a focus on tonal hierarchy and functional clarity. By leveraging a deep, monochromatic base punctuated by a singular, high-energy accent, the system creates a focused environment that minimizes eye strain while highlighting critical actions and data points.

## Colors

The palette is optimized for OLED displays and low-light environments. The **Deep Gray** background provides a stable, low-distraction canvas, while the **Gold** primary color serves as a high-visibility beacon for interactive elements and brand expression.

Surface colors utilize a lighter **Deep Gray** variant to create containerized depth without relying on traditional drop shadows. Text is kept to pure white for maximum legibility, with secondary information rendered in a desaturated slate to maintain visual hierarchy.

## Typography

The system utilizes **Inter**, a typeface designed for screens, to ensure exceptional legibility across all Android device densities. The typographic scale follows a strict mathematical rhythm to emphasize data and functional labels.

Headlines are set with tighter letter-spacing and heavier weights to project authority, while body text uses standard weights with generous line-height to ensure comfortable reading of technical content. All labels and buttons use medium weights to differentiate them from static content.

## Layout & Spacing

This design system employs a **fluid grid model** based on an 8dp (density-independent pixel) square rhythm. This ensures alignment and consistency across various Android aspect ratios and screen sizes.

Key layout principles:
- **Margins:** Standard mobile views use a 16dp side margin.
- **Vertical Rhythm:** Elements are stacked using multiples of 4dp and 8dp to create clear groupings.
- **Touch Targets:** All interactive elements maintain a minimum hit area of 48x48dp to comply with accessibility standards while maintaining a compact, modern aesthetic.

## Elevation & Depth

In alignment with Material 3 principles, the design system conveys depth primarily through **Tonal Layers** rather than heavy shadows. 

1.  **Level 0 (Base):** The #1A1C20 background.
2.  **Level 1 (Cards/Containers):** The #2C323A surface color, used to group related information.
3.  **Level 2 (Active States):** Subtle semi-transparent overlays of the primary gold color (5-8% opacity) are applied to surfaces to indicate focus or elevation during interaction.

When shadows are necessary (e.g., floating action buttons), use a highly diffused, 20% opacity black shadow with a 0dp offset to maintain a clean, flat appearance.

## Shapes

The shape language is defined by **modern, approachable geometry**. A consistent corner radius of 12px to 16px (represented by Level 2 roundedness) is applied to all primary containers, including cards, buttons, and input fields.

- **Small Components (Chips/Badges):** Use a 8px radius for a sharper, more technical feel.
- **Medium Components (Buttons/Inputs):** Use a 12px radius.
- **Large Components (Cards/Sheets):** Use a 16px radius.
- **Full Roundedness:** Applied only to search bars and toggle tracks to create a distinct visual break from the structured grid.

## Components

### Buttons
Primary buttons use the Gold (#FFB300) fill with black text for maximum contrast. Secondary buttons use an outlined style with a 1px border in #2C323A. All buttons feature a 12px corner radius.

### Cards
Cards are the primary organizational unit, utilizing the #2C323A surface color. They should not have borders; instead, they rely on the tonal difference against the #1A1C20 background to define their boundaries.

### Chips
Chips are used for filtering and tags. In their unselected state, they use a subtle dark stroke. When selected, they transition to a solid Gold fill or a Gold-tinted border.

### Input Fields
Inputs are rendered as filled containers (#2C323A) with a bottom-only indicator line in Gold when focused. This keeps the interface clean while providing clear feedback.

### Lists
List items are separated by subtle horizontal dividers (#2C323A). For high-density data, dividers are removed in favor of clear vertical spacing.

### Selection Controls
Checkboxes and Radio buttons use the Gold primary color for their "on" states. The track of the switch component should be a dark neutral, with the thumb utilizing the Gold accent to indicate activity.