import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST: APIRoute = async ({ request }) => {
    try {
        const rawBody = await request.text();
        console.log('Request raw body:', rawBody);

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            throw new Error(`Invalid JSON body: ${e instanceof Error ? e.message : String(e)} `);
        }

        const { prompt, stream, config } = body;

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Prompt is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Log prompt preview
        console.log('Analyzing prompt:', prompt.substring(0, 50) + '...');

        // Prioritize user config, fallback to env vars
        const apiKey = config?.apiKey || import.meta.env.GEMINI_API_KEY;
        const customEndpoint = config?.endpoint || import.meta.env.VITE_CUSTOM_AI_ENDPOINT;
        const modelName = config?.model || 'gemini-2.5-flash-lite';

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error: MISSING_API_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (stream) {
            // Streaming Response
            const encoder = new TextEncoder();
            const readable = new ReadableStream({
                async start(controller) {
                    try {
                        if (customEndpoint && customEndpoint.startsWith('http')) {
                            // Custom Endpoint Streaming (OpenAI Compatible SSE)
                            console.log('Using custom endpoint for streaming:', customEndpoint);
                            const response = await fetch(customEndpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${apiKey} `
                                },
                                body: JSON.stringify({
                                    model: modelName,
                                    messages: [{ role: 'user', content: prompt }],
                                    stream: true
                                })
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Custom API Error: ${response.status} - ${errorText} `);
                            }
                            if (!response.body) throw new Error('No response body from custom endpoint');

                            const reader = response.body.getReader();
                            const decoder = new TextDecoder();
                            let buffer = '';

                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                const chunk = decoder.decode(value, { stream: true });
                                buffer += chunk;
                                const lines = buffer.split('\n');
                                buffer = lines.pop() || '';

                                for (const line of lines) {
                                    if (line.startsWith('data: ')) {
                                        const data = line.slice(6);
                                        if (data === '[DONE]') continue;
                                        try {
                                            const json = JSON.parse(data);
                                            const content = json.choices?.[0]?.delta?.content || '';
                                            if (content) {
                                                controller.enqueue(encoder.encode(content));
                                            }
                                        } catch (e) {
                                            // Ignore parse errors for partial lines or non-JSON data lines
                                            console.warn('Failed to parse SSE data line:', data, e);
                                        }
                                    }
                                }
                            }
                        } else {
                            // Google SDK Streaming
                            console.log('Using Google Generative AI SDK for streaming');
                            const genAI = new GoogleGenerativeAI(apiKey);
                            const model = genAI.getGenerativeModel({ model: modelName });
                            const result = await model.generateContentStream(prompt);

                            for await (const chunk of result.stream) {
                                const chunkText = chunk.text();
                                if (chunkText) {
                                    controller.enqueue(encoder.encode(chunkText));
                                }
                            }
                        }
                        controller.close();
                    } catch (error) {
                        console.error('Streaming Error:', error);
                        controller.error(error);
                    }
                }
            });

            return new Response(readable, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });

        } else {
            // Non-streaming Logic (Keep existing fallback)
            let reportText = '';

            if (customEndpoint && customEndpoint.startsWith('http')) {
                // Use Custom Endpoint (OpenAI Compatible)
                console.log('Using custom endpoint:', customEndpoint);

                const response = await fetch(customEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey} `
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                console.log('Custom endpoint response status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Custom endpoint error body:', errorText);
                    throw new Error(`Custom API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                let data;
                try {
                    const text = await response.text();
                    console.log('Custom endpoint raw response:', text.substring(0, 200) + '...');
                    if (!text) {
                        throw new Error('Empty response from custom endpoint');
                    }
                    data = JSON.parse(text);
                } catch (e) {
                    throw new Error(`Failed to parse JSON from custom endpoint: ${e instanceof Error ? e.message : String(e)}`);
                }

                reportText = data.choices?.[0]?.message?.content || '';

                if (!reportText) {
                    throw new Error('Invalid response format from custom endpoint: missing choices[0].message.content');
                }

            } else {
                // Use Google Generative AI SDK
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                reportText = response.text();
            }

            return new Response(JSON.stringify({ reportText }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        // Extract more details if possible
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: 'Failed to generate analysis', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
