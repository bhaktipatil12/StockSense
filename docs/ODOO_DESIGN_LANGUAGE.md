# Odoo Hackathon — Product Design Language

Version 1.0 · 25 September 2026

## Purpose and authority

Use this file as the design brief for the hackathon product. Read it before designing screens or generating frontend code. The aim is a distinctive, coherent application with a complete working user journey and professional interaction details.

This is a custom design direction, not an official Odoo design system or judging rubric. No visual style guarantees a win. Odoo's published event expectations include responsive and clean UI, consistent colors and layout, intuitive navigation, input validation, dynamic data, and proper Git participation [1]. The restrictions below come from our product brief.

## 1. Non-negotiable rules

- Gray, blue, purple, and cream are banned as authored UI colors. This includes slate, zinc, stone, navy, indigo, lavender, beige, ivory, and near-white gray backgrounds. Do not sneak them into borders, placeholders, charts, shadows, selected states, skeletons, or default component themes.
- White and pure black are permitted. Green, yellow, and red have the explicit roles defined below.
- Use real shadcn/ui primitives where appropriate. Preserve their keyboard behavior, semantics, focus management, and accessible names. Customize tokens and product components instead of pasting an unchanged starter dashboard.
- Every visible action must work or clearly explain why it is unavailable. Every metric must come from actual application data and have an understandable meaning.
- The product's main task determines its home screen. An analytics dashboard is appropriate only when analysis is the main task.
- Avoid AI-generated logos and icons, sparkle decorations, gradient headlines, glass panels, glowing borders, floating blobs, emoji navigation, and stock “innovation” illustrations.
- Avoid repeating the same card for every kind of information. Use tables, lists, forms, timelines, and contextual panels according to the data and task.
- No standalone marketing CTA section, generic hero, oversized conversion banner, or repeated “Get started” block inside the application. A relevant primary action belongs next to its task, such as “Create request” beside the request list. On a genuine public landing page, use one restrained entry action in the page context rather than a decorative CTA band.
- No gradients: not on page backgrounds, buttons, text, charts, or images added for decoration. No heavy, high-elevation, colored, or diffuse shadows. Default to no shadow; if a floating layer cannot be distinguished by its border and scrim, use at most a crisp, very subtle forest-green shadow.
- No icons inside decorative square or rounded boxes. Render a useful icon directly alongside text or in a control with a real action. No boxed-icon feature grids.
- Fewer boxes. Start with typography, alignment, whitespace, and one clear divider. Add a bordered container only when it groups data or forms one interaction surface. Do not nest cards within cards or wrap every sentence in a panel.
- Accessibility, readable density, and understandable states take priority over decorative novelty.
- Do not invent judge preferences, testimonials, customers, impact figures, performance claims, or official Odoo affiliation.

## 2. Product decisions before pixels

Complete this short brief after reading the actual problem statement:

| Decision | Required answer |
| --- | --- |
| Primary user | A specific role, not “everyone” |
| Main job | One sentence beginning with a verb |
| Core record | Booking, request, item, lesson, application, etc. |
| Completion | The observable state that means the user's job succeeded |
| Hardest decision | What the user needs to compare, understand, or choose |
| Critical failure | Double booking, lost changes, unauthorized access, unavailable stock, etc. |
| Signature interaction | One useful interaction that makes this particular product memorable |
| Required features | Trace each explicit problem requirement to a screen and behavior |

Example: “A coordinator assigns an incoming assistance request to an available provider and tracks it to completion.” This suggests a request queue, assignment controls, status history, and a detail view. It does not automatically suggest four KPI cards and a chart.

## 3. Visual direction: precise, bright, task-focused

Use a white canvas, strong black typography, forest-green actions, and small yellow highlights. Let hierarchy, composition, meaningful content, and responsive behavior give the product character.

Default to light mode for the eight-hour build. Do not add dark mode unless all required flows and states are already complete. Do not expose a theme switch with an unfinished theme.

### Color tokens

| Token | Hex | Role |
| --- | --- | --- |
| Canvas / surface | `#FFFFFF` | Pages, cards, dialogs, inputs |
| Ink | `#000000` | Titles, body text, labels, main separators |
| Forest | `#14532D` | Primary actions, links, focus rings, selected navigation |
| Leaf wash | `#DCFCE7` | Selected rows, quiet sections, loading placeholders |
| Mid green | `#166534` | Secondary text, placeholders, functional input boundaries |
| Signal yellow | `#FACC15` | Attention or pending status; use black text |
| Error red | `#B91C1C` | Destructive actions and error text |

