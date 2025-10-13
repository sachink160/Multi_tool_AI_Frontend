# Dark Mode & Color Management Guide

This comprehensive guide explains how to use the dark mode system and color management in your Multi-Tool AI frontend application.

## Overview

The application now features a complete dark mode system with:
- **Three Theme Options**: Light, Dark, and System (follows OS preference)
- **Comprehensive Color Management**: Feature-specific color palettes
- **Accessibility Compliance**: Proper contrast ratios and focus states
- **Consistent Design System**: Pre-built components and utilities

## Color Management System

### 🎨 **Color Palette Structure**

The application uses a structured color system with:

1. **Primary Colors**: Blue-based primary palette
2. **Feature Colors**: Specific colors for each feature (Documents, HR, Videos, Chat, Prompts, Subscription)
3. **Semantic Colors**: Success, Warning, Error, Info
4. **Neutral Colors**: Enhanced gray palette for backgrounds and text

### 📊 **Feature-Specific Colors**

```typescript
// Each feature has its own color palette
documents: Blue (#3b82f6)
hr: Green (#10b981) 
videos: Purple (#8b5cf6)
chat: Orange (#f59e0b)
prompts: Indigo (#6366f1)
subscription: Yellow (#eab308)
```

## Components Added

### 1. ThemeContext (`src/contexts/ThemeContext.tsx`)
- Manages theme state and persistence
- Provides theme switching functionality
- Handles system preference detection
- Automatically applies theme to document root

### 2. ThemeToggle Component (`src/components/ThemeToggle.tsx`)
- Reusable theme toggle button
- Shows current theme with appropriate icons
- Cycles through: Light → Dark → System → Light
- Supports optional label display

### 3. Color Management System (`src/utils/colorManagement.ts`)
- Centralized color palette management
- Feature-specific color utilities
- Theme-aware color classes
- Component-specific color schemes

### 4. Enhanced Tailwind Configuration (`tailwind.config.js`)
- Complete color palette definitions
- Feature-specific color scales
- Custom gradients and animations
- Dark mode optimized colors

### 5. Comprehensive CSS (`src/index.css`)
- Pre-built component classes
- Feature-specific utilities
- Dark mode optimized styles
- Accessibility-focused design

## How to Use

