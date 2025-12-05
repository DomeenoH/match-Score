import { type SoulProfile, QUESTIONS } from './questions';


// 新增接口：用于封装发给 LLM 的数据结构
export interface ComparisonPoint {
    id: number;
    dimension: string;
    question: string;
    A_answer: number;
    B_answer: number;
    A_label: string; // A的答案标签
    B_label: string; // B的答案标签
    difference: number; // 绝对差值 (0-4)
}

export interface AIContext {
    hostProfile: SoulProfile;
    guestProfile: SoulProfile;
    matchScore: number;
    comparisonMatrix: ComparisonPoint[];
}

export interface AnalysisResult {
    compatibilityScore: number;
    summary: string;
    details: string;
    comparisonMatrix?: ComparisonPoint[]; // Added for visual fallback
}

/**
 * 计算两个 SoulProfile 之间的匹配度（距离）
 * 距离越小，匹配度越高
 */
/**
 * 计算两个 SoulProfile 之间的匹配度（距离）
 * 距离越小，匹配度越高
 * v2.1: 引入加权算法
 */
export const calculateDistance = (profileA: SoulProfile, profileB: SoulProfile): number => {
    let totalWeightedDiff = 0;
    let maxWeightedDiff = 0;
    const numQuestions = QUESTIONS.length;

    for (let i = 0; i < numQuestions; i++) {
        const question = QUESTIONS[i];
        const weight = question.weight || 1; // Default weight 1

        const answerA = profileA.answers[i];
        const answerB = profileB.answers[i];

        const diff = Math.abs(answerA - answerB);

        totalWeightedDiff += diff * weight;
        maxWeightedDiff += 4 * weight; // Max diff per question is 4
    }

    // 将总差异标准化为 0-100 的匹配度分数
    // 匹配度 = (1 - (加权总差异 / 最大加权总差异)) * 100
    const matchScore = Math.round((1 - (totalWeightedDiff / maxWeightedDiff)) * 100);

    return matchScore;
};

/**
 * 将两个 SoulProfile 转化为 LLM 需要的结构化对比数据
 */
export const generateAIContext = (hostProfile: SoulProfile, guestProfile: SoulProfile): AIContext => {
    // 1. 计算基础分数
    const matchScore = calculateDistance(hostProfile, guestProfile);

    // 2. 遍历 50 题，生成对比矩阵
    const comparisonMatrix: ComparisonPoint[] = QUESTIONS.map((q, index) => {
        const A_answer = hostProfile.answers[index];
        const B_answer = guestProfile.answers[index];
        const A_option = q.options.find(opt => opt.value === A_answer);
        const B_option = q.options.find(opt => opt.value === B_answer);

        return {
            id: q.id,
            dimension: q.dimension,
            question: q.text,
            A_answer: A_answer,
            B_answer: B_answer,
            A_label: A_option?.label || 'N/A',
            B_label: B_option?.label || 'N/A',
            difference: Math.abs(A_answer - B_answer),
        };
    });

    return {
        hostProfile,
        guestProfile,
        matchScore,
        comparisonMatrix,
    };
};

export const createAIPrompt = (context: AIContext): string => {
    const { matchScore, comparisonMatrix, hostProfile, guestProfile } = context;
    const nameA = hostProfile.name || 'A';
    const nameB = guestProfile.name || 'B';

    // 找出匹配点和冲突点
    const strengths = comparisonMatrix.filter(c => c.difference <= 1); // 差异度 <= 1 为优势
    const conflicts = comparisonMatrix.filter(c => c.difference >= 3); // 差异度 >= 3 为高冲突

    // 构建核心 Prompt
    let prompt = `你是一位阅人无数的“资深情感观察员”，擅长用最直白、接地气的大白话分析人际关系。你的任务是根据 ${nameA} 和 ${nameB} 两个人的50个维度问卷结果，生成一份“一针见血”但又充满温度的相性分析报告。两人基础匹配度为 ${matchScore}%。请从三个维度（优势、雷区、长期建议）分析，并使用中文分点作答。

请注意：
1. **说人话**：不要用心理学术语，要像老朋友聊天一样自然。
2. **直击痛点**：不要模棱两可，好的坏的都要直接指出来。
3. **结构清晰**：严格按照下方的格式输出。
4. **代入名字**：在分析中自然地提到 ${nameA} 和 ${nameB} 的名字，不要只说“A”和“B”。`;

    // 优势分析
    prompt += "\n\n--- 优势维度（Difference <= 1）：两人天然契合点 ---";
    // 仅列出前 5 个最匹配的题目和结果
    strengths.slice(0, 5).forEach(c => {
        prompt += `\n- [${c.dimension}]: Q.${c.id} (${c.question}) 两人答案几乎一致，${nameA}: ${c.A_label}, ${nameB}: ${c.B_label}。`;
    });

    // 冲突分析
    prompt += "\n\n--- 核心雷区（Difference >= 3）：未来潜在的冲突爆发点 ---";
    // 仅列出前 5 个差异最大的题目和结果
    conflicts.slice(0, 5).forEach(c => {
        prompt += `\n- [${c.dimension}]: Q.${c.id} (${c.question}) 差异巨大 (${nameA}:${c.A_label} vs ${nameB}:${c.B_label})。这是硬性矛盾，需要深入关注。`;
    });

    // 维度总结
    prompt += "\n\n--- 维度总结 ---";
    // 提示 AI 根据四个维度（lifestyle, finance, communication, values）的差异度，给出概括性评价。

    prompt += "\n\n请根据上述数据和风格要求，生成报告的最终内容，报告应包含以下结构：\n";
    prompt += "1. 核心结论（一句话总结，直指本质，不要废话）\n";
    prompt += "2. 关键优势分析（列点阐述，说明这些默契在生活中意味着什么）\n";
    prompt += "3. 潜在雷区预警（列点阐述，直接指出如果不注意会吵什么架）\n";
    prompt += "4. 长期相处建议（给出马上能用的实操建议）\n";

    return prompt;
};

