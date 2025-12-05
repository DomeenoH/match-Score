import LZString from 'lz-string';
import { type SoulProfile } from './questions';

// 编码：将用户的 SoulProfile 对象转化为紧凑的 URL-safe 字符串
export const encodeSoul = (profile: Omit<SoulProfile, 'timestamp'>): string => {
    // 1. 确保在编码前加上时间戳 (Unix Epoch)
    const profileWithTimestamp: SoulProfile = {
        ...profile,
        timestamp: Date.now(),
    };
    const jsonString = JSON.stringify(profileWithTimestamp);
    // 2. 压缩并转码
    return LZString.compressToEncodedURIComponent(jsonString);
};

// 解码：将 Soul Hash 字符串还原为 SoulProfile 对象
export const decodeSoul = (hash: string): SoulProfile | null => {
    // 1. 解码并解压
    const jsonString = LZString.decompressFromEncodedURIComponent(hash);
    if (!jsonString) return null;

    try {
        // 2. 尝试解析 JSON
        const profile = JSON.parse(jsonString);
        // 3. 增加基础验证 (如版本号和答案数组)
        if (typeof profile.version === 'number' && Array.isArray(profile.answers)) {
            return profile as SoulProfile;
        }
        return null; // 验证失败
    } catch (e) {
        console.error("Decoding error:", e);
        return null;
    }
};

// 新增：用于在匹配页面计算基础欧几里得距离的函数
export const calculateDistance = (profileA: SoulProfile, profileB: SoulProfile): number => {
    // 仅比较 answers 数组
    const answersA = profileA.answers;
    const answersB = profileB.answers;

    // 必须验证 answersA.length === 50，如果长度不符则返回 0 或抛错
    if (answersA.length !== 50 || answersA.length !== answersB.length) {
        console.error(`Answer array length mismatch or unexpected length. Expected 50, got A:${answersA.length}, B:${answersB.length}`);
        return 0;
    }

    let squaredDifferenceSum = 0;
    for (let i = 0; i < answersA.length; i++) {
        squaredDifferenceSum += Math.pow(answersA[i] - answersB[i], 2);
    }

    const distance = Math.sqrt(squaredDifferenceSum);

    // 归一化：基于 50 题计算最大可能距离
    // Max Distance = sqrt(50 * (5 - 1)^2) = sqrt(50 * 16) = sqrt(800) ≈ 28.28
    const maxPossibleDistance = Math.sqrt(50 * 16);

    // 匹配度公式: 100 - (实际距离 / 最大距离) * 100
    const matchScore = 100 - (distance / maxPossibleDistance) * 100;

    return Math.max(0, parseFloat(matchScore.toFixed(1))); // 确保分数在 0-100
};
