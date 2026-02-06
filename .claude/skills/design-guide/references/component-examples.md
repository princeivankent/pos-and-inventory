# Component Examples

This reference provides detailed, copy-paste-ready examples of common UI components following the design guide principles.

## Navigation Bar

### Desktop Navigation
```html
<nav class="navbar">
  <div class="navbar-container">
    <a href="/" class="navbar-brand">YourBrand</a>
    <ul class="navbar-menu">
      <li><a href="/products">Products</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact" class="navbar-cta">Contact</a></li>
    </ul>
  </div>
</nav>
```

```css
.navbar {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  padding: 16px 0;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  gap: 32px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar-menu a {
  color: #6B7280;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.2s;
}

.navbar-menu a:hover {
  color: #111827;
}

.navbar-cta {
  padding: 8px 16px;
  background: #3B82F6;
  color: white !important;
  border-radius: 6px;
}

.navbar-cta:hover {
  background: #2563EB !important;
}

@media (max-width: 768px) {
  .navbar-menu {
    display: none; /* Implement hamburger menu */
  }
}
```

## Hero Section

```html
<section class="hero">
  <div class="hero-container">
    <div class="hero-content">
      <h1 class="hero-title">Build something amazing</h1>
      <p class="hero-description">
        Create modern, professional interfaces with our comprehensive design system.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary">Get Started</button>
        <button class="btn btn-secondary">Learn More</button>
      </div>
    </div>
  </div>
</section>
```

```css
.hero {
  padding: 96px 24px;
  background: #F9FAFB;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 24px;
}

.hero-description {
  font-size: 20px;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 768px) {
  .hero {
    padding: 64px 24px;
  }
  
  .hero-title {
    font-size: 32px;
  }
  
  .hero-description {
    font-size: 18px;
  }
  
  .hero-actions {
    flex-direction: column;
  }
}
```

## Card Grid

```html
<section class="card-grid">
  <div class="card">
    <div class="card-icon">🎨</div>
    <h3 class="card-title">Design System</h3>
    <p class="card-description">
      Consistent components following modern design principles.
    </p>
  </div>
  
  <div class="card">
    <div class="card-icon">⚡</div>
    <h3 class="card-title">Fast Performance</h3>
    <p class="card-description">
      Optimized for speed and efficiency across all devices.
    </p>
  </div>
  
  <div class="card">
    <div class="card-icon">📱</div>
    <h3 class="card-title">Mobile First</h3>
    <p class="card-description">
      Responsive design that works beautifully everywhere.
    </p>
  </div>
</section>
```

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 48px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  padding: 32px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.card-description {
  font-size: 16px;
  color: #6B7280;
  line-height: 1.6;
}
```

## Form Components

### Complete Form Example
```html
<form class="form">
  <div class="form-group">
    <label class="form-label" for="name">Full Name</label>
    <input 
      type="text" 
      id="name" 
      class="form-input" 
      placeholder="John Doe"
      required
    />
  </div>
  
  <div class="form-group">
    <label class="form-label" for="email">Email Address</label>
    <input 
      type="email" 
      id="email" 
      class="form-input" 
      placeholder="john@example.com"
      required
    />
    <span class="form-error" id="email-error"></span>
  </div>
  
  <div class="form-group">
    <label class="form-label" for="message">Message</label>
    <textarea 
      id="message" 
      class="form-textarea" 
      rows="5"
      placeholder="Tell us about your project..."
    ></textarea>
  </div>
  
  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" />
      <span>I agree to the terms and conditions</span>
    </label>
  </div>
  
  <button type="submit" class="btn btn-primary">Send Message</button>
</form>
```

```css
.form {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
}

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

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input {
  height: 44px;
}

.form-textarea {
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.form-input.error {
  border-color: #EF4444;
}

.form-error {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #EF4444;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-checkbox span {
  font-size: 14px;
  color: #6B7280;
}
```

## Button Variations

```css
/* Base button styles */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

/* Primary button - main action */
.btn-primary {
  background: #3B82F6;
  color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.btn-primary:hover {
  background: #2563EB;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn-primary:active {
  background: #1D4ED8;
  transform: translateY(1px);
}

/* Secondary button - alternative action */
.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.btn-secondary:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

/* Danger button - destructive action */
.btn-danger {
  background: #EF4444;
  color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.btn-danger:hover {
  background: #DC2626;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Ghost button - minimal emphasis */
.btn-ghost {
  background: transparent;
  color: #6B7280;
  padding: 8px 16px;
}

.btn-ghost:hover {
  background: #F3F4F6;
  color: #374151;
}

/* Disabled state for all buttons */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Size variations */
.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 18px;
}
```

## Modal/Dialog

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Confirm Action</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to proceed with this action? This cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-danger">Confirm</button>
    </div>
  </div>
</div>
```

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px rgba(0,0,0,0.15);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #F3F4F6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0;
  color: #6B7280;
  line-height: 1.6;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

## Data Table

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
        <td><span class="badge badge-success">Active</span></td>
        <td>
          <button class="btn-icon">✏️</button>
          <button class="btn-icon">🗑️</button>
        </td>
      </tr>
      <tr>
        <td>Jane Smith</td>
        <td>jane@example.com</td>
        <td>User</td>
        <td><span class="badge badge-warning">Pending</span></td>
        <td>
          <button class="btn-icon">✏️</button>
          <button class="btn-icon">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.table-container {
  overflow-x: auto;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.table thead {
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.table td {
  padding: 16px;
  font-size: 14px;
  color: #6B7280;
  border-top: 1px solid #E5E7EB;
}

.table tbody tr:hover {
  background: #F9FAFB;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background: #D1FAE5;
  color: #065F46;
}

.badge-warning {
  background: #FEF3C7;
  color: #92400E;
}

.badge-danger {
  background: #FEE2E2;
  color: #991B1B;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #F3F4F6;
}
```

## Alert/Notification

```html
<div class="alert alert-info">
  <span class="alert-icon">ℹ️</span>
  <div class="alert-content">
    <strong>Info:</strong> Your profile has been updated successfully.
  </div>
  <button class="alert-close">&times;</button>
</div>
```

```css
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-info {
  background: #DBEAFE;
  border: 1px solid #93C5FD;
  color: #1E40AF;
}

.alert-success {
  background: #D1FAE5;
  border: 1px solid #6EE7B7;
  color: #065F46;
}

.alert-warning {
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  color: #92400E;
}

.alert-danger {
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
  color: #991B1B;
}

.alert-icon {
  font-size: 20px;
}

.alert-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
}

.alert-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}
```

## Loading States

```css
/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 0%,
    #E5E7EB 50%,
    #F3F4F6 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: 16px;
}
```

## Usage Tips

1. **Copy these examples** as starting points for your components
2. **Adjust spacing** using the 8px grid system as needed
3. **Change the accent color** (#3B82F6) to match your brand
4. **Test responsive behavior** at different screen sizes
5. **Ensure accessibility** - proper labels, contrast ratios, focus states
