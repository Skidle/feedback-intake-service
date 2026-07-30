import type { ExtractionClient } from './index.js';

const mockResponses = [
    {
        category: 'bug', sentiment: 'negative', severity: 'high',
        summary: 'Exports fail silently', suggestedAction: 'Check the download handler'
    },

    {
        category: 'feature_request', sentiment: 'neutral', severity: 'low',
        summary: 'Wants bulk export', suggestedAction: 'Add to backlog'
    },

    {
        category: 'praise', sentiment: 'positive', severity: 'low',
        summary: 'Likes the new dashboard', suggestedAction: 'No action needed'
    },

    {
        category: 'other', sentiment: 'neutral', severity: 'medium',
        summary: 'Unclear feedback', suggestedAction: 'Ask for detail'
    },
];

export function createMockClient(): ExtractionClient {
    return {
        // The retry hint is ignored: the response is a pure function of the
        // submission's length, so a retry returns the same answer. Offline mode
        // cannot demonstrate a repair, only that the retry happens.
        async extract(text) {
            return mockResponses[text.length % mockResponses.length];
        },
    };
}
