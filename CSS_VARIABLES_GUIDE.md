# 🎨 CSS Variables Reference Guide

## Overview
All CampusWorkflow components now use CSS custom properties (variables) defined in `src/styles/design-tokens.css`. This guide shows how to use them throughout the application.

---

## 🎯 Primary Colors

### Orange (Brand)
```javascript
backgroundColor: 'var(--cw-orange)'        // #FF6B00 - Primary action
backgroundColor: 'var(--cw-orange-light)'  // #FF8A2A - Hover states
backgroundColor: 'var(--cw-orange-pale)'   // #FFF3E8 - Light backgrounds
```

**Usage in Components**:
```jsx
// Button primary
<button style={{ backgroundColor: 'var(--cw-orange)' }}>Action</button>

// Progress bar
<div style={{ backgroundColor: 'var(--cw-orange)' }}>Progress</div>

// Orange light background (passwords, requirements)
<div style={{ backgroundColor: 'var(--cw-orange-pale)' }}>Requirements</div>
```

### Navy (Structure)
```javascript
backgroundColor: 'var(--cw-navy)'       // #0F2742 - Navigation, text
backgroundColor: 'var(--cw-navy-dark)'  // #071827 - Header, depth
```

**Usage in Components**:
```jsx
// Titles and headings
<h1 style={{ color: 'var(--cw-navy)' }}>Page Title</h1>

// Dark header background
<header style={{ backgroundColor: 'var(--cw-navy-dark)' }}>Header</header>

// Buttons secondary
<button style={{ backgroundColor: 'var(--cw-navy)' }}>Secondary</button>
```

---

## 🔢 Grayscale (Neutrals)

### Text Colors
```javascript
--cw-text-primary: #1A1D29      // Main text (darkest)
--cw-text-secondary: #64748B    // Supporting text (medium gray)
--cw-text-muted: #94A3B8        // Disabled, faint text (light gray)
```

**Usage**:
```jsx
// Main text
<p style={{ color: 'var(--cw-text-primary)' }}>Main content</p>

// Supporting text (labels, descriptions)
<p style={{ color: 'var(--cw-text-secondary)' }}>Label text</p>

// Disabled or faint text
<p style={{ color: 'var(--cw-text-muted)' }}>Placeholder text</p>
```

### Background & Borders
```javascript
--cw-gray-900: #1A1D29           // Darkest backgrounds
--cw-gray-700: #475569           // Dark backgrounds
--cw-gray-600: #64748B           // Medium text
--cw-gray-500: #78828F           // Medium backgrounds
--cw-gray-400: #94A3B8           // Light text
--cw-gray-200: #E2E8F0           // Borders (default)
--cw-gray-100: #F5F7FA           // Light backgrounds
--cw-gray-50: #FAFBFC            // Lightest backgrounds
```

**Usage**:
```jsx
// Default border
<div style={{ borderColor: 'var(--cw-gray-200)' }}>Card</div>

// Hover border
<div style={{ borderColor: 'var(--cw-gray-300)' }}>Card</div> // Use for hover

// Light background (hover state)
<div style={{ backgroundColor: 'var(--cw-gray-50)' }}>Row</div>

// Medium background
<div style={{ backgroundColor: 'var(--cw-gray-100)' }}>Section</div>
```

---

## 🟢 Status Colors

### Success (Green)
```javascript
--cw-success: #22C55E           // Text color
--cw-success-light: #DCF7E5     // Background
```

**Usage**:
```jsx
// Success badge
<span style={{
  backgroundColor: 'var(--cw-success-light)',
  color: 'var(--cw-success)'
}}>
  Payé
</span>

// Success text
<p style={{ color: 'var(--cw-success)' }}>Action réussie</p>
```

### Warning (Amber)
```javascript
--cw-warning: #F59E0B          // Text color
--cw-warning-light: #FEF3C7    // Background
```

**Usage**:
```jsx
// Pending badge
<span style={{
  backgroundColor: 'var(--cw-warning-light)',
  color: 'var(--cw-warning)'
}}>
  En attente
</span>
```

