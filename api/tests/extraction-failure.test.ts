import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Extraction failure', () => {
    it('rejects with 422 and stores nothing when the extraction call throws', async () => {
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

        expect(res.status).toBe(422);
        expect(res.body.error).toBeDefined();

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
