# POS SaaS Financial Projections & Breakeven Analysis

> All amounts in Philippine Peso (PHP). Exchange rate: $1 = PHP 57

---

## Pricing Tiers

| Tier | Monthly Price | Target Customer | Key Features |
|------|--------------|----------------|--------------|
| **Tindahan** | ₱799/mo | Single sari-sari stores | 1 store, 2 users, 500 products, Basic POS |
| **Negosyo** | ₱1,499/mo | Small groceries | 3 stores, 5 users, 2K products, + FIFO, Utang, Reports |
| **Kadena** | ₱2,999/mo | Retail chains | Unlimited, All features + API access |

**Trial**: 14 days free on all plans

---

## Monthly Infrastructure Costs

### Option A: Standard Stack

| Service | Plan | USD/mo | PHP/mo | Notes |
|---------|------|--------|--------|-------|
| Supabase | Pro | $25 | ₱1,425 | Database + Auth (8GB, 100K MAU) |
| Railway | Pro | $20 | ₱1,140 | NestJS backend hosting |
| Vercel | Pro | $20 | ₱1,140 | Angular frontend |
| Domain | .com.ph | $4 | ₱228 | Annual domain (~$46/yr) |
| SSL | Free | $0 | ₱0 | Via Vercel/Railway |
| **Total** | | **$69** | **₱3,933** | |

### Option B: Optimized Stack ⭐ RECOMMENDED

| Service | Plan | USD/mo | PHP/mo | Notes |
|---------|------|--------|--------|-------|
| Supabase | Pro | $25 | ₱1,425 | Database + Auth |
| Railway | Hobby | $5 | ₱285 | Enough for early-stage NestJS |
| Cloudflare Pages | Free | $0 | ₱0 | Angular SPA hosting (generous free tier) |
| Domain | .com.ph | $4 | ₱228 | |
| SSL | Free | $0 | ₱0 | Via Cloudflare |
| **Total** | | **$34** | **₱1,938** | Saves ₱1,995/mo vs Option A |

**Recommendation**: Start with Option B. Cloudflare Pages is free and perfect for Angular. Railway Hobby ($5) covers low-traffic NestJS apps. Upgrade to Option A only when you hit 30-50 active customers.

### Infrastructure Scaling Costs

| Customer Count | Supabase | Railway | Total/mo | Notes |
|---------------|----------|---------|----------|-------|
| 0-30 | $25 | $5 | ₱1,710 | Optimized stack |
| 30-50 | $25 | $20 | ₱2,565 | Railway Pro needed |
| 50-100 | $50 | $20 | ₱3,990 | Supabase compute upgrade |
| 100-200 | $75 | $30 | ₱5,985 | More DB resources |
| 200+ | Custom | Custom | ₱10,000+ | Enterprise tier |

---

## Variable Costs

### Payment Gateway Fees (PayMongo)

| Payment Method | Fee | Typical Usage |
|---------------|-----|---------------|
| GCash | 2.5% | 80% of customers (PH preference) |
| Credit/Debit Card | 3.5% + ₱15 | 20% of customers |
| **Blended Rate** | **~2.7%** | Weighted average |

### Other Variable Costs

- **Email (Transactional)**: Free tier (Resend/Supabase) — up to 10K emails/mo
- **Customer Support**: Start with email (free), hire part-time at ₱12,000/mo at 50 customers
- **Marketing**: Budget ₱10,000/mo starting at 100 customers

---

## Revenue Model

### Average Revenue Per User (ARPU)

Assuming realistic customer mix:
- 60% on Tindahan (₱799/mo)
- 30% on Negosyo (₱1,499/mo)
- 10% on Kadena (₱2,999/mo)

```
ARPU = (0.60 × ₱799) + (0.30 × ₱1,499) + (0.10 × ₱2,999)
     = ₱479 + ₱450 + ₱300
     = ₱1,229/customer/month
```

**After payment fees (2.7%):**
```
Net ARPU = ₱1,229 × 0.973 = ₱1,198/customer/month
```

---

## Breakeven Analysis

### Scenario A: Infrastructure Only (Survival Mode)

Using optimized stack at ₱1,938/mo:

```
Breakeven customers = ₱1,938 ÷ ₱1,198 net ARPU
                    = 1.62 → 2 customers
```

**You break even on infrastructure with just 2 paying customers.**

### Scenario B: Solo Founder (Modest Salary)

Assuming you need ₱35,000/mo for living expenses:

```
Total needed = ₱1,938 (infra) + ₱35,000 (salary)
             = ₱36,938/mo

Breakeven customers = ₱36,938 ÷ ₱1,198
                    = 30.8 → 31 customers
```

**You can go full-time with 31 paying customers.**

### Scenario C: With Part-Time Support

Adding customer support at ₱12,000/mo:

```
Total needed = ₱1,938 + ₱35,000 + ₱12,000
             = ₱48,938/mo

Breakeven customers = ₱48,938 ÷ ₱1,198
                    = 40.8 → 41 customers
```

---

## Monthly P&L Projections

### Stage 1: Launch (Month 1-3) — 7 Customers

**Revenue:**

| Tier | Count | Revenue |
|------|-------|---------|
| Tindahan | 4 | ₱3,196 |
| Negosyo | 2 | ₱2,998 |
| Kadena | 1 | ₱2,999 |
| **Total** | **7** | **₱9,193** |

**Expenses:**

| Item | Amount |
|------|--------|
| Supabase Pro | ₱1,425 |
| Railway Hobby | ₱285 |
| Cloudflare Pages | ₱0 |
| Domain | ₱228 |
| PayMongo fees (2.7%) | ₱248 |
| **Total** | **₱2,186** |

**Net Profit: ₱7,007/mo** (76% margin)

---

### Stage 2: Traction (Month 6) — 25 Customers

**Revenue:**

| Tier | Count | Revenue |
|------|-------|---------|
| Tindahan | 15 | ₱11,985 |
| Negosyo | 8 | ₱11,992 |
| Kadena | 2 | ₱5,998 |
| **Total** | **25** | **₱29,975** |

**Expenses:**

| Item | Amount |
|------|--------|
| Supabase Pro | ₱1,425 |
| Railway Pro (upgraded) | ₱1,140 |
| Cloudflare Pages | ₱0 |
| Domain | ₱228 |
| PayMongo fees (2.7%) | ₱809 |
| **Total** | **₱3,602** |

**Net Profit: ₱26,373/mo** (88% margin)

**Status**: Getting close to ₱35K full-time salary target.

---

### Stage 3: Growth (Month 12) — 50 Customers

**Revenue:**

| Tier | Count | Revenue |
|------|-------|---------|
| Tindahan | 30 | ₱23,970 |
| Negosyo | 15 | ₱22,485 |
| Kadena | 5 | ₱14,995 |
| **Total** | **50** | **₱61,450** |

**Expenses:**

| Item | Amount |
|------|--------|
| Supabase Pro + compute | ₱2,280 |
| Railway Pro | ₱1,140 |
| Cloudflare Pages | ₱0 |
| Domain | ₱228 |
| PayMongo fees (2.7%) | ₱1,659 |
| Part-time support | ₱12,000 |
| **Total** | **₱17,307** |

**Net Profit: ₱44,143/mo** (72% margin)

**Status**: Comfortable full-time income + support staff hired.

---

### Stage 4: Scale (Month 18-24) — 150 Customers

**Revenue:**

| Tier | Count | Revenue |
|------|-------|---------|
| Tindahan | 80 | ₱63,920 |
| Negosyo | 50 | ₱74,950 |
| Kadena | 20 | ₱59,980 |
| **Total** | **150** | **₱198,850** |

**Expenses:**

| Item | Amount |
|------|--------|
| Supabase Pro + compute | ₱4,560 |
| Railway Pro (scaled) | ₱2,850 |
| Cloudflare Pages | ₱0 |
| Domain | ₱228 |
| PayMongo fees (2.7%) | ₱5,369 |
| Full-time support | ₱20,000 |
| Part-time developer | ₱25,000 |
| Marketing budget | ₱10,000 |
| **Total** | **₱68,007** |

**Net Profit: ₱130,843/mo** (66% margin)

**Annual Run Rate: ₱2,386,200/year**

**Status**: Real business with team. Can hire full-time dev to scale faster.

---

## Churn Impact Analysis

Philippine SME SaaS typically sees 5-10% monthly churn. Here's how it affects growth:

| Monthly Churn | At 50 Customers | Impact |
|--------------|----------------|--------|
| 5% (good) | Lose ~2-3/mo | Need +3 new signups/mo to stay flat |
| 7% (average) | Lose ~3-4/mo | Need +4 new signups/mo to stay flat |
| 10% (bad) | Lose ~5/mo | Need +5 new signups/mo to stay flat |
| 15% (critical) | Lose ~7-8/mo | Unsustainable — fix product first |

### Growth Projection with 7% Churn

To grow from **50 to 150 customers in 12 months**:

