import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionClient } from './index.js';
import { ExtractedFieldsSchema } from '../contract.js';

const toolSchema = z.toJSONSchema(ExtractedFieldsSchema);

const SYSTEM = 'Categorize the user feedback given. Judge severity from the impact described, not from the tone. Keep the summary and suggested action under 200 characters each.';

export function createAnthropicClient(): ExtractionClient {
    const client = new Anthropic();

    return {
        async extract(text, previousFailure) {
            const response = await client.messages.create({
                messages: [{ role: 'user', content: text }],
                // In the system prompt so the user turn stays exactly what was submitted.
                system: previousFailure
                    ? `${SYSTEM}\n\nYour previous answer was rejected because it did not satisfy the schema:\n${previousFailure}\n\nReturn a corrected record.`
                    : SYSTEM,
                tools: [{
                    name: 'record_feedback',
                    description: 'Record the structured summary of a piece of user feedback',
                    strict: true,
                    input_schema: {
                        ...toolSchema,
                        type: 'object',
                        additionalProperties: false,
                    } as Anthropic.Tool.InputSchema,
                }],
                tool_choice: { type: "tool", name: "record_feedback" },
                max_tokens: 4096,
                model: 'claude-haiku-4-5',
            });

            const toolUse = response.content.find(b => b.type === 'tool_use');
            return toolUse?.input;
        },
    };
}