Color discipline:

1. Most of the visible page remains white. Use forest green for the action hierarchy and selection; yellow is a small supporting signal.
2. Use black on white for body text. Green secondary text must still be readable; do not lower its opacity.
3. Use white labels on forest or error-red filled buttons. Use black text on leaf wash and yellow.
4. Green-filled primary buttons mean “main action,” not automatically “success.” Success messages also need a check icon and explicit text.
5. Pair every status color with text and, where useful, an icon. “Pending” cannot be only a yellow dot.
6. No translucent black shadows, dimming layers, or disabled opacity that produce gray. Use spacing and borders for separation. A modal may use a translucent forest-green scrim; this is a green-only compositing exception. Never use opacity on the entire dialog.
7. Native browser rendering and antialiasing are outside the authored palette. Audit CSS colors and intentional visual assets, not individual antialiased pixels.
8. User-uploaded evidence may retain its natural colors. Decorative stock photos, maps, and charts must be chosen or styled to respect the palette; retain geographic legibility if a map is essential.

### shadcn token starting point

Use these as semantic values with the installed project's token mapping. Keep the project's existing CSS imports and Tailwind integration; this block is not a complete stylesheet. shadcn supports CSS-variable theming [2]. Do not replace an established build setup merely to copy this example.

```css
:root {
  color-scheme: light;
  --background: #ffffff;
  --foreground: #000000;
  --card: #ffffff;
  --card-foreground: #000000;
  --popover: #ffffff;
  --popover-foreground: #000000;
  --primary: #14532d;
  --primary-foreground: #ffffff;
  --secondary: #dcfce7;
  --secondary-foreground: #14532d;
  --muted: #dcfce7;
  --muted-foreground: #166534;
  --accent: #dcfce7;
  --accent-foreground: #14532d;
  --destructive: #b91c1c;
  --destructive-foreground: #ffffff;
  --border: #166534;
  --input: #166534;
  --ring: #14532d;
  --sidebar: #ffffff;
  --sidebar-foreground: #000000;
  --sidebar-primary: #14532d;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #dcfce7;
  --sidebar-accent-foreground: #14532d;
  --sidebar-border: #166534;
  --sidebar-ring: #14532d;
  --success: #14532d;
  --success-surface: #dcfce7;
  --warning: #facc15;
  --warning-foreground: #000000;
  --radius: 0.5rem;
}
```

Inspect the actual generated components: a token definition does not remove hardcoded utility colors, default shadows, default `opacity-50`, or external chart colors. Override these at the shared component/variant level. Add chart colors only when a chart has a real purpose: use forest, black, and yellow with direct labels and patterns. Do not imply status meanings for unrelated series.

## 4. Typography, spacing, and geometry

- Use one UI font: locally bundled **Geist Sans** if available, otherwise `system-ui, sans-serif`. The interface must remain usable without a font CDN.
- Use weights 400, 500, and 600. Strong hierarchy comes from size, placement, and spacing; avoid bolding every label.
- Body: 16px with roughly 1.5 line height. Dense table content and secondary labels: 14px. Reserve 12px for genuinely minor metadata, never primary instructions.
- Page title: 28–32px desktop, 24–28px mobile. Section heading: 18–20px. Avoid giant marketing headings in a working application.
- Use tabular numerals for quantities, money, dates in aligned columns, and operational metrics.
- Sentence case for labels and headings. Avoid all-caps paragraphs and excessive letter spacing.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48px. Use 24–32px between sections and 8px between a label and control.
- Default control height: 44px. Dense desktop table controls may be smaller if still comfortably usable; preserve generous touch targets on mobile.
- Radius: 8px controls, 12px major panels and dialogs. Fully rounded shapes are reserved for avatars and genuine chips.
- Use a border only when it establishes a meaningful region or control boundary. Prefer whitespace to nested boxes. No decorative drop shadows.

### Composition and restraint

Use one spatial rhythm throughout a screen: a clear heading and action row, content aligned to the same grid, and a useful density chosen for the task. A list can be a set of rows separated by lines without an outer card. A form can live directly in the page column. A timeline can use a single rail and short entries. Reserve a panel for an independently meaningful object, such as a selected request, a booking summary, or a focused editor.

Give distinctive treatment to the *information* rather than its wrapper. For an operations product, emphasize current state and next action. For a marketplace, emphasize the item, availability, and comparison. For a document tool, protect the reading area. Use a purposeful accent such as a short forest-green rule, a selected-row surface, or large but concise task typography once per view; do not repeat a gimmick on every card.

