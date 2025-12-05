import React, { useState } from 'react';
import { decodeSoul } from '../lib/codec';

interface MatchInputProps {
    onMatch: (hash: string) => void;
}

export default function MatchInput({ onMatch }: MatchInputProps) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    const extractHash = (text: string): string => {
        // 1. Try to find URL parameter
        try {
            const url = new URL(text);
            const host = url.searchParams.get('host');
            if (host) return host;
        } catch (e) {
            // Not a valid URL, continue
        }

        // 2. Try to find hash in text (simple heuristic: long base64-like string)
        // This is a loose check, we rely on decodeSoul to validate
        const words = text.split(/[\s\n]+/);
        for (const word of words) {
            if (word.length > 20 && !word.startsWith('http')) {
                // Potential hash
                return word.replace(/[^a-zA-Z0-9+/=]/g, '');
            }
        }

        return text.trim();
    };

    const handleMatch = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation();
        console.log("Match button clicked");

        setError('');

        const hash = extractHash(input);
        if (!hash) {
            setError('请输入有效的内容');
            return;
        }

        const profile = decodeSoul(hash);
        if (!profile) {
            setError('无法识别有效的灵魂编码，请检查是否复制完整');
            return;
        }

        console.log("Hash extracted and validated:", hash);
        onMatch(hash);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">输入对方的 Soul Hash</h2>
            <div className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="粘贴对方的邀请链接或 Hash..."
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="button"
                    onClick={handleMatch}
                    className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    开始匹配
                </button>
            </div>
        </div>
    );
}
