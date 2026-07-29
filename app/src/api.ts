// Declared here rather than imported from the api workspace: the HTTP contract is
// the boundary, and the dashboard should break loudly if the API's shape drifts
// rather than silently track it through a shared type.
export type Category = 'bug' | 'feature_request' | 'praise' | 'other';

export interface FeedbackRecord {
  id: string;
  submittedAt: string;
  status: 'new' | 'triaged' | 'resolved';
  text: string;
  category: Category;
  sentiment: 'positive' | 'neutral' | 'negative';
  severity: 'low' | 'medium' | 'high';
  summary: string;
  suggestedAction: string;
}

export const CATEGORIES: Category[] = [
  'bug',
  'feature_request',
  'praise',
  'other',
];

// The API's error shape is { error, details? }. Only `error` is shown; `details`
// is a Zod tree meant for a developer, not the person who wrote the feedback.
async function errorFrom(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  const message =
    body && typeof body.error === 'string'
      ? body.error
      : `Request failed (${response.status})`;

  return new Error(message);
}

export async function listFeedback(): Promise<FeedbackRecord[]> {
  const response = await fetch('/feedback');
  if (!response.ok) throw await errorFrom(response);

  return response.json();
}

export async function submitFeedback(text: string): Promise<FeedbackRecord> {
  const response = await fetch('/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw await errorFrom(response);

  return response.json();
}
