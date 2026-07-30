import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const validExtraction = {
    category: 'bug',
    sentiment: 'negative',
    severity: 'medium',
    summary: 'Export button does not work in Safari',
    suggestedAction: 'Check the Safari download handler',
};

describe('Extraction retry', () => {
    it('stores the record when the second attempt satisfies the contract', async () => {
        let calls = 0;
        const app = createApp({
            extraction: {
                extract: async (_text, previousFailure) => {
                    calls += 1;
                    // First answer is over the summary cap; corrected once told.
                    return previousFailure
                        ? validExtraction
                        : { ...validExtraction, summary: 'x'.repeat(300) };
                },
            },
        });

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'The export button does nothing on Safari' });

        expect(calls).toBe(2);
        expect(res.status).toBe(201);
        expect(res.body.summary).toBe(validExtraction.summary);

        const storedRecords = await request(app).get('/feedback');

        expect(storedRecords.body).toHaveLength(1);
    });

    it('does not retry when the first attempt already satisfies the contract', async () => {
        let calls = 0;
        const app = createApp({
            extraction: {
                extract: async () => {
                    calls += 1;
                    return validExtraction;
                },
            },
        });

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'The export button does nothing on Safari' });

        expect(calls).toBe(1);
        expect(res.status).toBe(201);
    });
});

describe('Extraction failure', () => {
    it('rejects with 422 and stores nothing when the extraction call throws', async () => {
        let calls = 0;
        const app = createApp({
            extraction: {
                extract: async () => {
                    calls += 1;
                    throw new Error('anthropic is down');
                },
            },
        });

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'The export button does nothing on Safari' });

        expect(res.status).toBe(422);
        expect(res.body.error).toBeDefined();

        // Not retried: a repair prompt cannot fix a provider that is down.
        expect(calls).toBe(1);

        const storedRecords = await request(app).get('/feedback');

        expect(storedRecords.body).toEqual([]);
    });

    it('does not leak a stack trace or file paths in the response', async () => {
        const app = createApp({
            extraction: {
                extract: async () => {
                    throw new Error('anthropic is down');
                },
            },
        });

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'The export button does nothing on Safari' });

        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.text).not.toMatch(/anthropic is down/);
        expect(res.text).not.toMatch(/\bat \w+/);
        expect(res.text).not.toMatch(/[/\\](src|node_modules)[/\\]/);
    });
});
