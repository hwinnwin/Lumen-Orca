# Campaign Generator — E2E Testing Checklist

## Prerequisites

- [ ] Logged into SCC at `scc.hwinnwin.com`
- [ ] At least 120 credits available (check Settings or header)
- [ ] At least one platform connected (Connections page) — needed for publish tests
- [ ] Browser DevTools Console open (for error diagnosis)

---

## Test 1: Campaign Plan Generation

**Navigate to:** `/campaigns`

1. [ ] Page loads with "Configure" step active
2. [ ] Enter topic: _"AI automation for dental practices"_
3. [ ] Select platforms: **LinkedIn**, **Instagram**, **X**
4. [ ] Set tone: **professional**
5. [ ] Set post count: **20**
6. [ ] (Optional) Enter audience: _"dentists and practice managers"_
7. [ ] (Optional) Enter brand guidance: _"authoritative but approachable"_
8. [ ] Note credit cost shown (should be ~85 credits: 15 plan + 7 batches × 10)
9. [ ] Click **"Generate Campaign Plan"**
10. [ ] Verify loading state appears
11. [ ] Verify plan results show:
    - [ ] Campaign theme (catchy 3-5 word name)
    - [ ] Content pillars (3-4 pillars)
    - [ ] Platform mix distribution
    - [ ] 20 post outlines with title, angle, platform, content type

**Expected credit deduction:** 15 credits

---

## Test 2: Plan Review & Editing

On the "Review Plan" step:

1. [ ] Verify each outline card shows: title, angle, content type, platform, description
2. [ ] Delete 2 outlines — verify they disappear, count updates to 18
3. [ ] Edit 1 outline title — verify it saves inline
4. [ ] Verify post numbers remain stable after edits
5. [ ] Verify platform distribution makes sense:
    - Threads → mostly X
    - Carousels → LinkedIn / Instagram
    - Video hooks → TikTok (if selected)
    - Text posts → spread across platforms

---

## Test 3: Content Generation (Batch Processing)

Click **"Generate All Content"**:

1. [ ] Step transitions to "Edit Posts"
2. [ ] Progress bar appears showing batch progress (e.g., "2/6 batches")
3. [ ] Posts appear progressively as each batch completes (~15-30s per batch)
4. [ ] Verify 3-second delay visible between batches
5. [ ] All batches complete successfully (0 failed)
6. [ ] If any batch fails:
    - [ ] Toast notification shows with error code
    - [ ] "Retry Failed" button appears
    - [ ] Click retry — failed batches re-run without losing completed posts
7. [ ] Check DevTools Console for `[Campaign]` log entries — no errors

**Expected credit deduction:** ~60-70 credits (6-7 batches × 10)

---

## Test 4: Post Editing & Selection

On the "Edit Posts" step:

1. [ ] All generated posts visible with content preview
2. [ ] Each post shows:
    - [ ] Platform badge
    - [ ] Content type label
    - [ ] Angle label
    - [ ] Character count (e.g., "245/280" for X)
    - [ ] Hashtag pills
    - [ ] Tip text
3. [ ] Expand a post — verify full content visible
4. [ ] Edit content inline — verify changes save
5. [ ] Character count updates live as you edit
6. [ ] Character limit warning:
    - [ ] Yellow at 80% of platform limit
    - [ ] Red when over limit
7. [ ] Deselect 2 posts via checkbox — verify selection count updates
8. [ ] "Select All" / "Select None" buttons work
9. [ ] Click **"Continue to Schedule"**

---

## Test 5A: Schedule — Even Spacing

On the "Schedule" step:

1. [ ] Select **"Even Spacing"**
2. [ ] Set interval: **1x per day (24h)**
3. [ ] Set start date: **today, 9:00 AM**
4. [ ] Verify summary shows:
    - Number of selected posts
    - First post date
    - Last post date (should be ~18 days from start for 18 posts)
5. [ ] Click **"Send to Queue"**
6. [ ] Verify success step appears:
    - [ ] Shows "X posts sent to your queue"
    - [ ] Shows campaign theme
    - [ ] "View Queue" and "Start New Campaign" buttons visible
7. [ ] Click **"View Queue"** — navigates to `/queue`
8. [ ] On Queue page, click **"DRAFT"** filter
9. [ ] Verify campaign posts appear with:
    - [ ] Status: **Draft** (correct — scheduler will auto-publish at scheduled time)
    - [ ] Each post has a `scheduledAt` date
    - [ ] Dates are spaced 24 hours apart starting from your selected time
    - [ ] Tags include campaign theme
10. [ ] First post scheduled for today should auto-publish within 60 seconds of its time passing

---

## Test 5B: Schedule — Immediate

_(Run separately or with a new campaign)_

1. [ ] Select **"Immediate"** on Schedule step
2. [ ] Click **"Send to Queue"**
3. [ ] Navigate to Queue page
4. [ ] Posts should appear with status **"Queued"** → **"Publishing"** → **"Published"**
5. [ ] Verify publish results show per platform (green check or red X)

