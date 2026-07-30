# HARDENING

## What I attacked

| Attack | Result |
|---|---|
| Feedback text telling the model to ignore its instructions and mark it as praise | Ignored, the model categorized the real complaint. It held this time, which is not a guarantee |
| A submission of only spaces | Passed validation, because `.min(1)` counts spaces. Reached the model, which rejected it. That error came back as a 500 with a stack trace |
| `<script>alert(1)</script>` in the feedback text | Stored and displayed as plain text. React escapes it, so this was the framework and not me |
| Feedback in Russian | Fine. My first attempt came back as question marks, but that was curl on Windows, not the service. It works through the dashboard correctly |
| 4000 characters with no spaces | Extracted fine. Broke the table, because the wrap rule breaks on spaces and there were none |
| Model output that fails the contract | Already covered by the second acceptance scenario. 422, nothing stored |

## What I tightened

- Whitespace-only submissions are rejected at the boundary. `.min(1)` counted spaces, so they reached the model, which rejected them.
- A thrown extraction call returns 422 like any other failed extraction, instead of a 500 with a stack trace and file paths. An error handler covers anything else and keeps the status middleware set, so malformed JSON stays a 400.
- Long unbroken text wraps in the table instead of stretching it to 26,000 pixels wide.
- Invalid model output gets one repair attempt with the validation error fed back, then rejects as before. A thrown call gets none, since a correction cannot fix a provider that is down.

## What I would add before production

| Would add | Why it matters | Why not here |
|---|---|---|
| CI running tests on every push | Catches a break before it lands | Non-goal in the brief |
| End-to-end tests | Current tests stop at the API | Not worth the setup at this size |
| Promotion with approvals | Same build moves dev to test to prod, and the approval records who signed off | Nothing is deployed |
| Rollback | Redeploy the previous build. Easy here, harder once data persists | Nothing is deployed |
| Observability | A rising 422 rate means the model drifted, and nothing would show it | Non-goal in the brief |
| Prompt injection defense | Submitted text goes into a prompt as-is | Real, and out of scope |
| Rate limiting and auth | The endpoint is public, so anyone can spend the API budget | No auth by design |