### Basic Theme Usage

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <p>Current theme: {theme}</p>
      <p>Actual theme: {actualTheme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Using Pre-built Component Classes

```tsx
// Cards
<div className="card-glass">Glass effect card</div>
<div className="card">Standard card</div>

// Feature-specific cards
<div className="card-documents">Documents card</div>
<div className="card-hr">HR card</div>
<div className="card-videos">Videos card</div>

// Buttons
<button className="btn-primary">Primary Button</button>
<button className="btn-success">Success Button</button>
<button className="btn-warning">Warning Button</button>
<button className="btn-error">Error Button</button>

// Inputs
<input className="input-field" placeholder="Enter text..." />

// Alerts
<div className="alert-success">Success message</div>
<div className="alert-warning">Warning message</div>
<div className="alert-error">Error message</div>
<div className="alert-info">Info message</div>
```

### Feature-Specific Styling

```tsx
// Documents feature
<div className="card-documents">
  <div className="icon-bg-documents">
    <FileText className="text-documents" />
  </div>
  <h3 className="text-documents">Document Title</h3>
</div>

// HR feature
<div className="card-hr">
  <div className="icon-bg-hr">
    <Users className="text-hr" />
  </div>
  <h3 className="text-hr">HR Document</h3>
</div>

// Videos feature
<div className="card-videos">
  <div className="icon-bg-videos">
    <Video className="text-videos" />
  </div>
  <h3 className="text-videos">Video Processing</h3>
</div>
```

### Using Color Management Utilities

```tsx
import { getThemeAwareClasses, componentColors } from '../utils/colorManagement';

function FeatureCard({ feature }) {
  const colors = getThemeAwareClasses(feature);
  
  return (
    <div className={`${componentColors.card.background} ${componentColors.card.border}`}>
      <div className={colors.icon}>
        <Icon className={colors.text} />
      </div>
      <h3 className={colors.text}>Feature Title</h3>
    </div>
  );
}
```

## Dark Mode CSS Classes

### Background Colors
```css
/* Primary backgrounds */
bg-white dark:bg-gray-800          /* Main content */
bg-gray-50 dark:bg-gray-900        /* Secondary backgrounds */
bg-white/80 dark:bg-gray-800/80     /* Glass effect */

/* Feature backgrounds */
bg-documents-50 dark:bg-documents-900/20
bg-hr-50 dark:bg-hr-900/20
bg-videos-50 dark:bg-videos-900/20
```

### Text Colors
```css
/* Primary text */
text-gray-900 dark:text-white       /* Main text */
text-gray-600 dark:text-gray-300   /* Secondary text */
text-gray-500 dark:text-gray-400    /* Muted text */

/* Feature text */
text-documents-600 dark:text-documents-400
text-hr-600 dark:text-hr-400
text-videos-600 dark:text-videos-400
```

### Border Colors
```css
/* Standard borders */
border-gray-200 dark:border-gray-700
border-white/20 dark:border-gray-700/20

/* Feature borders */
border-documents-200 dark:border-documents-800
border-hr-200 dark:border-hr-800
```

## Dashboard Color Management

The dashboard now uses a consistent color system:

### Card Colors
- **Background**: `bg-white/80 dark:bg-gray-800/80`
- **Border**: `border-white/20 dark:border-gray-700/20`
- **Text**: `text-gray-900 dark:text-white`

### Feature Icons
- **Documents**: Blue (`text-documents-600 dark:text-documents-400`)
- **HR**: Green (`text-hr-600 dark:text-hr-400`)
- **Videos**: Purple (`text-videos-600 dark:text-videos-400`)
- **Chat**: Orange (`text-chat-600 dark:text-chat-400`)
- **Prompts**: Indigo (`text-prompts-600 dark:text-prompts-400`)
- **Subscription**: Yellow (`text-subscription-600 dark:text-subscription-400`)

### Icon Backgrounds
- **Documents**: `bg-documents-50 dark:bg-documents-900/20`
- **HR**: `bg-hr-50 dark:bg-hr-900/20`
- **Videos**: `bg-videos-50 dark:bg-videos-900/20`

## Best Practices

### 1. Always Use Dark Mode Classes
```tsx
// ✅ Good
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ Avoid
<div className="bg-white text-gray-900">
```

### 2. Use Pre-built Component Classes
```tsx
// ✅ Good - uses pre-built classes
<div className="card-glass">
  <button className="btn-primary">Click me</button>
</div>

// ❌ Avoid - manual styling
<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">Click me</button>
</div>
```

### 3. Use Feature-Specific Colors
```tsx
// ✅ Good - consistent feature colors
<div className="card-documents">
  <FileText className="text-documents" />
</div>

// ❌ Avoid - random colors
<div className="bg-red-100">
  <FileText className="text-red-600" />
</div>
```

### 4. Test Both Themes
- Always test components in both light and dark modes
- Ensure sufficient contrast ratios (WCAG AA compliance)
- Verify hover and focus states work properly
- Test with different system preferences

### 5. Use Semantic Colors
```tsx
// ✅ Good - semantic meaning
<div className="alert-success">Operation completed successfully</div>
<div className="alert-error">An error occurred</div>

// ❌ Avoid - arbitrary colors
<div className="bg-green-100">Operation completed successfully</div>
<div className="bg-red-100">An error occurred</div>
```

## Accessibility Features

### Contrast Ratios
All color combinations meet WCAG AA standards:
- **Light Mode**: 4.5:1 minimum contrast ratio
- **Dark Mode**: 4.5:1 minimum contrast ratio
- **Focus States**: Enhanced visibility with ring indicators

### Focus Management
```css
/* Focus rings for accessibility */
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
```

### Screen Reader Support
- Proper color contrast for text
- Semantic HTML structure
- ARIA labels where needed

## Troubleshooting

### Theme Not Persisting
- Check if `localStorage` is available
- Verify ThemeProvider is wrapping your app
- Check browser developer tools for errors

### Dark Mode Classes Not Working
- Ensure `darkMode: 'class'` is set in Tailwind config
- Check if `dark` class is applied to document root
- Verify Tailwind CSS is properly compiled
- Restart development server after config changes

### Colors Not Displaying Correctly
- Check if custom colors are defined in Tailwind config
- Verify CSS classes are properly imported
- Ensure no conflicting styles are overriding colors

### System Mode Not Updating
- Check if `matchMedia` is supported
- Verify event listeners are properly attached
- Test with browser dev tools system preference toggle

## Advanced Usage

### Custom Color Schemes
Add custom colors to `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      brand: {
        50: '#f0f9ff',
        500: '#3b82f6',
        900: '#1e3a8a',
      }
    }
  }
}
```

### Conditional Rendering Based on Theme
```tsx
function ConditionalComponent() {
  const { actualTheme } = useTheme();
  
  return (
    <div>
      {actualTheme === 'dark' ? (
        <MoonIcon className="text-white" />
      ) : (
        <SunIcon className="text-gray-900" />
      )}
    </div>
  );
}
```

### Theme-Aware Images
```tsx
function ThemeAwareImage() {
  const { actualTheme } = useTheme();
  
  return (
    <img 
      src={actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
      alt="Logo"
      className="transition-opacity duration-200"
    />
  );
}
```

### Dynamic Color Generation
```tsx
import { colorPalette } from '../utils/colorManagement';

function DynamicColorComponent({ feature }) {
  const colors = colorPalette.features[feature];
  
  return (
    <div 
      style={{
        backgroundColor: colors.bg.light,
        color: colors.light,
      }}
      className="dark:bg-opacity-20"
    >
      Dynamic content
    </div>
  );
}
```

## Performance Considerations

### CSS Optimization
- Pre-built classes reduce CSS bundle size
- Dark mode classes are only loaded when needed
- Tailwind's purge process removes unused styles

### Theme Switching Performance
- Smooth 200ms transitions
- Minimal re-renders during theme changes
- Efficient localStorage operations

### Memory Management
- Theme state is properly cleaned up
- Event listeners are removed on unmount
- No memory leaks in theme management

This comprehensive color management system provides a solid foundation for consistent, accessible, and maintainable theming across your Multi-Tool AI application.