```
Target growth: +100 customers over 12 months = +8.3/month net growth

With 7% churn at scale:
- Month 1 (50 customers): Lose 3.5, need 11.8 signups → Net +8.3
- Month 6 (92 customers): Lose 6.4, need 14.7 signups → Net +8.3
- Month 12 (150 customers): Lose 10.5, need 18.8 signups → Net +8.3

Total signups needed over 12 months: ~180 signups
Average: 15 new signups/month
```

**This is achievable** with consistent Facebook/TikTok marketing + referral program.

---

## Key Milestones & Required Customers

| Milestone | Customers | Monthly Revenue | Net Profit | What It Means |
|-----------|-----------|----------------|------------|---------------|
| **Infrastructure Paid** | 2 | ₱2,458 | ₱272 | System pays for itself |
| **Ramen Profitable** | 19 | ₱23,351 | ₱20,600 | Can afford to eat |
| **Full-Time Viable** | 31 | ₱38,099 | ₱35,000 | Quit day job |
| **With Support Staff** | 41 | ₱50,389 | ₱46,200 | Hire part-time support |
| **Small Team** | 80 | ₱98,320 | ₱79,800 | 2 staff + marketing |
| **Real Business** | 150 | ₱184,350 | ₱130,843 | Profitable scale |

---

## Customer Acquisition Economics

### Cost Per Acquisition (CPA) Targets

Assuming digital marketing spend:

| Channel | CPA Target | Reasoning |
|---------|-----------|-----------|
| Facebook Ads | ₱1,500-₱2,500 | Targeted to "sari-sari store owners" |
| TikTok Ads | ₱1,000-₱2,000 | Lower CPC, viral potential |
| Google Ads | ₱2,000-₱3,000 | Higher intent but competitive |
| Referrals | ₱500-₱1,000 | Incentivized (1 month free = ₱799-₱2,999) |
| Organic (FB groups) | ₱0-₱500 | Time investment only |

**Blended CPA Target: ₱2,000/customer**

### Lifetime Value (LTV) Calculation

```
Average subscription length = 10 months (assumed, need data)
LTV = ARPU × Avg months
    = ₱1,229 × 10
    = ₱12,290
```

### LTV:CAC Ratio

```
LTV:CAC = ₱12,290 ÷ ₱2,000
        = 6.1:1
```

**Target: > 3:1** ✅ **Status: Healthy** (6:1 is excellent for SaaS)

This means for every ₱2,000 spent acquiring a customer, you earn ₱12,290 over their lifetime.

---

## Financial Metrics to Track

| Metric | Formula | Target | Why It Matters |
|--------|---------|--------|----------------|
| **MRR** | Sum of monthly recurring revenue | Growing | North star metric |
| **ARR** | MRR × 12 | ₱1M+ in Year 2 | Investor appeal |
| **ARPU** | MRR ÷ Active customers | ₱1,229+ | Revenue per customer |
| **CAC** | Marketing spend ÷ New customers | < ₱2,500 | Acquisition efficiency |
| **LTV** | ARPU × Avg retention months | > ₱12,000 | Customer value |
| **LTV:CAC** | LTV ÷ CAC | > 3:1 | Unit economics health |
| **Monthly Churn** | Cancellations ÷ Active customers | < 7% | Retention health |
| **Gross Margin** | (Revenue - COGS) ÷ Revenue | > 70% | SaaS profitability |
| **Burn Rate** | Monthly expenses - Revenue | Negative (profitable) | Runway/sustainability |

---

## Profitability Timeline (Conservative Estimate)

| Month | Customers | MRR | Expenses | Profit | Cumulative Profit |
|-------|-----------|-----|----------|--------|-------------------|
| 1 | 3 | ₱3,687 | ₱2,186 | ₱1,501 | ₱1,501 |
| 2 | 5 | ₱6,145 | ₱2,186 | ₱3,959 | ₱5,460 |
| 3 | 7 | ₱9,193 | ₱2,186 | ₱7,007 | ₱12,467 |
| 6 | 25 | ₱29,975 | ₱3,602 | ₱26,373 | ₱91,659 |
| 12 | 50 | ₱61,450 | ₱17,307 | ₱44,143 | ₱350,325 |
| 18 | 100 | ₱122,900 | ₱42,000 | ₱80,900 | ₱835,725 |
| 24 | 150 | ₱184,350 | ₱68,007 | ₱116,343 | ₱1,533,783 |

