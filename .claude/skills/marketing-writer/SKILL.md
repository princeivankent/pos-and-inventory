---
name: marketing-writer
description: Write marketing content for product features and launches using casual, direct language without corporate buzzwords. Use when Prince ships a feature or needs marketing content like landing page sections, tweet threads, or launch emails. Automatically understands product context from codebase or asks for clarification.
---

# Marketing Writer

Write marketing content that sounds like talking to a friend, not pitching to investors. Focus on real benefits, use simple language, and avoid all corporate buzzwords.

## Workflow

### 1. Understand the Product/Feature

**If codebase is available:**
- Read README, package.json, or main files to understand what the app does
- Identify core features and value proposition
- Note the tech stack and target audience

**If no codebase available:**
- Ask Prince: "What does this feature do?" and "Who is it for?"
- Get specifics: What problem does it solve? What's the main benefit?

### 2. Load Brand Voice & Templates

Always read both reference files before writing:
- `references/brand-voice.md` - Voice guidelines and what to avoid
- `references/templates.md` - Specific formats for each content type

### 3. Write the Content

Choose the appropriate template:
- **Landing page feature section**: Use Problem → Solution → Benefit format
- **Tweet thread**: Follow Hook → Credibility → Value → CTA structure
- **Launch email**: Use Personal → Specific Value → Easy CTA flow

**Writing rules:**
- Talk like explaining to a friend over coffee
- Use specific numbers and outcomes (e.g., "saves 2 hours" not "improves productivity")
- Ban all buzzwords: leverage, synergy, revolutionize, seamless, empower, etc.
- Keep sentences short and scannable
- Focus on what changes for the user, not what the feature is

### 4. Review Against Brand Voice

Before finalizing, check:
- [ ] Would I say this to a friend? (Rewrite if no)
- [ ] Zero buzzwords?
- [ ] Specific benefits with numbers?
- [ ] Simple words only?
- [ ] Sounds human, not corporate?

## Content Types

### Landing Page Feature Section
Format: Problem → Solution → Benefit

Read `references/templates.md` section "Landing Page Feature Section" for structure and example.

### Tweet Thread
Format: Hook → Credibility → Value → CTA (5-7 tweets)

Read `references/templates.md` section "Tweet Thread" for structure and example.

### Launch Email
Format: Personal → Specific Value → Easy CTA

Read `references/templates.md` section "Launch Email" for structure and example.

## Examples

**Good (Prince's voice):**
> "Scan items with your phone. Updates everywhere, instantly. No more manual counts at closing."

**Bad (corporate):**
> "Leverage mobile-first technology to seamlessly synchronize inventory data in real-time across your enterprise."

**Good:**
> "You know that annoying thing where you update stock on your phone, but it doesn't show up on your POS? Fixed."

**Bad:**
> "Our platform eliminates data fragmentation across touchpoints to optimize operational efficiency."

## Quick Reference

**Banned words:** leverage, synergy, revolutionize, disrupt, game-changing, cutting-edge, empower, unlock, seamless, robust, solutions

**Use instead:** saves, cuts, fixes, tracks, works, updates, shows, [specific verb]

**Focus on:** Time saved, stress gone, errors fixed, money saved, specific outcomes

**Not on:** Vague improvements, potential benefits, industry disruption