Buttons have clear hierarchy: one filled primary action per task area, quiet text or outlined secondary actions, and destructive actions isolated where accidental activation is unlikely. Avoid a row of equally loud buttons. A persistent bottom CTA bar is justified only when a multi-step form needs an always-visible completion action.

## 5. shadcn component policy

Use the official component source as a foundation [3]. Keep one compatible primitive family already used by the project. Do not mix examples from different releases or primitive APIs without checking the installed implementation.

| Need | Component direction | Product adaptation |
| --- | --- | --- |
| Main action | Button | Verb + object: “Assign provider,” “Reserve slot,” “Save listing” |
| Data entry | Field/Label, Input, Textarea, Select | Persistent labels, relevant units, inline errors, helpful defaults |
| Large searchable choice | Combobox | Search by a useful domain field; show distinguishing details |
| Several related views | Tabs | Use only when views share the same context and entity |
| Structured record collection | Table / Data Table | Useful column order, sorting where needed, honest pagination |
| Secondary row actions | Dropdown Menu | Keep the most frequent action visible |
| Short blocking decision | Dialog / Alert Dialog | Specific title, clear consequence, safe cancellation |
| Quick record inspection | Sheet | Short summary and actions; deep workflows get their own page |
| Mobile navigation | Sheet | Named navigation items, clear close behavior |
| Status | Badge | Text + optional icon; distinguish selected state from status |
| Loading | Skeleton / Spinner | Match final content geometry; green wash, no shimmer |
| Feedback | Inline Alert, supported toast primitive | Persist errors near the relevant task; toasts are supplementary |
| Empty collection | Empty state composition | Explain the reason and provide a relevant next step |
| Charts | Chart only when necessary | Label values/units; offer an accessible table or textual summary |

Create reusable domain components such as `RequestRow`, `AvailabilitySlot`, `StockStatus`, or `AssignmentPanel`. Customize information order, density, and actions to the product. Do not create several visually inconsistent versions of the same Button or Input.

Install only components the actual screens need. Small, understood dependencies are fine. Keep domain decisions and business rules visible in your own application code. Accessibility primitives are worth reusing; package count alone is not a measure of quality.

## 6. Layout must match the product

Choose a composition after identifying the user's main task:

| Product | Main workspace | Distinctive useful interaction |
| --- | --- | --- |
| Operations / service requests | Queue with filters, selected record detail, action area | Status history and safe assignment without losing queue position |
| Booking / scheduling | Date navigation, availability, reservation summary | Explain why a slot is unavailable; recover from a booking conflict |
| Inventory / marketplace | Search and filters, task-appropriate grid or table, item detail | Visible stock and clear quantity controls; preserve filters on return |
| Education / skill exchange | Searchable skills or lessons, profile/detail, progress | Show prerequisites or compatibility before committing |
| Approvals / applications | Inbox, application detail, decision controls | A visible decision reason and audit history |
| Document tool | Document list and a focused editor workspace | Clear save state, readable structure, recoverable edits |

These are composition examples, not forecasts of the hackathon statement.

Shared rules:

- Use a sidebar only when there are enough distinct destinations to justify it. A small app can use a top bar.
- Main navigation labels describe destinations. Do not use vague labels such as “Platform” or “Intelligence.”
- Put the page title and primary action together. One dominant action per task area is the default.
- For detailed forms, use a readable width around 640–760px; broad operational lists can use more of the viewport.
- On narrow screens, stack content in task order. Convert tables to labeled records when relationships remain clear; retain a scrollable semantic table when comparison requires columns.
- At 360px width, controls and error messages must fit. At desktop width, do not stretch short paragraphs across the whole screen.
- Preserve search terms, filters, scroll position, and entered values where practical.
- Ensure navigation, browser Back, dialogs, and deep links have predictable behavior.

## 7. Icon and visual asset rules

Use a single icon family: **Lucide** [4]. Default sizes: 16px inside compact controls, 20px for navigation and primary controls, 24px only when context needs it. Use a consistent stroke weight and optical alignment.

- Add icons when they help scanning or comprehension. Not every heading needs an icon.
- Pair unfamiliar icons with visible labels. Icon-only controls need an accessible name and a visible tooltip on hover/focus.
- Mark decorative icons as hidden from assistive technology. Do not let an SVG create an extra focus stop.
- Keep icon meaning consistent: the same icon must represent the same action throughout the app.
- Use a text wordmark with the product name. Create a custom mark only when it communicates something about the product and does not consume implementation time.
- No AI sparkles as a brand shortcut, robot mascots for unrelated products, or emoji as operational controls.
- Real user content is preferable to decorative imagery. Never add imagery merely to fill space.