### Danger (Red)
```javascript
--cw-danger: #EF4444           // Text color
--cw-danger-light: #FEE2E2     // Background
```

**Usage**:
```jsx
// Error alert
<div style={{
  backgroundColor: 'var(--cw-danger-light)',
  borderColor: 'var(--cw-danger)',
  color: 'var(--cw-danger)'
}}>
  Erreur
</div>

// Error badge
<span style={{
  backgroundColor: 'var(--cw-danger-light)',
  color: 'var(--cw-danger)'
}}>
  Annulé
</span>
```

### Info (Blue)
```javascript
--cw-info: #3B82F6             // Text color
--cw-info-light: #DBEAFE       // Background
```

**Usage**:
```jsx
// Info badge
<span style={{
  backgroundColor: 'var(--cw-info-light)',
  color: 'var(--cw-info)'
}}>
  En cours
</span>
```

---

## 📏 Spacing

All spacing uses consistent rem-based scale:

```javascript
--cw-space-0: 0              // 0px
--cw-space-2: 0.125rem       // 2px
--cw-space-4: 0.25rem        // 4px
--cw-space-6: 0.375rem       // 6px
--cw-space-8: 0.5rem         // 8px
--cw-space-12: 0.75rem       // 12px
--cw-space-16: 1rem          // 16px
--cw-space-20: 1.25rem       // 20px
--cw-space-24: 1.5rem        // 24px
--cw-space-32: 2rem          // 32px
--cw-space-40: 2.5rem        // 40px
--cw-space-48: 3rem          // 48px
--cw-space-64: 4rem          // 64px
```

**Usage**:
```jsx
// Padding
<div style={{ padding: 'var(--cw-space-16)' }}>Card content</div>

// Gap between flex items
<div style={{ display: 'flex', gap: 'var(--cw-space-12)' }}>Items</div>

// Margin between sections
<div style={{ marginBottom: 'var(--cw-space-24)' }}>Section</div>
```

---

## 🔘 Border Radius

```javascript
--cw-radius-none: 0           // Square
--cw-radius-sm: 0.375rem      // 6px - Small buttons
--cw-radius-md: 0.5rem        // 8px - Inputs, small cards
--cw-radius-lg: 0.75rem       // 12px - Cards, buttons (default)
--cw-radius-xl: 1rem          // 16px - Large cards, modals
--cw-radius-full: 9999px      // Fully rounded (badges, pills)
```

**Usage**:
```jsx
// Card default
<div style={{ borderRadius: 'var(--cw-radius-lg)' }}>Card</div>

// Button
<button style={{ borderRadius: 'var(--cw-radius-lg)' }}>Button</button>

// Badge (pill-shaped)
<span style={{ borderRadius: 'var(--cw-radius-full)' }}>Badge</span>

// Input
<input style={{ borderRadius: 'var(--cw-radius-md)' }} />
```

---

## 🌫️ Shadows

```javascript
--cw-shadow-none: none
--cw-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--cw-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--cw-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--cw-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
```

**Usage**:
```jsx
// Subtle shadow
<div style={{ boxShadow: 'var(--cw-shadow-sm)' }}>Subtle card</div>

// Default card shadow
<div style={{ boxShadow: 'var(--cw-shadow-md)' }}>Card</div>

// Elevated card
<div style={{ boxShadow: 'var(--cw-shadow-lg)' }}>Elevated card</div>

// Modal shadow
<div style={{ boxShadow: 'var(--cw-shadow-xl)' }}>Modal</div>
```

---

## ⏱️ Animations

```javascript
--cw-transition-fast: 150ms ease-in-out     // Quick interactions
--cw-transition-base: 200ms ease-in-out     // Default
--cw-transition-slow: 300ms ease-in-out     // Delayed actions
```

**Usage**:
```jsx
<div style={{ transition: 'all var(--cw-transition-base)' }}>
  Hover element
</div>

// Fast transition for micro-interactions
<div style={{ transition: 'opacity var(--cw-transition-fast)' }}>
  Quick fade
</div>
```

