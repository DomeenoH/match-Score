import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. 引入 Vercel KV
import Redis from 'ioredis';

// Initialize Redis client
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
    try {
        console.log('Initializing Redis client with REDIS_URL');
        redis = new Redis(process.env.REDIS_URL);
        redis.on('error', (err) => console.error('Redis Client Error:', err));
    } catch (e) {
        console.error('Failed to initialize Redis client:', e);
    }
} else {
    console.warn('REDIS_URL not found, caching will be disabled.');
}

// 缓存过期时间：7天 (秒)
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

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

        const { prompt, stream, config, cacheKey } = body;

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Prompt is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- 3. 缓存检查 (Cache Check) ---
        if (cacheKey) {
            try {
                // Check if Redis is configured
                if (redis) {
                    console.log(`Checking cache for key: ${cacheKey} `);
                    const cachedReport = await redis.get(cacheKey);

                    if (cachedReport) {
                        console.log('Cache HIT: Returning cached report.');
                        // 注意：如果客户端期望的是流式响应，我们不能直接返回 JSON，但此处为了简化 token 浪费问题，
                        // 我们假设非流式响应是缓存的首选或可接受的回退。
                        // 如果需要严格的流式缓存，需要更复杂的实现，此处我们选择非流式返回缓存结果。
                        return new Response(JSON.stringify({ reportText: cachedReport }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }
                } else {
                    console.warn('Redis not configured, skipping cache check.');
                }
            } catch (kvError) {
                console.error('KV Cache Check Error:', kvError);
                // Continue without cache if KV fails
            }
        }
        // --- 缓存检查结束 ---

        // Log prompt preview
        console.log('Analyzing prompt:', prompt.substring(0, 50) + '...');

        // Prioritize user config, fallback to env vars
        const apiKey = config?.apiKey || import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
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
            // 4. 存储流式响应的完整内容
            let fullStreamContent = '';

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
                                                fullStreamContent += content; // 积累内容
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
                                    fullStreamContent += chunkText; // 积累内容
                                    controller.enqueue(encoder.encode(chunkText));
                                }
                            }
                        }

                        // 6. 流结束时，写入缓存
                        if (cacheKey && fullStreamContent) {
                            try {
                                if (redis) {
                                    console.log('Streaming complete. Writing to cache.');
                                    await redis.set(cacheKey, fullStreamContent, 'EX', CACHE_TTL_SECONDS);
                                }
                            } catch (kvError) {
                                console.error('KV Cache Write Error:', kvError);
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

            // 7. 非流式结束后，写入缓存
            if (cacheKey && reportText) {
                try {
                    if (redis) {
                        console.log('Non-streaming complete. Writing to cache.');
                        await redis.set(cacheKey, reportText, 'EX', CACHE_TTL_SECONDS);
                    }
                } catch (kvError) {
                    console.error('KV Cache Write Error:', kvError);
                }
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
