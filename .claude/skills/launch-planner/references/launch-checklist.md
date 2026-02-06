# Pre-Launch Checklist

Run through this before sharing your MVP with users. Skip the perfectionism—this is about catching critical issues, not polish.

## Critical (Must Fix Before Launch)

### Functionality
- [ ] Core user loop works end-to-end
- [ ] No errors in browser console that break functionality
- [ ] Forms submit and save data correctly
- [ ] Data persists after page refresh
- [ ] No broken links in core flow

### Mobile
- [ ] Core flow works on mobile (test on real device, not just browser)
- [ ] Buttons are tappable (not too small)
- [ ] Text is readable (not too small)
- [ ] No horizontal scrolling

### Authentication (if applicable)
- [ ] Users can sign up
- [ ] Users can log in
- [ ] Users can log out
- [ ] Protected pages actually require auth
- [ ] No sensitive data exposed in client-side code

### Database
- [ ] Supabase RLS policies are enabled
- [ ] Users can only access their own data
- [ ] No public access to tables (unless intended)

### Performance
- [ ] Page loads in < 3 seconds on 4G
- [ ] No infinite loops or memory leaks in core flow
- [ ] Images are reasonably optimized (not 10MB files)

## Important (Should Fix But Won't Break MVP)

### UX
- [ ] Error messages are helpful (not "Error: undefined")
- [ ] Loading states exist (even if just "Loading...")
- [ ] Success feedback after actions ("Saved!", "Deleted!")
- [ ] Forms have basic validation
- [ ] Destructive actions have confirmation ("Are you sure?")

### Content
- [ ] No Lorem ipsum in user-facing text
- [ ] Spelling/grammar is mostly correct
- [ ] Product name is consistent everywhere
- [ ] Contact info or support email exists somewhere

### SEO/Metadata
- [ ] Page title is set (not "Create Next App")
- [ ] Favicon exists (not the default Next.js icon)
- [ ] Meta description is set (for link previews)

### Deployment
- [ ] Environment variables are set in Vercel
- [ ] Custom domain is connected (if you have one)
- [ ] HTTPS is working
- [ ] Vercel preview URLs work

## Nice to Have (Ship Without These)

### Polish
- [ ] Consistent spacing and alignment
- [ ] Color scheme is cohesive
- [ ] Icons are consistent style
- [ ] Animations/transitions
- [ ] Empty states have helpful text

### Features
- [ ] Email confirmations
- [ ] Password reset flow
- [ ] Profile settings
- [ ] Dark mode
- [ ] Advanced search/filtering

### Analytics
- [ ] Vercel Analytics installed
- [ ] Custom event tracking
- [ ] Error monitoring (Sentry, etc.)

### Performance
- [ ] Code splitting
- [ ] Image lazy loading
- [ ] Lighthouse score > 90

## Launch Day Checklist

**Morning of launch:**
1. [ ] Test the entire core flow one more time
2. [ ] Check mobile on real device
3. [ ] Clear browser cache and test as a new user
4. [ ] Test auth flow (sign up, log in, log out)
5. [ ] Check Supabase dashboard - any errors?

**Share with first users:**
1. [ ] Post to [specific channel/group]
2. [ ] Send to [email list/friends]
3. [ ] Watch for first sign-ups in real-time
4. [ ] Be online to fix critical bugs immediately

**First 24 hours:**
1. [ ] Monitor Supabase for errors
2. [ ] Check Vercel analytics for usage patterns
3. [ ] Read user feedback (even if it hurts)
4. [ ] Fix critical bugs within hours, not days
5. [ ] Document feature requests for post-MVP

## Post-Launch (Week 1)

**Track the ONE metric:**
- [ ] Count how many users completed the core action
- [ ] Calculate conversion rate (signups → action)
- [ ] Note where users are dropping off

**User feedback:**
- [ ] Talk to 5 users (even if you have 100)
- [ ] Ask: "What confused you?" not "Do you like it?"
- [ ] Ask: "Would you pay for this?" (if monetization is planned)

**Decide next steps:**
- [ ] Did you hit your success metric?
- [ ] What's the #1 feature users asked for?
- [ ] Is this worth continuing? (Be honest)

## Common Launch Mistakes

**Don't do these:**
- ❌ Waiting for "just one more feature" before launching
- ❌ Launching without testing on mobile
- ❌ Launching without a way to contact you
- ❌ Launching without defining success metrics
- ❌ Launching and disappearing (be available for feedback)
- ❌ Launching to "everyone" instead of specific users
- ❌ Launching without a plan to measure usage

**Do these instead:**
- ✅ Ship the MVP even if you're embarrassed
- ✅ Test on multiple devices
- ✅ Put your email/Twitter somewhere visible
- ✅ Track the ONE metric that matters
- ✅ Stay online for first few hours after launch
- ✅ Share with specific communities that need this
- ✅ Set up basic analytics before sharing

## Emergency Contact

**If something breaks:**
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Check browser console for errors
4. Roll back to last working deployment if critical
5. Post status update to users ("We're fixing this")

**If nothing breaks but no one uses it:**
1. Did you actually share it? (Don't just "launch and hope")
2. Did you share with the RIGHT people? (Your target users)
3. Is the value prop clear in 5 seconds?
4. Is the signup friction too high?
5. Is there a critical bug you missed?

Remember: The goal is learning, not perfection. Ship it and iterate based on real feedback.
