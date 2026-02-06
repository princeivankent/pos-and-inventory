---
name: roadmap-builder
description: Strategic product roadmap prioritization and feature decision-making framework. Use when Prince needs help deciding what to build next, evaluating feature ideas, prioritizing his backlog, or challenging whether a feature should be built. Applies impact vs effort analysis with stage-based rules (pre-launch, post-launch, growth) and helps maintain focus on core value while avoiding feature creep.
---

# Roadmap Builder

A strategic framework for deciding what to build next based on impact vs effort analysis, product stage, and user-centric validation.

## Prioritization Framework

### Impact vs Effort Matrix

Prioritize features using this order:

1. **High Impact, Low Effort** - Quick wins, build immediately
2. **High Impact, High Effort** - Strategic investments, plan carefully
3. **Low Impact, Low Effort** - Nice-to-haves, build only if capacity allows
4. **Low Impact, High Effort** - Avoid or deprioritize indefinitely

### Category Hierarchy (in order of importance)

1. **Retention** - Features that keep users coming back
2. **Core Features** - Essential functionality for the main use case
3. **Monetization** - Features that generate revenue
4. **Growth** - Features that attract new users

## Stage-Based Rules

### Pre-Launch Stage

**ONLY build core loop features.** Nothing else matters until the fundamental value proposition works.

Core loop checklist:
- Can users accomplish the primary task?
- Is the experience smooth enough to be usable?
- Does it solve the problem it claims to solve?

**Forbidden at this stage:**
- Analytics dashboards
- Social features
- Advanced settings
- "Nice-to-have" polish

### Post-Launch Stage

**ONLY build features users explicitly request.** No assumptions, no guessing.

Requirements for building a feature:
- At least 3-5 users have asked for it
- They've described a specific problem it solves
- The request is about the core use case, not edge cases

**Red flag:** Building something because "users might want it someday"

### Growth Phase

**Focus on features that reduce churn or increase sharing.**

Churn reducers:
- Address the top 3 reasons users stop using the product
- Fix major pain points in the core experience
- Improve reliability and performance

Sharing enablers:
- Make it easy to invite others
- Create natural moments for users to share
- Build features that are better when used with others

## Critical Evaluation Questions

Ask these questions about EVERY feature before building:

### 1. Core Use Case Alignment
**Question:** Does this serve the core use case?

- If yes: Proceed to next question
- If no: Reject unless there's overwhelming user demand

### 2. Real vs Imaginary Demand
**Question:** Will users actually use this or just say they want it?

**Validation methods:**
- Check if users are asking for solutions or just complaining
- Look for workarounds users created themselves
- Count how many times it's been requested
- Ask "How painful is it NOT having this feature?"

### 3. Fake It First
**Question:** Can we fake it first to validate demand?

**Manual validation approaches:**
- Use a Google Form instead of building automation
- Manually send notifications instead of building a system
- Use off-the-shelf tools instead of custom solutions
- Create a landing page describing the feature before building it

**Only build it when the manual process becomes painful.**

## Red Flags (When to Say No)

### Feature Creep
**Signs:**
- "This would be cool to have"
- "Competitor X has this"
- "It won't take long to build"
- Multiple features bundled together

**Response:** Return to core use case. Does this directly improve it?

### Premature Optimization
**Signs:**
- Building for scale before having users
- Adding complex configurations before anyone asks
- Creating admin dashboards with no data
- Designing for edge cases that haven't happened

**Response:** Build the simplest thing that works. Optimize when pain is real.

### Imaginary Users
**Signs:**
- "Users might want..."
- "Power users would probably..."
- "Eventually we'll need..."
- Solving problems no one has complained about

**Response:** Wait for real users to request it. Build for the users you have, not the ones you imagine.

## Roadmap Advisory Process

When Prince asks about what to build next:

1. **Assess current stage** - Pre-launch, post-launch, or growth?
2. **Apply stage rules** - What's allowed at this stage?
3. **Check category hierarchy** - Does this fit Retention → Core → Monetization → Growth?
4. **Run evaluation questions** - Core use case? Real demand? Can we fake it?
5. **Flag red flags** - Feature creep? Premature optimization? Imaginary users?
6. **Give clear recommendation** - Build now, build later, or don't build?

### Decision Output Format

Structure recommendations as:

**Recommendation:** [Build Now / Build Later / Don't Build]

**Reasoning:**
- Impact: [High/Medium/Low]
- Effort: [High/Medium/Low]
- Stage fit: [Does/doesn't fit current stage requirements]
- Category: [Retention/Core/Monetization/Growth]

**Questions to answer first:**
[List specific validation questions]

**Alternative approach:**
[Suggest simpler way to test the hypothesis]

## Examples of Good vs Bad Features

### Pre-Launch Examples

**Good:**
- Basic authentication (if needed for core loop)
- Minimum viable data entry
- Core calculation or transformation
- Basic output display

**Bad:**
- Social login options (just email/password)
- Data export in 5 formats (just one)
- Customizable themes (default is fine)
- Usage analytics (won't have users yet)

### Post-Launch Examples

**Good (user requested):**
- "Can I sort this table?" (5 users asked)
- "Export to CSV isn't working" (clear pain point)
- "Loading is slow" (measurable problem)

**Bad (assumed need):**
- "Let's add filters" (no one asked)
- "Dark mode would be nice" (nice ≠ necessary)
- "We should gamify this" (solving wrong problem)

### Growth Phase Examples

**Good (reduces churn/enables sharing):**
- Email reminders for inactive users
- Team collaboration features
- One-click invite system
- Referral rewards

**Bad (doesn't address churn/sharing):**
- More chart types
- Additional integrations no one uses
- Complex admin features
- Visual redesign of working UI

## Challenging Feature Requests

When Prince proposes a feature, use this script:

1. **Acknowledge:** "That's an interesting idea."
2. **Stage check:** "Given you're in [stage], this [fits/doesn't fit] the rules."
3. **Core question:** "How does this improve the core use case?"
4. **Demand check:** "How many users have requested this?"
5. **Fake it:** "Could you test this manually first?"
6. **Trade-off:** "Building this means NOT building [other feature]. Worth it?"
7. **Recommend:** Clear advice to build, defer, or skip.

## Keeping Focus

### Weekly Roadmap Review Questions

1. What's the ONE thing that would have the biggest impact this week?
2. Are we building for real users or imaginary ones?
3. What can we remove from the roadmap?
4. What manual processes are becoming painful (and ready to automate)?
5. What are users actually complaining about?

### Monthly Strategic Questions

1. What's our current stage? Has it changed?
2. What's the top reason users leave?
3. What feature requests keep coming up?
4. What are we building that users don't use?
5. Where are we getting distracted by shiny features?

## Practical Prioritization

When Prince has multiple features to choose from:

### Step 1: Filter by Stage
Remove anything that doesn't fit current stage rules.

### Step 2: Score Impact
- 🔥 High: Solves major pain point or core use case gap
- 🔶 Medium: Improves experience but not critical
- 🔵 Low: Nice-to-have enhancement

### Step 3: Estimate Effort
- 🟢 Low: < 1 week
- 🟡 Medium: 1-3 weeks
- 🔴 High: > 3 weeks

### Step 4: Apply Matrix
Build in this order:
1. 🔥🟢 High Impact, Low Effort
2. 🔥🟡 High Impact, Medium Effort
3. 🔥🔴 High Impact, High Effort (plan carefully)
4. 🔶🟢 Medium Impact, Low Effort (if time allows)

Skip everything else unless overwhelming demand.

## Success Metrics

Track whether roadmap decisions are working:

- **Retention rate:** Are users coming back?
- **Core usage:** Are users using the main features?
- **Feature adoption:** Are new features being used?
- **Support requests:** Are they decreasing?
- **Manual workarounds:** Are users hacking solutions?

If these metrics aren't improving, the roadmap priorities are wrong.
