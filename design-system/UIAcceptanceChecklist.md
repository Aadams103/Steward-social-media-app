## Steward UI Acceptance Checklist

Use this checklist for each screen or major flow before marking it complete.

### Layout & structure

- [ ] Screen has a clear, descriptive title.
- [ ] Primary action is obvious and uses the primary button style.
- [ ] Secondary actions are visually de-emphasized.
- [ ] Content aligns to an appropriate max width for readability.

### Branding & copy

- [ ] No legacy brand names appear in UI copy.
- [ ] Headline/subhead match approved Steward messaging where applicable.
- [ ] Logo usage follows the Brand Kit (correct variant and contrast).

### States

- [ ] Empty state is present and uses helpful, Steward-specific language.
- [ ] Loading state (spinner/skeleton) is present and visually consistent.
- [ ] Error state provides a clear message and at least one recovery action.
- [ ] Disabled states are visually distinct and communicate why actions are disabled where appropriate.

### Navigation & back behavior

- [ ] Back button behaves according to the Navigation Spec:
  - Clears transient context (e.g. selected conversation, editing state) first.
  - Uses browser history where safe.
  - Falls back to a logical parent (usually the dashboard) when needed.
- [ ] Filters/sort/brand selection are preserved when navigating back.

### Accessibility & interaction

- [ ] All interactive elements are reachable via keyboard (Tab/Shift+Tab).
- [ ] Focus states are visible and meet contrast guidelines.
- [ ] Text and key UI elements meet at least AA contrast in both light and dark modes.
- [ ] Motion respects `prefers-reduced-motion` where animations are used.

### Guardrails

- [ ] `npm run check:branding` passes with no unexpected offenders.
- [ ] Lint/tests/build (`npm run check`, `npm run test`, `npm run build`) succeed.

