import { type SoulProfile, type ScenarioType, type Question, QUESTIONS, getQuestionsForScenario } from './questions';


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
    scenario: ScenarioType; // 新增：场景类型
}

export interface AnalysisResult {
    compatibilityScore: number;
    summary: string;
    details: string;
    comparisonMatrix?: ComparisonPoint[]; // Added for visual fallback
}

/**
 * 计算两个 SoulProfile 之间的匹配度（距离）
 */
/**
 * 计算两个 SoulProfile 之间的匹配度（距离）
 * 距离越小，匹配度越高
 * v2.1: 引入加权算法
 * v2.2: 增加类型兼容性校验
 */
export const calculateDistance = (profileA: SoulProfile, profileB: SoulProfile): number => {
    // 标准化类型：将 undefined 视为 'couple'（向后兼容 Legacy 数据）
    const typeA: ScenarioType = profileA.type || 'couple';
    const typeB: ScenarioType = profileB.type || 'couple';

    // 类型兼容性校验
    if (typeA !== typeB) {
        const typeLabels = { couple: '情侣测试', friend: '朋友测试' };
        throw new Error(`[TYPE_MISMATCH] 无法匹配：一方是「${typeLabels[typeA]}」档案，另一方是「${typeLabels[typeB]}」档案。请确保双方使用相同类型的测试。`);
    }

    // Detect scenario from profiles (prefer host/profileA, then profileB, then default)
    const scenario = typeA; // Now guaranteed to be the same
    const questions = getQuestionsForScenario(scenario);
    return calculateDistanceWithQuestions(profileA, profileB, questions);
};

/**
 * 计算两个 SoulProfile 之间的匹配度（距离）- 支持自定义题库
 * 用于多场景支持，根据传入的题库计算得分
 */
export const calculateDistanceWithQuestions = (
    profileA: SoulProfile,
    profileB: SoulProfile,
    questions: Question[]
): number => {
    let totalWeightedDiff = 0;
    let maxWeightedDiff = 0;
    const numQuestions = questions.length;

    for (let i = 0; i < numQuestions; i++) {
        const question = questions[i];
        const weight = question.weight || 1;

        const answerA = profileA.answers[i] ?? 3;
        const answerB = profileB.answers[i] ?? 3;

        const diff = Math.abs(answerA - answerB);

        totalWeightedDiff += diff * weight;
        maxWeightedDiff += 4 * weight;
    }

    const matchScore = Math.round((1 - (totalWeightedDiff / maxWeightedDiff)) * 100);
    return matchScore;
};

/**
 * 将两个 SoulProfile 转化为 LLM 需要的结构化对比数据
 * @param scenario 场景类型，用于选择正确的题库
 */