**Key Insights:**
- Profitable from Month 1 (even at 3 customers)
- Full-time viable at Month 6 (31 customers)
- First ₱1M cumulative profit by Month 20
- By Year 2, generating ₱116K/mo profit

---

## Investment Requirements

### Bootstrapped (Recommended for Philippine Market)

**Total Cash Needed: ₱50,000-₱100,000**

| Use | Amount | Notes |
|-----|--------|-------|
| Initial infrastructure (3 months) | ₱6,000 | Before first customers |
| PayMongo test account | ₱0 | Free sandbox |
| Marketing (first 3 months) | ₱30,000 | FB ads, TikTok content |
| Domain + legal (business registration) | ₱10,000 | DTI, domain |
| Buffer | ₱20,000 | Unexpected costs |

**Recommendation**: Bootstrap. Low infrastructure costs + high margins mean you can self-fund growth with profits.

### External Funding (Optional)

If seeking investment:

| Stage | Amount | Use | Dilution |
|-------|--------|-----|----------|
| **Pre-seed** | ₱500K-₱1M | Marketing, team | 10-15% |
| **Seed** | ₱3M-₱5M | Sales team, expansion | 15-20% |

**Only take funding if:**
- Want to scale faster (aggressive marketing)
- Need to hire developers before profitability
- Want to expand to Indonesia/SEA markets

Otherwise, high margins support organic growth.

---

## Risk Factors & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **High churn** | Revenue volatility | Improve onboarding, customer support, product quality |
| **Payment failures** | Lost MRR | Retry logic, support GCash (preferred in PH) |
| **Infrastructure costs spike** | Margin pressure | Monitor usage, optimize queries, cache aggressively |
| **Competitive undercutting** | Price pressure | Focus on Philippine-specific features (utang, BIR) |
| **Slow customer acquisition** | Extended runway | Invest in content marketing, referral program |
| **Feature bloat requests** | Dev distraction | Stay focused on core value, charge for extras |
| **Seasonality (sari-sari stores)** | Revenue dips | Diversify to year-round businesses (groceries) |

---

## Success Benchmarks (By Month 12)

| Metric | Target | Stretch Goal |
|--------|--------|-------------|
| Active Customers | 50 | 80 |
| MRR | ₱61,450 | ₱98,320 |
| Monthly Profit | ₱44,143 | ₱79,800 |
| Monthly Churn | < 7% | < 5% |
| Trial-to-Paid Conversion | 15% | 25% |
| CAC | < ₱2,500 | < ₱2,000 |
| LTV | ₱12,290 | ₱15,000 |

---

## Next Actions

### Week 1: Validate Assumptions
- [ ] Talk to 5 sari-sari/grocery store owners
- [ ] Ask: Would they pay ₱799/mo for POS system?
- [ ] Ask: Do they track utang? How?
- [ ] Ask: What's their biggest inventory problem?

### Week 2-4: Build Subscription System
- [ ] Follow SUBSCRIPTION_IMPLEMENTATION_PLAN.md
- [ ] Integrate PayMongo (test mode first)
- [ ] Test GCash payment end-to-end

### Week 5-6: Beta Testing
- [ ] Recruit 5 beta stores (offer free 3 months)
- [ ] Get feedback on pricing
- [ ] Validate utang + FIFO value

### Week 7-8: Launch
- [ ] Build landing page
- [ ] Create demo video (Taglish)
- [ ] Launch in Facebook groups
- [ ] Target: 10 paying customers in Month 1

### Month 2-6: Grow to 31 Customers
- [ ] Run Facebook ads (₱5K/mo budget)
- [ ] Post TikTok demos weekly
- [ ] Launch referral program (1 month free)
- [ ] Target: Full-time viable by Month 6

---

## Summary: The Bottom Line

**With just 31 paying customers, this becomes a full-time business replacing a ₱35K salary.**

**Key advantages:**
- Low infrastructure costs (₱1,938/mo optimized)
- High margins (65-75%)
- Philippine market fit (utang, BIR, GCash)
- Recurring revenue model
- Proven multi-tenant architecture

**The challenge isn't the math — it's:**
1. Building the frontend (Angular)
2. Acquiring the first 31 customers
3. Keeping churn below 7%

**Focus on:**
- Ship the Angular app ASAP (blocking sales)
- Perfect the onboarding experience (reduce churn)
- Market in Filipino to sari-sari/grocery owners (Facebook, TikTok)
- Leverage word-of-mouth (referral program)

The unit economics are strong. The product is differentiated. The market is massive (hundreds of thousands of Philippine retail stores). Execution is everything.

**Go build. 🚀**