## 8. States, microcopy, and accessibility

### Microinteractions: make state changes legible

Motion has a job: show that an action registered, where content went, and what changed. The interface should feel responsive through timing and clear feedback, not continuous movement. Define these behaviors in shared primitives and apply them only where they make sense.

| Event | Behavior | Suggested timing |
| --- | --- | --- |
| Button hover | Shift forest tone or underline a text action; do not lift the whole card | 100–150ms |
| Button press | Immediate pressed state, then release; prevent a second submission while pending | Immediate to 100ms |
| Keyboard focus | Visible outline appears without animation delay | Immediate |
| Tab or segmented choice | Content and selection change together; keep layout stable | 120–180ms |
| Accordion or inline details | Expand in place without jumping surrounding content | 150–220ms |
| Save or submit | Disable only the submitting control, retain entered data, show a short progress label, then a specific confirmation | Immediate feedback; confirmation on result |
| New/updated list item | Place the item where sorting dictates and briefly highlight the changed row | 250–400ms highlight fade |
| Validation error | Show a message beneath the relevant field; focus the first invalid field after submit | Immediate; no shaking |
| Dialog or sheet | Fade the scrim and move the surface a few pixels; focus the heading or first useful control | 150–220ms |
| Search/filter | Preserve the input focus and announce result count when it changes; do not animate every row | Debounce only if needed |

These timings are starting points, not a requirement to animate everything. Prefer `opacity` and small `transform` changes; avoid layout thrash, spring overshoot, bouncing controls, parallax, autoplay carousels, shimmer skeletons, and motion that delays a user's action. Do not move a row while the user is trying to select it. Reserve animated transitions for actual state changes; no motion on initial page load merely to make the page feel busy.

For `prefers-reduced-motion: reduce`, remove nonessential transitions and scrolling animation while keeping immediate visible state changes. Keep loading indicators still or minimal. Do not rely on animation alone to convey success, failure, or selection.

Feedback must fit the event: a local change gets local confirmation; a consequential completed task may also get a short status message. A toast must not be the only record of an error or the only way to see the new state. Keep messages visible long enough to read and avoid stacking repeated notices.

Suggested implementation guardrail, adapted to the installed project's CSS system:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

If a library already handles reduced motion, use its supported approach rather than duplicating this rule.

Every core view must support: loading, empty, populated, invalid input, server failure, success, and permission restrictions where relevant.

Examples of useful writing:

| Situation | Use |
| --- | --- |
| Empty queue | “No requests match these filters.” + “Clear filters” |
| Missing field | “Enter a pickup address.” |
| Conflict | “This slot was just booked. Choose another available time.” |
| Save failure | “We couldn’t save your changes. Your entries are still here.” + “Try again” |
| Success | “Request assigned to Asha.” |
| Disabled action | “Add at least one item to continue.” |

Do not show generic “Something went wrong” when the app knows the cause. Do not expose stack traces or implementation details to the user. Prevent duplicate submissions and show progress while an action is pending. Announce meaningful updates accessibly without reading every small UI change.

Accessibility acceptance targets, based on WCAG guidance [5][6]:

- Normal text contrast at least 4.5:1; large text at least 3:1 under WCAG's size definition.
- Essential control boundaries, indicators, and meaningful graphics need at least 3:1 against adjacent colors where applicable.
- Every field has a programmatically associated label. Errors identify the field and how to fix it.
- Keyboard focus is visible and unobscured. Use a forest outline with a white offset so it remains visible across surfaces.
- Dialogs manage focus correctly, have meaningful titles, and restore focus when closed.
- All core tasks work by keyboard. Do not require hover or dragging as the only way to act.
- Aim for 44px interactive targets. This is our usability target, not a claim that every WCAG AA target must be 44px.
- Respect reduced-motion preferences. Use brief state transitions only when useful; no perpetual pulse, shimmer, or decorative entrance animation.
- Check zoom, wrapping, and narrow layouts. Do not use color as the sole carrier of meaning.

Contrast ratios must be checked for actual foreground/background pairs, including hover, focus, selected, and error states. A token list alone is not proof of accessibility.

## 9. Make the product stand out through behavior

Choose one signature feature directly tied to the statement after required functionality works. Examples: an assignment explanation, a booking conflict recovery flow, a well-structured status timeline, an inventory shortage indicator, or an unusually clear comparison view.

The signature feature should help someone decide or act. It must use real data and appear naturally in the main demo. Avoid adding a chatbot, map, chart, or animation merely because it seems impressive.

