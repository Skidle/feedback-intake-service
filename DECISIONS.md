# DECISIONS

## Key choices

| Decision | Reasoning |
|---|---|
| `claude-haiku-4-5` | Fastest and cheapest model that handles this. Opus and Sonnet were slower with no better results, including on submissions where tone and impact disagree |
| Validation lives in the route, not the extraction client | This way it applies to every client, including the fakes in tests |

## Where AI wrote the code, and where I made the call

| Area | Written by | Note |
|---|---|---|
| PLAN.md | Claude and me | Written together. The decisions are mine |
| Monorepo scaffolding | Claude | Boilerplate, reviewed before committing |
| Contract, extraction client | Me | The parts where the design decisions live |
| Acceptance criteria tests | Me | Committed failing before the implementation |
| Store, route handlers | Claude | Plumbing, reviewed before committing |

## Known limitations

- *(TODO: add what the build turns up.)*

## With more time

- *(TODO: write after the build.)*