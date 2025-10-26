# Pull Request

## Agent Log

**Agent ID**: A[0-10] _(specify which agent executed this work)_  
**Contributor**: @your-handle  
**Scope**: _(brief description of what changed)_  

**Logic Summary**:
- _(bullet points explaining the approach and rationale)_
- _(link to any design docs or RFCs if applicable)_

**Evidence**: _(link to evidence bundle artifact or test results)_  
**Reviewer**: _(suggested agent or team member for review)_

---

## Changes

### What changed?
_(describe the changes made)_

### Why?
_(explain the business or technical rationale)_

### How?
_(technical approach, key decisions)_

---

## Checklist

- [ ] Contracts updated (if data structures changed)
- [ ] Tests pass locally (`pnpm -r test:unit test:property test:mutation`)
- [ ] Quality gates met:
  - [ ] Mutation ≥ 0.80 (critical paths)
  - [ ] Coverage ≥ 95% (critical paths)
  - [ ] Determinism > 99.99%
  - [ ] Flake rate < 0.1%
  - [ ] **F_total ≤ 10⁻⁶**
- [ ] Evidence bundle generated (`pnpm -r evidence:bundle`)
- [ ] Documentation updated (if applicable)
- [ ] Blueprint updated (if architectural change)

---

## Evidence Bundle

_The CI will attach the evidence bundle as an artifact. Verify it includes:_
- Unit/integration/E2E + coverage HTML
- Mutation (Stryker) + property/fuzz logs
- Performance trends vs budgets
- Static/security scans
- **Contract diff + compatibility verdict**
- **Six-nines calculation (F_total)**
- SBOM + license report

---

## Screenshots (if UI changes)

_Add before/after screenshots or demo GIFs_

---

## Related Issues

Closes #_issue-number_  
Related to #_issue-number_
