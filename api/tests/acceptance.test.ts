import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { FeedbackRecordSchema } from '../src/contract.js';

const validExtraction = {
    category: 'bug',
    sentiment: 'negative',
    severity: 'medium',
    summary: 'Export button does not work in Safari',
    suggestedAction: 'Check the Safari download handler',
};

describe('Acceptance criteria', () => {
    it('Scenario: A valid submission produces a conforming record', async () => {
        const app = createApp({ extraction: { extract: async () => validExtraction } });

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'The export button does nothing on Safari' });

        expect(res.status).toBe(201);
        expect(FeedbackRecordSchema.safeParse(res.body).success).toBe(true);
        expect(res.body.status).toBe('new');
        expect(res.body.text).toBe('The export button does nothing on Safari');
        expect(res.body.id).toMatch(/^fb_/);
        expect(res.body.submittedAt).toBeDefined();

        const storedRecord = await request(app)
            .get(`/feedback/${res.body.id}`);

        expect(storedRecord.status).toBe(200);
        expect(storedRecord.body.id).toBe(res.body.id);
    })

    it('Scenario: Model output that fails the contract is retried once, then rejected', async () => {
        let calls = 0;
        const failures: (string | undefined)[] = [];
        const app = createApp({
            extraction: {
                extract: async (_text, previousFailure) => {
                    calls += 1;
                    failures.push(previousFailure);
                    return { ...validExtraction, summary: 'x'.repeat(300) };
                },
            },
        });

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'The export button does nothing on Safari' });

        expect(calls).toBe(2);
        expect(failures[0]).toBeUndefined();
        expect(failures[1]).toContain('summary');

        expect(res.status).toBe(422);
        expect(res.body.error).toBeDefined();

        const storedRecords = await request(app)
            .get('/feedback');

        expect(storedRecords.body).toEqual([]);
    })
})