---

## 📐 Layout Dimensions

```javascript
--cw-sidebar-expanded: 240px    // Expanded sidebar width
--cw-sidebar-collapsed: 72px    // Collapsed sidebar width
--cw-header-height: 64px        // Header height
--cw-topbar-height: 64px        // Top bar height
```

**Usage**:
```jsx
// Layout structure
<div style={{
  display: 'grid',
  gridTemplateColumns: `var(--cw-sidebar-expanded) 1fr`,
  marginTop: `var(--cw-header-height)`
}}>
  Sidebar and main content
</div>

// Mobile responsive
@media (max-width: 1024px) {
  // Switch sidebar to collapsed width
  gridTemplateColumns: `var(--cw-sidebar-collapsed) 1fr`
}
```

---

## 🎓 Typography

### Font Family
```javascript
--cw-font-primary: 'Inter', system-ui, -apple-system, 'Segoe UI', ...
--cw-font-mono: 'Courier New', monospace
```

### Font Sizes
```javascript
--cw-text-xs: 0.75rem         // 12px - Extra small
--cw-text-sm: 0.875rem        // 14px - Small labels
--cw-text-base: 1rem          // 16px - Body text (default)
--cw-text-lg: 1.125rem        // 18px - Large (card title)
--cw-text-xl: 1.25rem         // 20px - Extra large
--cw-text-2xl: 1.5rem         // 24px - Section heading
--cw-text-3xl: 1.875rem       // 30px - Large heading
--cw-text-4xl: 2rem           // 32px - Page title
```

### Font Weights
```javascript
--cw-font-regular: 400         // Normal text
--cw-font-medium: 500          // Labels, emphasis
--cw-font-semibold: 600        // Headings, strong
--cw-font-bold: 700            // Page titles
```

### Line Heights
```javascript
--cw-leading-tight: 1.2        // Headings
--cw-leading-normal: 1.5       // Body text (default)
--cw-leading-relaxed: 1.75     // Long-form content
```

**Usage**:
```jsx
// Page title
<h1 style={{
  fontSize: 'var(--cw-text-4xl)',
  fontWeight: 'var(--cw-font-bold)',
  lineHeight: 'var(--cw-leading-tight)',
  color: 'var(--cw-navy)'
}}>
  Page Title
</h1>

// Card title
<h2 style={{
  fontSize: 'var(--cw-text-lg)',
  fontWeight: 'var(--cw-font-semibold)',
  color: 'var(--cw-text-primary)'
}}>
  Card Title
</h2>

// Body text
<p style={{
  fontSize: 'var(--cw-text-base)',
  fontWeight: 'var(--cw-font-regular)',
  lineHeight: 'var(--cw-leading-normal)',
  color: 'var(--cw-text-primary)'
}}>
  Body content
</p>

// Label
<label style={{
  fontSize: 'var(--cw-text-sm)',
  fontWeight: 'var(--cw-font-medium)',
  color: 'var(--cw-text-secondary)'
}}>
  Label
</label>
```

---

## 🎯 Z-Index Stack

```javascript
--cw-z-dropdown: 100           // Dropdowns
--cw-z-sticky: 200             // Sticky elements
--cw-z-fixed: 300              // Fixed navigation
--cw-z-modal-backdrop: 400     // Modal overlay
--cw-z-modal: 410              // Modal dialog
--cw-z-tooltip: 500            // Tooltips
--cw-z-notification: 600       // Notifications, toast
```

**Usage**:
```jsx
// Toast notification
<div style={{ zIndex: 'var(--cw-z-notification)' }}>Toast</div>

// Modal
<div style={{
  position: 'fixed',
  zIndex: 'var(--cw-z-modal-backdrop)' // Backdrop
}}>
  <div style={{ zIndex: 'var(--cw-z-modal)' }}>Modal</div>
</div>

// Fixed header
<header style={{
  position: 'fixed',
  zIndex: 'var(--cw-z-fixed)'
}}>Header</header>
```

