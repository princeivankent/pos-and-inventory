---
name: launch-planner
description: Transform app ideas into shippable MVPs using lean product methodology. Use when Prince wants to validate ideas, scope MVPs, generate PRDs, create Claude Code starter prompts, make product decisions during builds, or needs help staying focused on shipping. Built around Angular, Firebase/NodeJS/NestJS, and Vercel/Firebase deployment with ship-fast philosophy.
---

# Launch Planner

Transform app ideas into shippable MVPs with a bias toward speed, user validation, and zero feature creep.

## Product Philosophy

**Ship Fast, Validate with Real Users**
- MVPs should be shippable within 1 week maximum
- Real users > perfect features
- Validated learning > feature completeness
- Speed to market > architectural perfection

**No Feature Creep**
- Only features that directly serve the core user loop
- If it doesn't validate the core hypothesis, cut it
- Post-MVP features go to the backlog, not the build

## Tech Stack

**Default Stack for MVPs:**
- **Frontend**: Angular
- **Backend/Database**: Firebase (preferred for speed) or NodeJS/NestJS (for custom APIs)
- **Deployment**: Vercel (frontend) or Firebase Hosting (full-stack)
- **Styling**: Angular Material or Tailwind CSS

This stack is optimized for speed, minimal configuration, and proven scalability.

## Pre-Build Validation Questions

Before writing any code, answer these three critical questions:

1. **Who is this for?**
   - Specific user persona, not "everyone"
   - What's their current painful alternative?
   - How will you reach them?

2. **What's the ONE problem it solves?**
   - Can be explained in one sentence
   - Must be a real pain point, not a "nice to have"
   - User would pay/engage to solve this

3. **How will I know if it works?**
   - Define one key metric
   - What number proves people want this?
   - How will you measure it?

## MVP Scoping Rules

**Include ONLY if:**
- Directly serves the core user loop
- Users cannot complete the primary action without it
- Validates the core hypothesis
- Can be built in < 1 week total

**Always Exclude (Add Post-Validation):**
- Advanced authentication (start with magic links or basic email/password)
- Admin dashboards (use Supabase directly)
- Complex user settings
- Email notifications (unless core to the product)
- Profile customization
- Social features (sharing, following, etc.)
- Analytics dashboards (use simple logging first)
- Payment processing (unless monetization IS the validation)

**The 1-Week Rule:**
If you can't ship it in a week of focused work, the scope is too large. Cut features, not quality.

## Common Mistakes to Avoid

1. **Building features nobody asked for**
   - You are not the user (usually)
   - Talk to 3-5 potential users before building
   - Build what they need, not what you think is cool

2. **Over-engineering**
   - No microservices for MVPs
   - No custom authentication systems
   - No premature optimization
   - Supabase RLS > custom authorization layer

3. **Adding auth before validating the idea**
   - Many MVPs don't need user accounts initially
   - Consider: public landing page → manual data collection → validation → then auth
   - Exception: If the product IS about personal data management

4. **Perfectionism**
   - Ugly working > pretty broken
   - Ship with bugs that don't break core functionality
   - Iterate based on real feedback

5. **Building in a vacuum**
   - Share progress weekly (even if it's embarrassing)
   - Get it in front of users ASAP
   - Launch = learning, not perfection

## Workflow: Idea to Shipped MVP

### Phase 1: Validate the Idea (Day 1)
1. Answer the three pre-build questions
2. Sketch the core user loop (3-5 steps max)
3. Define the ONE metric that proves success
4. Talk to 3 potential users (or skip if you're solving your own problem)

### Phase 2: Scope the MVP (Day 1-2)
1. List all features you think you need
2. Cut everything that isn't the core loop
3. Generate a PRD (see references/prd-template.md)
4. Sanity check: Can this be built in 1 week?

### Phase 3: Build (Day 2-6)
1. Use Claude Code with the starter prompt (see references/claude-code-prompts.md)
2. Build feature-by-feature (not layer-by-layer)
3. Test each feature with real user flow
4. Keep a "Post-MVP Ideas" doc for feature creep

### Phase 4: Launch (Day 7)
1. Deploy to Vercel (should take 10 minutes)
2. Set up basic analytics (Vercel Analytics or simple logging)
3. Share with 5-10 users
4. Watch the ONE metric

### Phase 5: Learn & Iterate
1. Talk to users who tried it
2. Measure the ONE metric
3. Decide: pivot, persevere, or kill
4. If persevere: prioritize next feature based on user feedback

## Using This Skill

### Generate a PRD from an Idea
**Prompt:** "I want to build [idea]. Help me scope an MVP."

**Output:** Structured PRD using references/prd-template.md with:
- Validated core problem
- Defined target user
- Minimal feature set
- Success metric
- 1-week build plan

### Create Claude Code Starter Prompts
**Prompt:** "Generate a Claude Code prompt to start building [project]"

**Output:** Comprehensive starter prompt following references/claude-code-prompts.md with:
- Tech stack setup
- Project structure
- First feature to implement
- Supabase schema
- Deployment config

### Product Decision During Build
**Prompt:** "Should I add [feature] to my MVP?"

**Process:**
1. Check: Does it serve the core user loop?
2. Check: Can users complete the primary action without it?
3. Check: Does it validate the hypothesis?
4. If No to any → Backlog it
5. If Yes to all → Estimate time. If < 1 day → Maybe. If > 1 day → Backlog it.

### Stay Focused on Shipping
**Prompt:** "I'm getting distracted by [feature]. Keep me focused."

**Output:**
- Reminder of the ONE problem being solved
- Reminder of the ONE metric being tracked
- Reality check: Is this feature creep?
- Redirect: What's the next smallest shippable piece?

## Reference Files

- **references/prd-template.md**: Template for structured MVP PRDs
- **references/claude-code-prompts.md**: Starter prompts for common MVP patterns with Angular + Firebase
- **references/launch-checklist.md**: Pre-launch verification checklist
- **references/angular-firebase-starter.md**: Quick reference for Angular + Firebase setup, auth, Firestore ops, security rules