export const retryFetch = async (
    url: string,
    options: RequestInit,
    retries = 3,
    backoff = 1000,
    onRetry?: (count: number) => void
): Promise<Response> => {
    try {
        const response = await fetch(url, options);
        if (response.ok) return response;

        // Retry on specific error codes
        if ([429, 500, 502, 503, 504].includes(response.status) && retries > 0) {
            const currentRetry = 4 - retries; // Assuming initial retries = 3
            console.warn(`Request failed with status ${response.status}. Retrying in ${backoff}ms... (Attempt ${currentRetry})`);

            if (onRetry) onRetry(currentRetry);

            await new Promise(resolve => setTimeout(resolve, backoff));
            return retryFetch(url, options, retries - 1, backoff * 2, onRetry);
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            const currentRetry = 4 - retries;
            console.warn(`Request failed with error. Retrying in ${backoff}ms... (Attempt ${currentRetry})`, error);

            if (onRetry) onRetry(currentRetry);

            await new Promise(resolve => setTimeout(resolve, backoff));
            return retryFetch(url, options, retries - 1, backoff * 2, onRetry);
        }
        throw error;
    }
};

export const testAIConnection = async (
    endpoint: string,
    apiKey?: string,
    model?: string
): Promise<any> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const isInternal = endpoint.endsWith('/api/analyze');
    const body = isInternal
        ? JSON.stringify({
            prompt: "Hello, this is a connection test.",
        })
        : JSON.stringify({
            model: model || 'gemini-2.5-flash-lite',
            messages: [{ role: 'user', content: "Hello, this is a connection test." }]
        });

    const response = await retryFetch(endpoint, {
        method: 'POST',
        headers,
        body,
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Test failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
    }

    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
};

export interface AIConfig {
    endpoint?: string;
    apiKey?: string;
    model?: string;
}

// 新增：生成唯一且与顺序无关的缓存键
// 通过排序两个 profiles 的 answers 数组的 JSON 字符串，确保 A,B 和 B,A 得到相同的 Key。
export const generateCacheKey = (profileA: SoulProfile, profileB: SoulProfile): string => {
    // 确保使用最新的 V2.0 问卷长度 50
    if (profileA.answers.length !== 50 || profileB.answers.length !== 50) {
        console.error("Profile answers length mismatch for caching.");
        // 在长度不匹配时，使用默认的 name/version 结合作为 fallback
        const keyParts = [profileA.name || 'A', profileB.name || 'B'].sort();
        return `match_v${profileA.version || 1}_${keyParts.join('_')}`;
    }

    // 将两个 answers 数组转换为字符串
    const answersStrA = JSON.stringify(profileA.answers);
    const answersStrB = JSON.stringify(profileB.answers);

    // 排序这两个字符串，以保证 key 的顺序无关性
    const sortedKeys = [answersStrA, answersStrB].sort();

    // 结合问卷版本号 V2.0 (或取 profileA.version)
    return `match_v${profileA.version || 2}_${sortedKeys.join('|')}`;
};

export const fetchAIAnalysis = async (
    profileA: SoulProfile,
    profileB: SoulProfile,
    onRetry?: (count: number) => void,
    onStream?: (text: string) => void,
    config?: AIConfig
): Promise<AnalysisResult> => {
    // 1. Generate Context
    const context = generateAIContext(profileA, profileB);

    // 2. Create Prompt
    const prompt = createAIPrompt(context);

    // 3. Generate Cache Key (新增)
    const cacheKey = generateCacheKey(profileA, profileB);

    // Always use the internal API endpoint.
    const endpoint = '/api/analyze';

    try {
        const response = await retryFetch(
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, stream: true, config, cacheKey }), // Signal streaming and pass config
            },
            3,
            1000,
            onRetry
        );

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`AI Analysis request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;
                if (onStream) onStream(accumulatedText);
            }
        } else {
            // Fallback for non-streaming environments
            const data = await response.json();
            accumulatedText = data.reportText;
        }

        return {
            compatibilityScore: context.matchScore,
            summary: `基于数据的灵魂契合度：${context.matchScore}%`,
            details: accumulatedText,
            comparisonMatrix: context.comparisonMatrix // Pass matrix for fallback
        };
    } catch (error) {
        console.error("AI Analysis Error:", error);
        // Fallback to mock response if API fails
        return {
            compatibilityScore: context.matchScore,
            summary: `基于数据的灵魂契合度：${context.matchScore}% (离线模式)`,
            details: `[系统提示：AI 服务暂时不可用，以下是基于原始数据的分析预览]\n\n${prompt}`,
            comparisonMatrix: context.comparisonMatrix // Pass matrix for fallback
        };
    }
};
