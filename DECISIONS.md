# DECISIONS

## Key choices

| Decision | Reasoning |
|---|---|
| `claude-haiku-4-5` | Fastest and cheapest model that handles this. Opus and Sonnet were slower with no better results, including on submissions where tone and impact disagree |
| Validation lives in the route, not the extraction client | This way it applies to every client, including the fakes in tests |
| Express | Deploys to Lambda as a plain handler. A framework with its own conventions would be more to explain for no gain at three routes |
| Category counts computed in the browser | The dataset is small and unpaginated. A `/stats` endpoint would be API surface with nothing behind it |
| Lambda and S3 only, no API Gateway or CloudFront | Two services I can explain are worth more here than four I cannot. Both omissions are noted in the stack |

## Where AI wrote the code, and where I made the call

| Area | Written by | Note |
|---|---|---|
| PLAN.md | Claude and me | Written together. The decisions are mine |
| Monorepo scaffolding | Claude | Boilerplate, reviewed before committing |
| Contract, extraction client | Me | The parts where the design decisions live |
| Acceptance criteria tests | Me | Committed failing before the implementation |
| Store, route handlers | Claude | Plumbing, reviewed before committing |
| app/src/components/ui/* | shadcn registry | Vendored component source, copied in by the UI library CLI. Not written by me or Claude |
| Dashboard | Claude | Reviewed and iterated on before committing |
| CDK stack, Lambda handler | Claude | Reviewed and trimmed before committing |
| Hardening | Claude and me | I ran the attacks and decided the fixes. Claude wrote them |
| HARDENING.md, DECISIONS.md, README.md | Claude and me | Drafted together, edited down by me |

## Known limitations

- Counting categories in the browser breaks if the list is ever paginated.
- Nothing sets `triaged` or `resolved`.
- The record type is written twice, so the frontend can drift from the API.
- A wrong-but-valid extraction is undetectable.
- The in-memory store loses everything on restart, and does not work on Lambda.
- A very long submission makes a very tall table row.

## With more time

- DynamoDB behind the existing `Store` interface.
- A small set of test submissions with expected results, to catch drift.
- An endpoint to change status.
- One shared contract instead of two copies.
- Auth and rate limiting.