export const generateAIContext = (
    hostProfile: SoulProfile,
    guestProfile: SoulProfile,
    scenario?: ScenarioType
): AIContext => {
    // 标准化类型：将 undefined 视为 'couple'（向后兼容 Legacy 数据）
    const hostType: ScenarioType = hostProfile.type || 'couple';
    const guestType: ScenarioType = guestProfile.type || 'couple';

    // 类型兼容性校验（优先级最高）
    if (hostType !== guestType) {
        const typeLabels = { couple: '情侣测试', friend: '朋友测试' };
        throw new Error(`[TYPE_MISMATCH] 无法匹配：一方是「${typeLabels[hostType]}」档案，另一方是「${typeLabels[guestType]}」档案。请确保双方使用相同类型的测试。`);
    }

    // 推断场景：优先使用参数，否则从 profile 中读取（现在已校验一致），最后默认 couple
    const effectiveScenario: ScenarioType = scenario || hostType;
    const questions = getQuestionsForScenario(effectiveScenario);

    // 0. 数据完整性校验 (Robustness)
    const requiredLength = questions.length;
    if (hostProfile.answers.length !== requiredLength || guestProfile.answers.length !== requiredLength) {
        throw new Error(`数据版本不兼容：当前题库为 ${requiredLength} 题，但用户数据为 ${hostProfile.answers.length}/${guestProfile.answers.length} 题。请重新测试。`);
    }

    // 1. 计算基础分数（使用场景对应的题库）
    const matchScore = calculateDistanceWithQuestions(hostProfile, guestProfile, questions);

    // 2. 遍历题目，生成对比矩阵
    const comparisonMatrix: ComparisonPoint[] = questions.map((q, index) => {
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
        scenario: effectiveScenario,
    };
};

export const createAIPrompt = (context: AIContext): string => {
    const { matchScore, comparisonMatrix, hostProfile, guestProfile, scenario } = context;
    const nameA = hostProfile.name || 'A';
    const nameB = guestProfile.name || 'B';

    // 找出匹配点和冲突点
    const strengths = comparisonMatrix.filter(c => c.difference <= 1); // 差异度 <= 1 为优势
    const conflicts = comparisonMatrix.filter(c => c.difference >= 3); // 差异度 >= 3 为高冲突

    // ============ 策略模式：根据场景切换 AI 人设 ============
    let prompt: string;

    if (scenario === 'friend') {
        // "毒舌又幽默的社交评论家" persona for friend scenario
        prompt = `你是一位"毒舌又幽默的社交评论家"，专门分析朋友间的默契程度。你说话直接犀利但不刻薄，擅长用网络流行语和生动比喻。你的任务是根据 ${nameA} 和 ${nameB} 的 ${comparisonMatrix.length} 道朋友默契问卷结果，生成一份有趣又有洞察力的友情分析报告。两人基础默契度为 ${matchScore}%。

请从以下三个维度分析，使用中文分点作答：

分析重点：
1. **玩乐默契**：能不能一起愉快地旅行、聚会？会不会因为行程安排吵起来？
2. **相处边界**：借钱、深夜 emo、分享隐私...这些敏感话题两人是否有共识？
3. **长期友谊建议**：怎么做才能让这段友情久一点？

风格要求：
1. **毒舌但有爱**：可以吐槽，但要让人笑着接受。
2. **用梗说话**：适当使用网络流行语，但不要太尬。
3. **结构清晰**：严格按照下方格式输出。
4. **代入名字**：自然地提到 ${nameA} 和 ${nameB} 的名字。`;
    } else {
        // "资深情感观察员" persona for couple scenario (default)
        prompt = `你是一位阅人无数的"资深情感观察员"，擅长用最直白、接地气的大白话分析人际关系。你的任务是根据 ${nameA} 和 ${nameB} 两个人的${comparisonMatrix.length}个维度问卷结果，生成一份"一针见血"但又充满温度的相性分析报告。两人基础匹配度为 ${matchScore}%。请从三个维度（优势、雷区、长期建议）分析，并使用中文分点作答。

请注意：
1. **说人话**：不要用心理学术语，要像老朋友聊天一样自然。
2. **直击痛点**：不要模棱两可，好的坏的都要直接指出来。
3. **结构清晰**：严格按照下方的格式输出。
4. **代入名字**：在分析中自然地提到 ${nameA} 和 ${nameB} 的名字，不要只说"A"和"B"。`;
    }

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

    prompt += "\n\n请根据上述数据和风格要求，生成报告的最终内容。为了便于程序解析，请严格使用以下分隔符将各板块分开（不要改变分隔符格式）：\n";
    prompt += "### 核心结论 ###\n（一句话总结，直指本质，不要废话）\n\n";
    prompt += "### 关键优势分析 ###\n（列点阐述，说明这些默契在生活中意味着什么）\n\n";
    prompt += "### 潜在雷区预警 ###\n（列点阐述，直接指出如果不注意会吵什么架）\n\n";
    prompt += "### 长期相处建议 ###\n（给出马上能用的实操建议）\n";

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
        return `match_v${profileA.version || '1'}_${keyParts.join('_')}`;
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

        const decoder = new TextDecoder();
        let accumulatedText = '';

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            accumulatedText = data.reportText || data.details || JSON.stringify(data);
            if (onStream) onStream(accumulatedText);
        } else {
            const reader = response.body?.getReader();
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
