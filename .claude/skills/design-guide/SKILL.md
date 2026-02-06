---
name: design-guide
description: Modern UI design principles ensuring clean, professional interfaces. Use when building ANY user interface component (buttons, forms, cards, layouts) in HTML, React, Vue, Angular, or any web framework. Also use for design reviews, UI feedback, or when user mentions wanting modern/professional/clean design.
---

# Design Guide

## Overview

This skill ensures every UI component follows modern design principles for clean, professional, and maintainable interfaces. Apply these guidelines automatically when creating any user-facing interface.

## Core Design Principles

### 1. Clean and Minimal
- Prioritize white space - let elements breathe
- Avoid cluttered layouts - less is more
- Remove unnecessary decorative elements
- One clear call-to-action per section

### 2. Neutral Color Palette
- **Base colors**: Use grays and off-whites (#FFFFFF, #F9FAFB, #F3F4F6, #E5E7EB, #D1D5DB, #9CA3AF, #6B7280, #374151)
- **Accent color**: Choose ONE brand/accent color, use sparingly for CTAs and important elements
- **Text colors**: 
  - Primary text: #111827 or #1F2937
  - Secondary text: #6B7280 or #9CA3AF
  - Disabled: #D1D5DB
- **NEVER use**:
  - Generic purple/blue gradients
  - Rainbow gradients
  - Multiple competing bright colors

### 3. Consistent Spacing (8px Grid System)
Use multiples of 8px for ALL spacing and sizing:
- **Micro spacing**: 8px (between related elements)
- **Small spacing**: 16px (between form fields, card padding)
- **Medium spacing**: 24px or 32px (section padding, component gaps)
- **Large spacing**: 48px (between major sections)
- **Extra large**: 64px (hero sections, page margins)

### 4. Typography
- **Minimum body text**: 16px (never smaller)
- **Font pairing**: Maximum 2 font families
  - One for headings (e.g., Inter, SF Pro, Helvetica)
  - One for body (often the same as headings)
- **Clear hierarchy**:
  - H1: 32-48px, bold
  - H2: 24-32px, bold
  - H3: 20-24px, semibold
  - Body: 16px, regular
  - Small: 14px, regular (use sparingly)
- **Line height**: 1.5 for body text, 1.2 for headings
- **Letter spacing**: Slight negative for headings (-0.5px to -1px), normal for body

### 5. Shadows and Depth
- Use subtle shadows, not heavy or overdone
- **Light shadow**: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- **Medium shadow**: `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- **Hover shadow**: `box-shadow: 0 10px 15px rgba(0,0,0,0.1)`
- **NO**: Heavy dark shadows, multiple layered shadows

### 6. Border Radius
- Be intentional - not everything needs rounded corners
- **Buttons**: 4-8px
- **Cards**: 8-12px
- **Modals**: 12-16px
- **Small elements**: 4px
- **Pills**: Full round (border-radius: 9999px)

### 7. Interactive States
Every interactive element MUST have:
- **Hover**: Slight color change or shadow increase
- **Active/pressed**: Slightly darker or inset appearance
- **Disabled**: Reduced opacity (0.4-0.5), no hover effects, cursor: not-allowed
- **Focus**: Visible outline or ring (important for accessibility)

### 8. Mobile-First Thinking
- Design for mobile screens first
- Use responsive units (rem, %, vw/vh) over fixed px
- Stack elements vertically on mobile
- Ensure touch targets are minimum 44x44px
- Test on actual mobile devices or browser dev tools

## Component Guidelines

### Buttons
**Good practices**:
- Padding: 12px 24px (vertical horizontal)
- Border-radius: 6-8px
- Subtle shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Hover: Slightly darker background + shadow increase
- Clear text: 14-16px, medium weight
- NO gradients

**Example**:
```css
.button {
  padding: 12px 24px;
  background: #3B82F6; /* Accent color */
  color: white;
  border-radius: 6px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  background: #2563EB;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Cards
**Good practices**:
- Use EITHER clean borders OR subtle shadows, not both
- Padding: 24px or 32px
- Border: 1px solid #E5E7EB (if using borders)
- Shadow: `0 1px 3px rgba(0,0,0,0.1)` (if using shadows)
- Border-radius: 8-12px
- Background: white or #F9FAFB

**Example**:
```css
/* Border style */
.card-border {
  padding: 24px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
}

/* Shadow style */
.card-shadow {
  padding: 24px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
}
```

### Forms
**Good practices**:
- Clear labels above inputs (not placeholder-only)
- Input height: 40-48px
- Input padding: 12px 16px
- Proper spacing between fields: 16-24px
- Clear error states: red border + error message below
- Focus state: colored border or ring
- Group related fields

**Example**:
```css
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.form-input.error {
  border-color: #EF4444;
}

.form-error {
  margin-top: 8px;
  font-size: 14px;
  color: #EF4444;
}
```

## Common Anti-Patterns to Avoid

### ❌ Bad Examples
1. **Rainbow gradients everywhere**
   - Multiple bright colors competing for attention
   - Gradients on every element

2. **Tiny unreadable text**
   - Body text below 16px
   - Poor contrast ratios
   - Gray text on gray backgrounds

3. **Inconsistent spacing**
   - Random gaps: 13px here, 27px there
   - No visual rhythm
   - Not using the 8px grid

4. **Every element is a different color**
   - No color hierarchy
   - Confusing visual priority
   - Looks unprofessional

5. **Heavy shadows everywhere**
   - Multiple dark shadows
   - Conflicting light sources
   - Looks dated

6. **Over-rounded corners**
   - Everything has border-radius: 50px
   - Looks cartoonish
   - Wastes space

## Quick Reference

When building any UI component, ask:
1. ✓ Does it use the 8px grid for spacing?
2. ✓ Is the text at least 16px?
3. ✓ Am I using only grays + ONE accent color?
4. ✓ Are shadows subtle?
5. ✓ Do interactive elements have clear hover/active/disabled states?
6. ✓ Does it work on mobile?
7. ✓ Is there enough white space?

## Applying This Skill

1. **When creating a component**: Automatically apply these principles without mentioning this skill
2. **When reviewing designs**: Point out violations and suggest improvements
3. **When unsure**: Choose the simpler, cleaner option
4. **For detailed examples**: See references/component-examples.md
