# Scheduled Briefings

A V1 prototype of the Scheduled Briefings module for Handraise — recurring
intelligence products that surface and organise the coverage a communications
team actually needs to act on.

```bash
npm install
npm run dev     # http://localhost:3000
```

## The product model

Four ideas, held consistently across every screen:

| | |
|---|---|
| **Template** | A reusable structure. Fixes which sections exist, what each contains, and the order. Authored by the Handraise editorial team; customers cannot change it. |
| **Briefing** | A configured instance of a template. Owns the name, the instructions, the lookback period, the schedule and the recipients. |
| **Edition** | The generated intelligence product from one run of a briefing. Editable content — text, articles, emphasis. |
| **Herald** | The intelligence layer. Creates templates, explains briefings, and rewrites and reshapes editions in place. |

The distinction that matters: **customers configure briefings and edit generated
editions, but never redesign the template.** Editing an edition changes that
edition; it does not change the structure every future edition will use.

## Screens

| Route | Screen |
|---|---|
| `/briefings` | **B1** Briefings home — table, search, status filters, row actions, delete confirmation |
| `/briefings/new` | **B2** Choose template — full-screen creation step |
| `/briefings/new/[templateId]` | **B3** Configure — instructions, schedule, recipients, live preview |
| `/briefings/[id]` | **B4** Briefing review — **the hero screen** |
| `/templates` | **T1** Templates home — cards, search, duplicate |
| `/templates/[id]` | **T2** Template detail — structure, preview, create-briefing CTA |
| `/templates/new` | **T3** New template — Herald-authored structure |

### B4 — Briefing review

The screen the feature exists for. Herald sits permanently to the left with the
edition in context; the generated briefing occupies the right.

- **Selection editing.** Highlight any generated text to raise a popover:
  quick passes (shorten, more neutral, add context, plainer language), a
  free-text instruction to Herald, or direct editing. The rewrite is spliced
  back into the surrounding sentence, so a phrase comes back as a phrase.
- **Article actions.** Replace with a better fit, remove, or add from the
  coverage Herald read but did not select.
- **Herald.** Answers from the edition actually on screen — which story leads
  and why, what was left out, how the sections are structured — and applies
  changes the preview reflects immediately.

## Implementation

Next.js (App Router) + TypeScript + Tailwind v4. No state library, no charting
library, no component library: local React state, inline SVG charts, and
primitives built against the design tokens.

```
src/
  app/                      routes, one file per screen
  components/
    shell/                  application chrome (rail, top nav, page header)
    ui/                     button, field, menu, dialog, toast, badge…
    briefing/               document renderer, blocks, editing, table
    template/               cards, thumbnails, structure list, preview
    herald/                 the conversation panel, shared by B4 and T3
    workflow/               full-screen creation shell
  lib/
    data/                   deterministic mock data
    herald/                 Herald's deterministic behaviour
    store.tsx               all mutable prototype state
```

### Design tokens

`src/app/globals.css` mirrors the Figma variable collections (`GREYS`,
`VIOLET`, `radius`, `spacing`) so token names stay traceable between design and
code. Background `#FAFAFA`, accent `#7C3BED`, Inter throughout, with a display
serif for the briefing document itself.

Two deliberate departures from the Figma frames:

- **The client banner** is a gradient band with a typographic wordmark rather
  than the exported logo asset, so the prototype does not ship a third party's
  brand mark.
- **Below `lg`, the briefings table becomes a card list.** Seven columns cannot
  be shown honestly at phone width, and a sideways-scrolling table is worse
  than a list that fits.

### What is simulated

Everything behind the interface. There is no authentication, no database, no
scheduler, no email delivery and no model call. Herald is deterministic
rule-based logic in `src/lib/herald/` — the same input always produces the same
result, which is what makes the prototype demonstrable.

Coverage data is fictionalised. Headlines, outlets, figures and analysis are
invented for the prototype; competitors are unnamed and no real people appear.

State lives in memory for the session: created briefings, created and duplicated
templates and every edit to an edition persist while the tab is open and reset
on reload.