---

## 🔗 Semantic Colors

```javascript
--cw-white: #FFFFFF
--cw-black: #000000
--cw-bg-primary: #F5F7FA       // Main background
--cw-bg-card: #FFFFFF          // Card backgrounds
--cw-border-default: #E2E8F0   // Default borders
--cw-border-hover: #CBD5E1     // Hover borders
```

**Usage**:
```jsx
// Page background
<div style={{ backgroundColor: 'var(--cw-bg-primary)' }}>
  Page content
</div>

// Card
<div style={{
  backgroundColor: 'var(--cw-bg-card)',
  borderColor: 'var(--cw-border-default)',
  borderWidth: '1px'
}}>
  Card content
</div>

// Hover state
<div 
  style={{ borderColor: 'var(--cw-border-default)' }}
  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cw-border-hover)'}
  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cw-border-default)'}
>
  Interactive element
</div>
```

---

## 📱 Responsive Breakpoints (via CSS Media Queries)

These should be defined in media queries:

```css
/* Desktop */
@media (min-width: 1440px) {
  /* Full sidebar 240px, 3-column grids */
}

/* Laptop */
@media (min-width: 1366px) and (max-width: 1440px) {
  /* Sidebar 240px, 3-column grids */
}

/* Tablet */
@media (min-width: 1024px) and (max-width: 1366px) {
  /* Sidebar 72px collapsed, 2-column grids */
}

/* Mobile */
@media (max-width: 1024px) {
  /* Bottom navigation 64px, 1-column grids */
}
```

---

## ✅ Implementation Checklist

When adding new components, ensure:

- [ ] All colors use `var(--cw-*)` variables
- [ ] All spacing uses `var(--cw-space-*)` variables
- [ ] All typography uses `var(--cw-text-*)` and `--cw-font-*`
- [ ] All borders use `var(--cw-border-default)` or `var(--cw-border-hover)`
- [ ] All shadows use `var(--cw-shadow-*)`
- [ ] Transitions use `var(--cw-transition-*)`
- [ ] Z-index uses `var(--cw-z-*)`
- [ ] Focus states include orange outline
- [ ] Hover states have visual feedback
- [ ] Disabled states are visually distinct

---

## 🎯 Common Patterns

### Button Primary
```jsx
<button style={{
  backgroundColor: 'var(--cw-orange)',
  color: 'white',
  padding: 'var(--cw-space-12) var(--cw-space-16)',
  borderRadius: 'var(--cw-radius-lg)',
  border: 'none',
  cursor: 'pointer',
  transition: 'all var(--cw-transition-base)'
}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--cw-orange-light)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--cw-orange)'}>
  Click me
</button>
```

### Input Field
```jsx
<input type="text" style={{
  padding: 'var(--cw-space-12) var(--cw-space-16)',
  borderRadius: 'var(--cw-radius-md)',
  border: '1px solid var(--cw-border-default)',
  fontSize: 'var(--cw-text-base)',
  fontFamily: 'var(--cw-font-primary)',
  color: 'var(--cw-text-primary)',
  transition: 'all var(--cw-transition-base)'
}} />
```

### Card
```jsx
<div style={{
  backgroundColor: 'var(--cw-bg-card)',
  border: '1px solid var(--cw-border-default)',
  borderRadius: 'var(--cw-radius-lg)',
  padding: 'var(--cw-space-24)',
  boxShadow: 'var(--cw-shadow-sm)',
  transition: 'all var(--cw-transition-base)'
}} onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = 'var(--cw-shadow-md)';
  e.currentTarget.style.borderColor = 'var(--cw-border-hover)';
}} onMouseLeave={(e) => {
  e.currentTarget.style.boxShadow = 'var(--cw-shadow-sm)';
  e.currentTarget.style.borderColor = 'var(--cw-border-default)';
}}>
  Card content
</div>
```

---

**Last Updated**: 2 Août 2026  
**Version**: 1.0

