# Auto-Deploy Rule & Test Policy

## Tests: Headless Only — NEVER Open Browser Windows

**NEVER run `npm run smoke:headed` or any Playwright test in headed mode.** Always use `npm run smoke` (headless). Will's screen should never be interrupted by test browser windows popping up. This applies to all agents, all contexts, no exceptions.

---

After completing any of these milestones:
- A GSD slice (S01, S02, etc.)
- A batch of bug fixes (3+ fixes in one session)
- Any session that touches gameplay-affecting code

**Automatically do all of these before moving on:**

1. `npx tsc --noEmit` — must be clean
2. Squash-merge the slice branch to master (if on a slice branch)
3. `git push origin master`
4. Confirm Netlify auto-deploy triggered (push = deploy)
5. Update `.gsd/STATE.md` with current status

**Do NOT ask for permission** — this is pre-approved. The only exception is if tsc or smoke tests fail, in which case fix first, then merge+push.

Netlify auto-deploys master to `corsair-catch-demo.netlify.app`. itch.io requires manual `npm run deploy:itch` — only run that when explicitly asked.
