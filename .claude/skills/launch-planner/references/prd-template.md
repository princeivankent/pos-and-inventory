# MVP PRD Template

Use this template to scope MVPs rigorously. Fill out each section with specific, measurable details.

## Product Overview

**Product Name:** [Working title]

**One-Line Description:** [Can you explain it in one sentence?]

**Problem Statement:** [What specific pain point does this solve? Be brutal about whether this is a real problem or a "nice to have"]

## Target User

**Primary User Persona:**
- Who are they? [Specific demographic/role, not "everyone"]
- Current painful alternative? [What do they do today that sucks?]
- How will you reach them? [Specific channel: subreddit, Facebook group, email list, etc.]

**User Needs:**
1. [Primary need]
2. [Secondary need - only if truly core]

## Core User Loop

**The ONE metric:** [What number proves people want this?]

**User Journey (3-5 steps max):**
1. User arrives via [channel]
2. User sees [what]
3. User does [action]
4. User gets [value]
5. [Optional: User returns because...]

## MVP Feature Set

**Must Have (Core Loop):**
- [ ] Feature 1: [Brief description - why is this essential?]
- [ ] Feature 2: [Brief description - why is this essential?]
- [ ] Feature 3: [Brief description - why is this essential?]

**Explicitly Out of Scope (Backlog for Post-MVP):**
- ~~Feature X~~ - Can validate without this
- ~~Feature Y~~ - Nice to have, not essential
- ~~Feature Z~~ - Adds complexity, minimal value

## Technical Implementation

**Tech Stack:**
- Frontend: Angular
- Backend: Firebase or NodeJS/NestJS
- Deployment: Vercel or Firebase Hosting
- Styling: Angular Material or Tailwind CSS

**Database Schema (Simplified):**
```
Collection: [collection_name] (Firestore)
{
  id: string (auto-generated)
  [essential_field_1]: type
  [essential_field_2]: type
  createdAt: timestamp
  updatedAt: timestamp
}
```

**API Endpoints (if using NodeJS/NestJS):**
- `GET /api/[resource]` - [purpose]
- `POST /api/[resource]` - [purpose]

## Success Criteria

**Launch Goal:** Get [specific number] users to [complete core action] within [timeframe]

**Validation Metrics:**
- Primary: [The ONE metric - e.g., 10 users complete signup → action → return within 1 week]
- Secondary: [Supporting metric - e.g., <30% drop-off rate in core loop]

**Decision Framework:**
- If metric hit → Invest in feature 2.0
- If metric missed but engagement high → Pivot feature set
- If metric missed and no engagement → Kill and move on

## Launch Plan

**Timeline:** [Day 1-7 breakdown]
- Day 1: Validate idea, scope MVP
- Day 2-3: [First set of features]
- Day 4-5: [Second set of features]
- Day 6: Testing and polish
- Day 7: Deploy and share with initial users

**Initial Distribution:**
- Channel 1: [Specific subreddit/group/list]
- Channel 2: [Personal network]
- Target: 10-20 initial users

## Risks & Assumptions

**Assumptions:**
- [ ] Users actually have this problem
- [ ] They're willing to try a new solution
- [ ] [Your specific assumption about user behavior]

**Risks:**
- Technical: [What could break?]
- Market: [What if users don't care?]
- Mitigation: [How to reduce risk? Talk to users early]

## Post-MVP Roadmap (If Validated)

**Next Features (Priority Order):**
1. [Feature based on user feedback]
2. [Feature based on user feedback]
3. [Feature based on user feedback]

**Don't Build Until Validated:**
- Everything above stays in the backlog until MVP metrics are hit
