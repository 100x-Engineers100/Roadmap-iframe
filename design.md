---
name: High-Performance Engineering
colors:
    surface: "#f9f9f9"
    surface-dim: "#dadada"
    surface-bright: "#f9f9f9"
    surface-container-lowest: "#ffffff"
    surface-container-low: "#f3f3f3"
    surface-container: "#eeeeee"
    surface-container-high: "#e8e8e8"
    surface-container-highest: "#e2e2e2"
    on-surface: "#1a1c1c"
    on-surface-variant: "#5a413b"
    inverse-surface: "#2f3131"
    inverse-on-surface: "#f1f1f1"
    outline: "#8e706a"
    outline-variant: "#e2bfb7"
    surface-tint: "#b22c11"
    primary: "#b22c11"
    on-primary: "#ffffff"
    primary-container: "#ff6343"
    on-primary-container: "#610c00"
    inverse-primary: "#ffb4a4"
    secondary: "#5f5e5e"
    on-secondary: "#ffffff"
    secondary-container: "#e2dfde"
    on-secondary-container: "#636262"
    tertiary: "#5e5e5e"
    on-tertiary: "#ffffff"
    tertiary-container: "#979696"
    on-tertiary-container: "#2e2f2f"
    error: "#ba1a1a"
    on-error: "#ffffff"
    error-container: "#ffdad6"
    on-error-container: "#93000a"
    primary-fixed: "#ffdad3"
    primary-fixed-dim: "#ffb4a4"
    on-primary-fixed: "#3e0500"
    on-primary-fixed-variant: "#8d1700"
    secondary-fixed: "#e5e2e1"
    secondary-fixed-dim: "#c8c6c5"
    on-secondary-fixed: "#1b1b1c"
    on-secondary-fixed-variant: "#474746"
    tertiary-fixed: "#e4e2e2"
    tertiary-fixed-dim: "#c7c6c6"
    on-tertiary-fixed: "#1b1c1c"
    on-tertiary-fixed-variant: "#464747"
    background: "#f9f9f9"
    on-background: "#1a1c1c"
    surface-variant: "#e2e2e2"
typography:
    headline-xl:
        fontFamily: Space Grotesk
        fontSize: 64px
        fontWeight: "700"
        lineHeight: "1.1"
        letterSpacing: -0.02em
    headline-lg:
        fontFamily: Space Grotesk
        fontSize: 40px
        fontWeight: "700"
        lineHeight: "1.2"
    headline-md:
        fontFamily: Space Grotesk
        fontSize: 24px
        fontWeight: "600"
        lineHeight: "1.3"
    body-lg:
        fontFamily: Inter
        fontSize: 18px
        fontWeight: "400"
        lineHeight: "1.6"
    body-md:
        fontFamily: Inter
        fontSize: 16px
        fontWeight: "400"
        lineHeight: "1.5"
    label-mono:
        fontFamily: Space Grotesk
        fontSize: 14px
        fontWeight: "500"
        lineHeight: "1.4"
        letterSpacing: 0.05em
rounded:
    sm: 0.125rem
    DEFAULT: 0.25rem
    md: 0.375rem
    lg: 0.5rem
    xl: 0.75rem
    full: 9999px
spacing:
    base: 8px
    container-max: 1280px
    gutter: 24px
    margin: 32px
    stack-sm: 16px
    stack-md: 32px
    stack-lg: 64px
---

## Brand & Style

This design system is engineered for a high-performance, technical audience. It
blends the precision of a code editor with the high-energy aesthetic of modern
tech startups. The personality is authoritative, elite, and fast-paced, designed
to evoke a sense of professional mastery and "100x" productivity.

The visual language draws heavily from **Modern Minimalism** with a
**Technical/Brutalist** edge. It prioritizes clarity and information density
while using aggressive splashes of color to denote action and energy. The system
avoids unnecessary decorative flourishes, opting instead for structural grid
lines, monospaced accents, and high-contrast layouts that reflect the rigors of
engineering.

## Colors

The color palette is built on a foundation of "Solarized" high-contrast tones.
The primary brand color is a high-octane orange-red, used sparingly for critical
actions, highlights, and primary brand markers. This is balanced by a deep,
off-black secondary color that provides grounding and professional weight.

The neutral palette utilizes a cool-toned light gray for background surfaces,
ensuring that content remains the primary focus. For interactive states and
subtle borders, a mid-tone gray provides necessary distinction without adding
visual noise. While the default mode is light, the system is designed to handle
"Dark Mode" effortlessly by inverting the background and text roles while
maintaining the primary orange as a vibrant accent.

## Typography

The typography strategy leverages a dual-font approach to balance technical
character with readability. Headlines use a geometric, technical typeface that
feels futuristic and precise. These should be set with tight leading and slight
negative letter spacing to create a compact, impactful look.

Body text is handled by a neutral, utilitarian sans-serif to ensure long-form
legibility and a professional "SaaS" feel. For labels, buttons, and "meta"
information, the system reverts to the headline font or a monospace alternative
to reinforce the engineering narrative. Use uppercase transformations for small
labels to enhance the systematic, data-driven aesthetic.

## Layout & Spacing

The layout follows a rigid 12-column grid system with a fixed maximum width for
content containers. This ensures stability and predictability across different
screen sizes. A 4px/8px baseline grid governs all vertical spacing, maintaining
a mathematical rhythm throughout the interface.

Information density should remain moderately high. Use generous outer margins to
frame the content, but keep internal component spacing tight and efficient. The
"stack" units should be used to create clear hierarchy between sections, with
larger gaps used primarily to separate distinct logical modules.

## Elevation & Depth

This design system rejects traditional shadows in favor of **Tonal Layering**
and **Bold Outlines**. Depth is communicated through the contrast between
background shades and the use of 1px or 2px solid borders.

Surface containers are differentiated by slight shifts in lightness—for example,
a white card sitting on a light gray background. To indicate interactivity or
"lift," use a "Hard Shadow" or "Offset Fill" effect (a solid block of color
offset by 4px) rather than a soft blur. This maintains the high-performance,
low-latency visual metaphor.

## Shapes

The shape language is disciplined and geometric. A "Soft" roundedness level (4px
to 8px) is applied to buttons and cards to prevent the UI from feeling overly
aggressive, but it remains sharp enough to look technical.

Icons and decorative elements should use thick strokes and square terminals.
Interactive elements like input fields should maintain sharp corners or the
minimum "Soft" radius to align with the precision-tool aesthetic of the design
system.

## Components

- **Buttons:** Primary buttons use the brand orange with white or black text.
  They should have a subtle hover state that either darkens the color or adds a
  solid 2px offset border. Use all-caps for button labels to increase the
  "command" feel.
- **Cards:** Cards should be white with a 1px border (#E0E0E0). Avoid shadows;
  instead, use a slight background color change on hover to indicate lift.
- **Input Fields:** Use a monospaced font for user input. Borders should be dark
  and thin, turning primary orange on focus. Labels sit strictly above the field
  in a smaller, bold typeface.
- **Chips/Badges:** Use high-contrast combinations (e.g., orange text on a very
  light orange background) to highlight tags or status indicators. Shapes should
  be rectangular with the system's standard 4px radius.
- **Lists:** Use horizontal dividers (1px) rather than cards for list items to
  maintain high information density. Incorporate monospaced numerals for ordered
  lists to emphasize the technical nature of the content.
- **Progress Bars:** Use the primary orange for the fill. The track should be
  the secondary dark color or a light gray to create a high-contrast "loading"
  visual.
