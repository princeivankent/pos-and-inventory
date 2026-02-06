# Claude Code Starter Prompts

These prompts help you kickstart MVPs with Claude Code. Customize based on your specific project.

## Standard Angular + Firebase MVP

```
I'm building [product name], a [one-line description].

TECH STACK:
- Angular (latest version)
- Firebase (Auth, Firestore, Storage)
- Angular Material or Tailwind CSS
- TypeScript
- Deploy on Firebase Hosting

PROJECT SETUP:
1. Initialize Angular project with routing
2. Set up Firebase configuration and AngularFire
3. Create environment files with Firebase config placeholders

CORE FEATURES TO BUILD (MVP ONLY):
1. [Feature 1 - describe the user-facing functionality]
2. [Feature 2 - describe the user-facing functionality]
3. [Feature 3 - describe the user-facing functionality]

DATABASE SCHEMA (Firestore):
[Paste your simplified collections/documents structure here]

USER FLOW:
1. User lands on [page]
2. User [primary action]
3. User sees [result]

FIRST TASK: Set up the project structure and implement [Feature 1].

CONSTRAINTS:
- Ship-quality code, but optimize for speed
- Use Firebase Security Rules for authorization
- Start with basic email/password auth (no OAuth yet)
- Mobile responsive but desktop-first
- No admin dashboard (use Firebase Console directly)

Please create the initial project structure and start with [Feature 1].
```

## Angular + NestJS API MVP

```
I'm building [product name], a [one-line description].

TECH STACK:
- Frontend: Angular
- Backend: NestJS
- Database: Firebase Firestore or PostgreSQL
- TypeScript
- Deploy frontend on Vercel, backend on Firebase Functions or separate hosting

GOAL: Full-stack app with custom API layer.

PROJECT STRUCTURE:
- /frontend (Angular app)
- /backend (NestJS API)

CORE FEATURES:
1. [Feature 1 - describe the user-facing functionality]
2. [Feature 2 - describe the user-facing functionality]
3. [Feature 3 - describe the user-facing functionality]

API ENDPOINTS NEEDED:
1. POST /api/[resource] - [purpose]
2. GET /api/[resource] - [purpose]
3. PUT /api/[resource]/[id] - [purpose]

DATABASE SCHEMA:
[Paste schema here]

USER FLOW:
1. User interacts with Angular UI
2. Angular calls NestJS API
3. API processes and returns data
4. UI updates

FIRST TASK: Set up both projects and create the first API endpoint with Angular service to consume it.

CONSTRAINTS:
- Use NestJS modules for organization
- Create Angular services for API communication
- Implement proper error handling
- Use environment variables for API URLs

Start with project setup and first feature implementation.
```

## Landing Page + Waitlist MVP

```
I'm validating interest in [product idea] before building it.

TECH STACK:
- Angular
- Firebase Firestore (for email collection)
- Angular Material or Tailwind CSS
- Firebase Hosting deployment

GOAL: Simple landing page with email capture to gauge interest.

PAGES NEEDED:
1. Landing page component with:
   - Hero section explaining the ONE problem solved
   - Benefits (3 max)
   - Email capture form
   - Social proof placeholder

DATABASE SCHEMA (Firestore):
Collection: waitlist
{
  id: auto-generated
  email: string
  createdAt: timestamp
  referralSource: string (optional)
}

FEATURES:
1. Email form with validation
2. Store emails in Firestore
3. Thank you message after signup
4. Basic analytics (how many signups?)

CONSTRAINTS:
- Single page component only
- No authentication needed
- No email sending (just collect)
- Mobile responsive

Please create this landing page and set up email collection.
```

## CRUD App (Dashboard/Admin Tool)

