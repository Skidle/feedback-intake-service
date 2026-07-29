import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Input boundary', () => {
    it('rejects an empty submission without calling the model', async () => {
        let called = false;
        const app = createApp({
            extraction: { extract: async () => { called = true; return {} } },
        })

        const res = await request(app)
            .post('/feedback')
            .send({ text: '' });

        expect(res.status).toBe(400);
        expect(called).toBe(false);
    });

    it('rejects a submission over 5000 characters without calling the model', async () => {
        let called = false;
        const app = createApp({
            extraction: { extract: async () => { called = true; return {} } },
        })

        const res = await request(app)
            .post('/feedback')
            .send({ text: 'x'.repeat(5001) });

        expect(res.status).toBe(400);
        expect(called).toBe(false);
    });

    it('rejects a whitespace-only submission without calling the model', async () => {
        let called = false;
        const app = createApp({
            extraction: { extract: async () => { called = true; return {} } },
        })

        const res = await request(app)
            .post('/feedback')
            .send({ text: '     ' });

        expect(res.status).toBe(400);
        expect(called).toBe(false);
    });

    it('rejects a submission with no text field without calling the model', async () => {
        let called = false;
        const app = createApp({
            extraction: { extract: async () => { called = true; return {} } },
        })

        const res = await request(app)
            .post('/feedback')
            .send({});

        expect(res.status).toBe(400);
        expect(called).toBe(false);
    });
})