Use realistic, explicitly seeded demo records with believable variation: long names, different statuses, missing optional values, and boundary cases. Never present seeded records as actual adoption or real-world results. Verify that newly created records persist and appear after refresh.

## 10. Eight-hour execution guide

Adjust this working plan to the portal's official milestone deadlines. It does not replace the mandatory repository submission before 10:00 AM or any video-submission deadline.

1. First 30 minutes: read all requirements, choose the statement, identify the user journey, sketch three to five essential screens, decide domain entities and states.
2. Early build: establish tokens and shared primitives, then complete one path from UI to database and back. Submit the repository on time.
3. Middle build: complete the required features and permission/data rules; integrate work continuously with meaningful individual commits.
4. Final 90 minutes: stop adding optional features. Fix the main flow, states, mobile layout, accessibility, data realism, and confusing copy.
5. Final 30 minutes: rehearse the demo, verify a clean startup, confirm the latest code is on the required branch, and prepare the functional video according to organizer instructions.

Do not turn optional visual polish into a blocker for required behavior. A beautiful screen with no working flow is unfinished.

## 11. Final review: all must pass

### Product and behavior

- [ ] Every explicit statement requirement maps to implemented behavior or an honestly documented limitation.
- [ ] The main task is obvious on the first screen.
- [ ] A complete journey works using persisted data and survives refresh.
- [ ] The key error/conflict case recovers without losing user work.
- [ ] Role restrictions are enforced by the server, not only hidden buttons.
- [ ] No dead controls, fabricated metrics, or misleading completion states.

### Visual design

- [ ] No authored gray, blue, purple, cream, default gray shadows, or opacity-based gray disabled states.
- [ ] shadcn tokens, portal-rendered menus/dialogs, chart colors, and component variants are audited.
- [ ] One font system, one icon family, consistent spacing and control sizes.
- [ ] Layout and component choices reflect this product's actual job.
- [ ] No gratuitous card grid, decorative AI art, gradient hero, or irrelevant dashboard.
- [ ] No generic CTA section, high shadow, decorative boxed icon, or unnecessary nested cards.
- [ ] One restrained, useful motion pattern covers press, focus, submission, and the principal content update; reduced motion works.
- [ ] Long names, large values, empty states, and validation messages do not break the layout.

### Interaction and demo

- [ ] Keyboard navigation, visible focus, labels, contrast, and narrow screens checked.
- [ ] Loading, success, error, and disabled states are understandable.
- [ ] Contrast checked for real component states, not just the default page.
- [ ] The demo shows a user creating/changing data and the resulting outcome.
- [ ] Setup instructions, seed data, and necessary environment variables are documented without secrets.
- [ ] No claim that this design guarantees selection or an award.

## 12. Instructions for an implementation assistant

Treat this document as a binding visual brief. Before coding, summarize the primary user, required journey, chosen screen composition, and one signature interaction. Then inspect the existing framework and component versions. Reuse compatible shadcn/ui primitives and apply the semantic tokens consistently. Preserve accessible behavior while modifying presentation. Build complete domain components with realistic content and all relevant states. Verify the banned colors across shared components and overlays. Report functional and visual checks actually performed, along with known limitations. Do not substitute a generic dashboard for the chosen product workflow.

## Research and references

Accessed 25 September 2026. Official event expectations are distinct from this file's custom creative direction. The palette, dimensions, layout choices, execution plan, and signature-feature recommendations are our design decisions.

1. [Odoo x GCET Hyderabad Hackathon 2026 — event expectations](https://hackathon.odoo.com/event/odoo-x-gcet-hyderabad-hackathon-2026-30/register). Source for the organizer's published UI, dynamic-data, validation, navigation, and Git expectations.
2. [shadcn/ui — Theming](https://ui.shadcn.com/docs/theming). Source for semantic CSS-variable theming.
3. [shadcn/ui — Introduction](https://ui.shadcn.com/docs) and [Components](https://ui.shadcn.com/docs/components). Source for component ownership and available building blocks; consult documentation matching the installed version.
4. [Lucide](https://lucide.dev/). A consistent icon source, selected for this brief; not an Odoo requirement.
5. [W3C — Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum). Source for text contrast criteria.
6. [W3C WAI — Visual Design curriculum](https://www.w3.org/WAI/curricula/designer-modules/visual-design/). Guidance on text and meaningful interface contrast.
7. [GOV.UK Design System — Patterns](https://design-system.service.gov.uk/patterns/). Reference for task-oriented flows and clear interaction patterns. Borrow the reasoning, not government branding or its color palette.