```
I'm building [internal tool name] to [solve specific problem].

TECH STACK:
- Angular
- Firebase Firestore (Database only, no auth initially)
- Angular Material
- TypeScript

PURPOSE: Internal tool for [specific use case].

FEATURES:
1. List view of [resource]
2. Create new [resource]
3. Edit [resource]
4. Delete [resource]
5. Simple search/filter

DATABASE SCHEMA (Firestore):
Collection: [resource_name]
{
  id: auto-generated
  [field_1]: type
  [field_2]: type
  createdAt: timestamp
  updatedAt: timestamp
}

USER FLOW:
1. User sees list of all [resources]
2. User clicks "Create" and fills form
3. New [resource] appears in list
4. User can edit/delete from list

FIRST TASK: Set up the project and create the list component with mock data.

CONSTRAINTS:
- No authentication for MVP (internal use only)
- Use Angular Material Table component
- Reactive forms for create/edit
- Simple form validation

Start with the project setup and list view component.
```

## API-First MVP (NestJS)

```
I'm building [product name], which [one-line description].

TECH STACK:
- NestJS
- Firebase Firestore or PostgreSQL
- TypeScript
- Deploy on Firebase Functions or Vercel

PURPOSE: API-first MVP that [core functionality].

API ENDPOINTS NEEDED:
1. POST /api/[resource] - [purpose]
2. GET /api/[resource] - [purpose]
3. PUT /api/[resource]/[id] - [purpose]
4. DELETE /api/[resource]/[id] - [purpose]

DATABASE SCHEMA:
[Paste schema here]

FEATURES:
1. CRUD operations for [resource]
2. Basic validation (class-validator)
3. Error handling
4. Rate limiting (simple)

TESTING APPROACH:
- Use Postman/Thunder Client for manual testing
- Build simple Angular test page for UI testing

CONSTRAINTS:
- API-first, minimal UI for now
- Focus on solid error handling
- Return proper HTTP status codes
- JSON responses only
- Use NestJS DTOs for validation

Start with project setup and first POST endpoint.
```

## SaaS MVP with Stripe

```
I'm building [SaaS product], a [one-line description] with paid tiers.

TECH STACK:
- Angular
- Firebase (Auth + Firestore)
- Stripe (Payments)
- Angular Material or Tailwind CSS
- TypeScript
- Firebase Hosting or Vercel

MONETIZATION:
- Free tier: [limited features]
- Pro tier: $[X]/month

FEATURES (MVP):
1. User authentication (email/password)
2. [Core feature accessible to all]
3. [Premium feature for Pro users only]
4. Stripe Checkout integration
5. Basic subscription management

DATABASE SCHEMA (Firestore):
Collection: users
{
  id: uid (from Firebase Auth)
  email: string
  subscriptionTier: 'free' | 'pro'
  stripeCustomerId: string
  subscriptionStatus: string
  createdAt: timestamp
}

Collection: [your_core_resource]
{
  id: auto-generated
  userId: string
  [fields...]
  createdAt: timestamp
}

PAYMENT FLOW:
1. User signs up (free tier)
2. User hits premium feature
3. Redirect to Stripe Checkout
4. Webhook updates subscriptionTier
5. User accesses premium feature

FIRST TASK: Set up project with auth and free tier functionality.

CONSTRAINTS:
- Start with Stripe test mode
- Use Stripe Checkout (not Stripe Elements)
- Handle webhooks for subscription status via Firebase Functions
- No complex billing logic yet (keep it simple)

Begin with auth setup and core feature implementation.
```

## Customization Guide

When creating prompts for Claude Code:

1. **Start with the problem, not the solution**
   - "I'm building X to solve Y" > "I need a Next.js app with..."

2. **Be specific about scope**
   - List exactly what features are in MVP
   - Explicitly call out what's NOT included

3. **Provide user flow, not technical specs**
   - "User does X, sees Y" > "Create a function that..."

4. **Include your database schema**
   - Claude Code works better with concrete data models
   - Keep it simple - only essential fields

5. **Set constraints**
   - Time limits, technical preferences, what to avoid
   - "No auth yet", "Mobile-responsive but desktop-first"

6. **Request iterative building**
   - "Start with Feature 1" > "Build all features at once"
   - Give Claude Code space to build incrementally

7. **Focus on ship-quality, not perfect**
   - "Ship-quality code, optimize for speed"
   - "Ugly working > pretty broken"
