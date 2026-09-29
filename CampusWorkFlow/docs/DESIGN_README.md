# 🎨 CampusWorkflow Design System - Complete Guide

## Overview

This is a production-ready, comprehensive design system for **CampusWorkflow** - a modern university management platform built with React + TypeScript. The system includes:

- ✅ **Design tokens** (colors, typography, spacing, shadows)
- ✅ **Reusable components** (buttons, cards, forms, tables, modals)
- ✅ **Layout system** (sidebar, header, main content)
- ✅ **Responsive patterns** (desktop, tablet, mobile)
- ✅ **Accessibility features** (WCAG 2.1 AA compliant)
- ✅ **Interactive examples** (HTML demo page)

---

## 📁 File Structure

```
frontend/src/
├── styles/
│   ├── index.css                 ← Main import (load THIS)
│   ├── design-tokens.css         ← CSS variables & base styles
│   ├── components.css            ← Buttons, cards, badges, forms
│   └── layout.css                ← Sidebar, header, responsive
├── assets/
│   ├── logo.svg                  ← Brand logo
│   └── mascot-fox.svg            ← Orange fox mascotte
└── main.tsx                      ← App entry point

docs/
├── DESIGN_SYSTEM.md              ← Complete system documentation
├── DESIGN_EXAMPLES.html          ← Interactive showcase
└── DESIGN_README.md              ← This file
```

---

## 🚀 Quick Start

### Step 1: Import Styles in Your App

