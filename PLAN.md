# PLAN

Feedback Intake Service. Receives freeform text and returns a validated structured record, exposed through a typed API and a minimal dashboard.

## Scope

**In scope:**

- `FeedbackRecord` contract, validated at the incoming HTTP request boundary and at the AI model's output.
- One extraction call to the AI model. The model returns five content fields.
- API: submit, list, get one (contract detailed below).
- Offline mode: `AI_PROVIDER=mock` returns a mocked extraction instead of calling the model API, so the service runs without a key.
- Dashboard: lists records and aggregates counts by category (computed client side).
- Tests per the acceptance criteria below.
- CDK stack describing deployment. Not deployed.

**Out of scope:**

| Excluded | Why |
|---|---|
| Auth, deployment, database, CI, containers, observability | The brief's non-goals |
| Pagination, filtering, sorting on `GET /feedback` | No volume to justify it |
| UI polish | Explicitly not assessed |
| Status transitions | Records are created `new` and stay as such. `triaged` and `resolved` are in the contract but nothing sets them |
| Client-side routing | One view, no router |
| Rate limiting | No auth and no deployment, so there is nothing to attach it to |
| Non-English submissions | Untested |
| Retrying failed API calls (429, timeouts, 5xx) | A failed call and a bad answer are different problems, and only the latter matters here |

## Contract

The model's output is untrusted input, so I have to validate it before storing.

The model owns only the fields that require reading and judging the user's submission.

| Field | Owner | Type | Why not the model's |
|---|---|---|---|
| `id` | service | `fb_` + UUIDv7 | The model cannot know which ids are already taken |
| `submittedAt` | service | ISO 8601 UTC | The model has no clock, so it would invent a plausible date |
| `status` | service | `new \| triaged \| resolved`, always `new` | Workflow state in my system |
| `text` | user | string, 1–5000 chars | The submission verbatim |
| `category` | model | `bug \| feature_request \| praise \| other` | — |
| `sentiment` | model | `positive \| neutral \| negative` | — |
| `severity` | model | `low \| medium \| high` | — |
| `summary` | model | string, ≤200 chars | — |
| `suggestedAction` | model | string, ≤200 chars | — |

### Added to the reference record: `text`

The only change to the suggested schema. Two reasons:

- **Auditability.** Without the original submission there is nothing to check a record against. A summary that misrepresents the feedback is undetectable if the feedback is gone.
- **Re-processing.** A changed prompt or model cannot be re-run over existing records if the input was discarded.

## API

| Endpoint | Success | Errors |
|---|---|---|
| `POST /feedback` | 201, the created record | 400, empty submission, or over 5000 characters<br>422, extraction did not satisfy the contract |
| `GET /feedback` | 200, all records | — |
| `GET /feedback/:id` | 200, the record | 404, unknown id |

Errors return `{ error, details? }`.

## Invalid model output

Whatever the reason, the outcome is the same. Bad values, a refusal, a cut-off response, or no tool call at all: none of them produce a valid record, so all of them take the same path.

The policy, and the reasoning:

- **Reject on first failure.** 422, nothing stored, no retry.
- **Reject rather than quarantine.** Keeps the contract simple: every record in the store is complete, so no consumer handles partial records.
- **The form keeps the submitted text.** The user does not retype it.
- **Known cost.** A failed extraction loses the submission. The fix is one retry with the validation errors fed back, planned for the hardening phase.

## Acceptance criteria

```gherkin
Scenario: A valid submission produces a conforming record
  Given the extraction service is available
  When I submit the feedback text "The export button does nothing on Safari"
  Then a record satisfying the FeedbackRecord contract is stored
  And its id, submittedAt and status are set by the service, not the model
  And its status is "new"
  And its text is the submission verbatim
  And the response is 201 with that record
```

```gherkin
Scenario: Model output that fails the contract is rejected
  Given the extraction model returns a summary longer than the contract permits
  When I submit the feedback text "The export button does nothing on Safari"
  Then no record is stored
  And the response is 422 identifying the contract as the reason
```

## Tests

No test calls the real API. The extraction client is replaced with a fake, so the suite runs without a key.

| Test | Covers |
|---|---|
| Named to scenario 1 | Success path, end to end |
| Named to scenario 2 | Invalid model output |
| Input boundary | Empty and oversized submissions, rejected before the model is called |

Both scenario tests are written and committed failing before the implementation. The input boundary test lands with the implementation.

## Risks

| Risk | How it is handled |
|---|---|
| The extraction is valid but wrong. A complaint gets marked as praise | Validation cannot catch this. Finding it needs test data and scoring, which is out of scope |
| Users can paste personal or sensitive text into the form, and it gets sent to a third party model | Not handled. Flagged in HARDENING.md |
| Someone can hide instructions inside the feedback text to steer the model | Only the length cap. Flagged in HARDENING.md |
| The model call happens during the request. Submitting is slow, and fails when the provider is down | Accepted. A queue would fix it, but that is a bigger API than the brief asks for |
| Records live in memory. They are lost on restart, and Lambda gives each container its own copy | Accepted. A real deployment uses DynamoDB behind the same interface |

## Stack

| Concern | Choice |
|---|---|
| API | Node.js + Express |
| Contract / validation | Zod |
| UI | React + shadcn/ui (Tailwind) |
| AI | Anthropic `claude-haiku-4-5`, structured output via tool use (`strict: true`) |
| Store | In-memory `Map` |
| Tests | Vitest |
| IaC | AWS CDK: the API on Lambda behind a Function URL, the built frontend on S3 as a static site |

Reasoning for each choice is in DECISIONS.md.