**Requires:** Active platform connections with valid tokens

---

## Test 5C: Schedule — Save as Drafts

1. [ ] Select **"Save as Drafts"** on Schedule step
2. [ ] Click **"Send to Queue"**
3. [ ] Navigate to Queue page → **"DRAFT"** filter
4. [ ] Posts appear as drafts with no `scheduledAt` date
5. [ ] Can manually publish individual posts via "Publish" button

---

## Test 6: Duplicate Protection

After a successful campaign:

1. [ ] Go back to `/campaigns`
2. [ ] **Do NOT** click "Start New Campaign"
3. [ ] Try to re-submit the same campaign (if possible via browser back)
4. [ ] Verify toast error: _"These posts have already been created"_
5. [ ] No duplicate posts in queue

---

## Test 7: Scheduler Worker (Auto-Publish)

For posts scheduled with "Even Spacing":

1. [ ] Create a campaign with even spacing, start time = **5 minutes from now**
2. [ ] Go to Queue page → filter by "DRAFT"
3. [ ] Verify first post shows with `scheduledAt` in ~5 minutes
4. [ ] Wait for the scheduled time to pass
5. [ ] Within 60 seconds of `scheduledAt`, post status should change:
    - **DRAFT** → **QUEUED** (scheduler picks it up)
    - **QUEUED** → **PUBLISHING** (publish worker processes it)
    - **PUBLISHING** → **PUBLISHED** or **FAILED**
6. [ ] Refresh Queue page to see status updates

**Requires:** Active platform connection for the post's target platform

---

## Test 8: Credit Validation

1. [ ] Note current credit balance
2. [ ] Run a full campaign (20 posts)
3. [ ] Verify total deduction matches estimate:
    - Plan: 15 credits
    - Batches: `ceil(20/3) × 10` = 70 credits
    - **Total: ~85 credits**
4. [ ] If insufficient credits:
    - [ ] Verify 402 error with message showing required vs. available
    - [ ] No partial deduction on failure

---

## Test 9: Mobile Responsiveness

Run tests on 375px viewport (Chrome DevTools device mode):

1. [ ] Configure step: inputs stack vertically, platform pills wrap
2. [ ] Review Plan: outline grid goes to 1 column
3. [ ] Edit Posts: post cards full-width, content readable
4. [ ] Schedule: controls stack vertically
5. [ ] Success: buttons wrap properly
6. [ ] Navigation: hamburger menu includes "campaigns" link

---

## Test 10: Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty topic | "Generate" button disabled or validation error |
| No platforms selected | Validation error before plan generation |
| Post count = 5 (minimum) | Works, 2 batches generated |
| Post count = 30 (maximum) | Works, 10 batches generated |
| Delete all outlines in Review | Cannot proceed to generate |
| Edit post to exceed char limit | Red warning shown, post still sendable |
| Network disconnect mid-generation | Failed batches tracked, retry available |
| Close browser mid-generation | State lost — must restart campaign |
| Navigate away mid-generation | State persists in Zustand store |
| Very long topic (1000+ chars) | Should still work (no frontend limit) |

---

## Test 11: Publishing Verification

For posts that reach PUBLISHED status:

1. [ ] Check the actual platform (e.g., LinkedIn) — post appears on profile
2. [ ] Content matches what was in the queue
3. [ ] Hashtags included correctly
4. [ ] Platform-specific formatting preserved (line breaks, etc.)
5. [ ] Check Queue page → post shows publish result with platform link

---

## Post Statuses Reference

| Status | Meaning | Next State |
|--------|---------|------------|
| **DRAFT** | Saved, not queued. If `scheduledAt` set, scheduler will auto-queue it | QUEUED (via scheduler or manual) |
| **QUEUED** | In publish queue, waiting for worker | PUBLISHING |
| **PUBLISHING** | Publish worker actively processing | PUBLISHED / PARTIAL_FAILURE / FAILED |
| **PUBLISHED** | Successfully posted to all platforms | Terminal |
| **PARTIAL_FAILURE** | Some platforms succeeded, others failed | Can retry failed platforms |
| **FAILED** | All platforms failed | Can retry or edit |

---

## Credit Costs Reference

| Action | Cost |
|--------|------|
| Campaign Plan | 15 credits |
| Campaign Batch (3 posts) | 10 credits |
| Full 20-post campaign | ~85 credits |
| Full 30-post campaign | ~115 credits |

---

## Known Behaviors (Not Bugs)

- Scheduled posts show as "Draft" in queue — this is correct. The scheduler worker auto-publishes them when `scheduledAt` time passes.
- Campaign state persists after queueing — only resets when you click "Start New Campaign."
- Batch generation takes 15-60 seconds per batch — this is normal AI processing time.
- The first batch has no delay; subsequent batches have a 3-second delay to avoid rate limits.
- If a batch times out at 50 seconds, it auto-retries once before marking as failed.