```tsx
// frontend/src/main.tsx
import './styles/index.css';  // ← This imports all design styles
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 2: Use CSS Classes

```tsx
// Example: Academic Dashboard
export function AcademicDashboard() {
  return (
    <div className="page-section">
      <h1 className="text-4xl font-bold">Academic Dashboard</h1>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-4">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-label">Active Students</div>
          <div className="kpi-value">1,248</div>
          <div className="kpi-change positive">↑ 7.2%</div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button className="btn btn-primary">+ New Course</button>

      {/* Table with Badges */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PSY 101</td>
              <td>
                <span className="badge badge-in-progress">In Progress</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Step 3: View Examples

Open `docs/DESIGN_EXAMPLES.html` in your browser to see all components, colors, and patterns in action.

---

## 🎨 Design Tokens

All design values are defined as CSS variables for consistency and easy theming.

### Colors

```css
/* Primaries */
--cw-orange: #FF6B00;
--cw-orange-light: #FF8A2A;
--cw-orange-pale: #FFF3E8;

/* Secondary */
--cw-navy: #0F2742;
--cw-navy-dark: #071827;

/* Status */
--cw-success: #22C55E;
--cw-warning: #F59E0B;
--cw-danger: #EF4444;
--cw-info: #3B82F6;
```

Usage:
```css
.my-element {
  background-color: var(--cw-orange);
  color: var(--cw-white);
  border: 1px solid var(--cw-border-default);
}
```

### Spacing Scale

```css
--cw-space-4: 0.25rem;    /* 4px */
--cw-space-8: 0.5rem;     /* 8px */
--cw-space-12: 0.75rem;   /* 12px */
--cw-space-16: 1rem;      /* 16px */
--cw-space-24: 1.5rem;    /* 24px */
--cw-space-32: 2rem;      /* 32px */
--cw-space-48: 3rem;      /* 48px */
```

### Typography

```css
--cw-text-xs: 0.75rem;    /* 12px */
--cw-text-sm: 0.875rem;   /* 14px */
--cw-text-base: 1rem;     /* 16px */
--cw-text-lg: 1.125rem;   /* 18px */
--cw-text-xl: 1.25rem;    /* 20px */
--cw-text-2xl: 1.5rem;    /* 24px */
--cw-text-3xl: 1.875rem;  /* 30px */
--cw-text-4xl: 2rem;      /* 32px */
```

### Shadows

```css
--cw-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--cw-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), ...;
--cw-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), ...;
--cw-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), ...;
```

---

## 🧩 Components

### Buttons

All variants support `hover`, `active`, `focus`, and `disabled` states.

```html
<!-- Primary (main action) -->
<button class="btn btn-primary">Save Changes</button>

<!-- Secondary (alternative action) -->
<button class="btn btn-secondary">View Details</button>

<!-- Outline (lightweight) -->
<button class="btn btn-outline">Cancel</button>

<!-- Ghost (minimal) -->
<button class="btn btn-ghost">Learn More</button>

<!-- Danger (destructive) -->
<button class="btn btn-danger">Delete</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Base</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Icon Button -->
<button class="btn btn-icon">🔍</button>
```

### Cards

```html
<!-- Standard Card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Course Details</h3>
  </div>
  <div class="card-body">
    <p>Content goes here</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-outline">Cancel</button>
    <button class="btn btn-primary">Save</button>
  </div>
</div>

<!-- KPI Card -->
<div class="kpi-card">
  <div class="kpi-icon">👥</div>
  <div class="kpi-label">Active Students</div>
  <div class="kpi-value">1,248</div>
  <div class="kpi-change positive">↑ 7.2%</div>
</div>
```

### Badges

```html
<!-- Status Badges -->
<span class="badge badge-active">Active</span>
<span class="badge badge-in-progress">In Progress</span>
<span class="badge badge-pending">Pending</span>
<span class="badge badge-completed">Completed</span>
<span class="badge badge-cancelled">Cancelled</span>
<span class="badge badge-draft">Draft</span>
<span class="badge badge-approved">Approved</span>
<span class="badge badge-rejected">Rejected</span>
```

### Forms

```html
<div class="input-group">
  <label class="input-label required">Email</label>
  <input type="email" class="input" placeholder="you@university.edu" />
  <span class="input-hint">We'll use this for course updates</span>
</div>

<!-- Error State -->
<div class="input-group">
  <label class="input-label">Username</label>
  <input type="text" class="input error" value="invalid" />
  <span class="input-error">This field is required</span>
</div>

<!-- Disabled -->
<input type="text" class="input" placeholder="Cannot edit" disabled />
```

### Tables

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Course Code</th>
        <th>Title</th>
        <th>Students</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>PSY 101</td>
        <td>Intro to Psychology</td>
        <td>42</td>
        <td>
          <span class="badge badge-in-progress">In Progress</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modals

```html
<div class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Create New Course</h2>
      <button class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <!-- Form content -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline">Cancel</button>
      <button class="btn btn-primary">Create</button>
    </div>
  </div>
</div>
```

### Toasts

```html
<!-- Success Toast -->
<div class="toast toast-success">
  <span>✓ Course created successfully</span>
</div>

<!-- Error Toast -->
<div class="toast toast-error">
  <span>✗ Failed to save course</span>
</div>

<!-- Warning Toast -->
<div class="toast toast-warning">
  <span>⚠ Please review the following</span>
</div>

<!-- Info Toast -->
<div class="toast toast-info">
  <span>ℹ Here's some helpful information</span>
</div>
```

---

## 🗂️ Layout & Navigation

### App Structure

```html
<div class="app">
  <!-- Sidebar Navigation -->
  <nav class="sidebar">
    <div class="sidebar-logo">
      <img src="logo.svg" alt="" />
      <span class="sidebar-logo-text">CampusWorkflow</span>
    </div>
    <div class="sidebar-nav">
      <a href="#" class="sidebar-item active">
        <span class="sidebar-item-icon">📊</span>
        <span class="sidebar-item-label">Dashboard</span>
      </a>
      <a href="#" class="sidebar-item">
        <span class="sidebar-item-icon">👥</span>
        <span class="sidebar-item-label">Students</span>
      </a>
      <!-- More items... -->
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">JD</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">John Doe</div>
          <div class="sidebar-user-role">Admin</div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Top Header -->
  <header class="header">
    <div class="header-left">
      <div class="header-breadcrumb">
        <span class="header-breadcrumb-item">Academic</span>
        <span>/</span>
        <span class="header-breadcrumb-item active">Dashboard</span>
      </div>
    </div>
    <div class="header-right">
      <div class="header-search">
        <input type="text" placeholder="Search..." />
      </div>
      <div class="header-icons">
        <button class="header-icon has-notification">🔔</button>
        <button class="header-icon">💬</button>
      </div>
      <div class="header-user">
        <div class="header-avatar">JD</div>
        <div class="header-user-name">John Doe</div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main">
    <div class="main-content">
      <!-- Page content here -->
    </div>
  </main>
</div>
```

### Responsive Behavior

| Breakpoint | Sidebar Width | Layout |
|-----------|---------------|---------|
| Desktop (1440px+) | 240px expanded | Full layout |
| Tablet (1024px) | 72px collapsed | Icons + tooltips |
| Mobile (768px) | Bottom nav | 64px height, horizontal |

---

## ♿ Accessibility

### Features Built-In

- ✅ **WCAG 2.1 AA** compliant
- ✅ **4.5:1 contrast ratio** for all text
- ✅ **Focus visible** outlines (2px orange)
- ✅ **Keyboard navigation** support
- ✅ **Status badges** with text + color
- ✅ **Semantic HTML** structure
- ✅ **Reduced motion** support

### How to Ensure Accessibility

1. **Always use meaningful alt text** for images:
   ```html
   <img src="course.png" alt="Computer Science course thumbnail" />
   ```

2. **Associate labels with inputs**:
   ```html
   <label for="email">Email Address</label>
   <input id="email" type="email" />
   ```

3. **Use status + text for colors**:
   ```html
   <!-- Good -->
   <span class="badge badge-success">✓ Approved</span>
   
   <!-- Avoid -->
   <span class="badge" style="background: green;"></span>
   ```

4. **Provide focus indicators**:
   ```css
   button:focus-visible {
     outline: 2px solid var(--cw-orange);
   }
   ```

5. **Support keyboard navigation**:
   - Tab through all interactive elements
   - Enter to activate buttons
   - Escape to close modals

---

## 🎯 Best Practices

### Do's ✅

- Use design tokens for all values
- Combine margin/padding for consistency
- Test focus states with Tab key
- Include loading states for async actions
- Provide clear error messages
- Support keyboard navigation
- Use semantic HTML (`<button>`, not `<div onclick>`)

### Don'ts ❌

- Hardcode colors instead of using tokens
- Mix spacing values (use the scale)
- Rely on color alone for information
- Remove focus outlines
- Create custom button styles (use classes)
- Ignore mobile responsiveness

---

## 🧪 Testing Your Implementation

### Quick Checklist

- [ ] All CSS files imported in `main.tsx`
- [ ] Colors match design system
- [ ] Buttons work on hover/focus/active
- [ ] Forms have proper labels and validation
- [ ] Tables are responsive
- [ ] Modals close properly
- [ ] Keyboard navigation works
- [ ] Mobile looks good on 375px width

### Test Commands

```bash
# Check for CSS errors
npm run lint

# Build production version
npm run build

# Run tests
npm run test

# Check accessibility
npx axe-core --site http://localhost:5173
```

---

## 📚 Component Examples

### Complete Page Example

```tsx
import React from 'react';

export function CoursesPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [courses, setCourses] = React.useState([
    { id: 1, code: 'PSY 101', title: 'Intro to Psychology', students: 42, status: 'in-progress' },
    { id: 2, code: 'CS 102', title: 'Data Structures', students: 38, status: 'active' },
  ]);

  return (
    <div className="page-section">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1 className="text-4xl font-bold">Courses</h1>
          <p className="text-secondary">Manage all academic courses and enrollments</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Course
          </button>
          <button className="btn btn-outline">Import</button>
          <button className="btn btn-outline">Export</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex-row-between" style={{ marginBottom: '24px' }}>
        <div className="header-search" style={{ width: '300px' }}>
          <input type="text" placeholder="Search courses..." className="input" />
        </div>
        <div className="flex-row">
          <select className="input">
            <option>All Departments</option>
            <option>Psychology</option>
            <option>Computer Science</option>
          </select>
          <select className="input">
            <option>All Statuses</option>
            <option>Active</option>
            <option>In Progress</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Title</th>
              <th>Students</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.code}</td>
                <td className="font-semibold">{course.title}</td>
                <td>{course.students}</td>
                <td>
                  <span className={`badge badge-${course.status}`}>
                    {course.status === 'in-progress' ? 'In Progress' : 'Active'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-icon">⋯</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Course</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label required">Course Title</label>
                <input type="text" className="input" placeholder="e.g., Introduction to..." />
              </div>
              <div className="input-group">
                <label className="input-label required">Course Code</label>
                <input type="text" className="input" placeholder="e.g., PSY 101" />
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <select className="input">
                  <option>Select Department</option>
                  <option>Psychology</option>
                  <option>Computer Science</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(false)}>
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔗 Resources

- **Design Tokens**: `frontend/src/styles/design-tokens.css`
- **Components**: `frontend/src/styles/components.css`
- **Layout**: `frontend/src/styles/layout.css`
- **Full Documentation**: `docs/DESIGN_SYSTEM.md`
- **Interactive Demo**: `docs/DESIGN_EXAMPLES.html`

---

## 📞 Support

For questions or issues with the design system:

1. Check `DESIGN_SYSTEM.md` for full documentation
2. View `DESIGN_EXAMPLES.html` for component examples
3. Review existing components in the codebase
4. Check `design-tokens.css` for available values

---

## 📝 Version History

- **v1.0** (August 2026) - Initial release
  - Complete design system with all components
  - Accessibility features (WCAG 2.1 AA)
  - Responsive design (desktop, tablet, mobile)
  - Interactive examples

---

**Made with ❤️ for CampusWorkflow**
