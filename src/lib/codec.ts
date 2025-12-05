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


