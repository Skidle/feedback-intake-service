# Feedback Intake Service

Takes freeform feedback, uses an AI model to extract a structured record, validates it, stores it, and shows it on a dashboard.

## Running it

Needs Node 22 or later.

    npm install
    npm run dev

API on http://localhost:3000, dashboard on http://localhost:5173.

## Configuration

Copy `api/.env.example` to `api/.env`:

    ANTHROPIC_API_KEY=
    AI_PROVIDER=mock

`AI_PROVIDER=mock` runs without a key. It returns one of four canned answers picked by text length, so it ignores what you wrote. Remove the line and set a key to use the real model.

## Tests

    npm test

Eleven tests. Two are named to the scenarios in PLAN.md. None call the real API.

## Infrastructure

`infra/` describes deployment with AWS CDK: the API on Lambda, the dashboard on S3. Not deployed. `npm run synth -w infra` builds the template locally.

## Documents

- `PLAN.md` — scope in and out, the contract, acceptance criteria as Gherkin, risks, and amendments made while hardening.
- `HARDENING.md` — what I attacked, what I tightened as a result, and what I would add before production.
- `DECISIONS.md` — key choices and why, where AI wrote the code, known limitations, and what I would do with more time.

## Effort

About 15 hours, well over the four to five suggested. Most of it was learning
rather than building: the tool-use API, and AWS, which I had not used before.
Planning and the write-ups took about five hours; the feature work was a few.
