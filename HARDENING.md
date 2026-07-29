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

- *(TODO: fill in afterwards.)*

## What I would add before production

| Would add | Why it matters | Why it is out of a four-to-five hour exercise |
|---|---|---|
