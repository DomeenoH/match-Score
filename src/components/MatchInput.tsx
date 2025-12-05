import React, { useState } from 'react';

interface MatchInputProps {
    onMatch: (hash: string) => void;
}

export default function MatchInput({ onMatch }: MatchInputProps) {
    const [inputHash, setInputHash] = useState('');

    const extractHash = (text: string): string => {
        // 1. Try to extract from URL parameter 'host='
        const urlMatch = text.match(/[?&]host=([a-zA-Z0-9\-_]+)/);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1];
        }

        // 2. If it's a long block of text (like the invitation), try to find the hash
        // The hash is usually a long string of alphanumeric characters + '-' + '_'
        // We filter for strings longer than 10 chars to avoid common words
        const words = text.split(/[\s\n\r]+/);
        const potentialHashes = words.filter(w => /^[a-zA-Z0-9\-_]{10,}$/.test(w));

        // If we found potential hashes, return the last one (often the hash is at the end)
        // or the longest one.
        if (potentialHashes.length > 0) {
            // Prefer the one that is NOT a full URL (doesn't start with http)
            const nonUrlHashes = potentialHashes.filter(h => !h.startsWith('http'));
            if (nonUrlHashes.length > 0) {
                return nonUrlHashes[nonUrlHashes.length - 1];
            }
            return potentialHashes[potentialHashes.length - 1];
        }

        // 3. Fallback: return trimmed text
        return text.trim();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const rawInput = inputHash.trim();
        if (rawInput) {
            const extracted = extractHash(rawInput);
            onMatch(extracted);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        setInputHash(text);
        // Optional: auto-submit or just let user click? 
        // Let's just set the value and maybe highlight that we extracted something?
        // For now, just setting the raw text is fine, the extraction happens on submit.
        // Or better: extract immediately for better UX
        const extracted = extractHash(text);
        if (extracted !== text && extracted.length > 0) {
            setInputHash(extracted);
        } else {
            setInputHash(text);
        }
    };

    return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">输入对方的 Match Score</h2>
                <p className="text-gray-500 text-sm">粘贴邀请函、链接或直接输入 Hash 编码</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="hash-input" className="sr-only">
                        Match Score
                    </label>
                    <textarea
                        id="hash-input"
                        value={inputHash}
                        onChange={(e) => setInputHash(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="在此粘贴..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all min-h-[120px] text-sm font-mono resize-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    开始匹配分析
                </button>
            </form>
        </div>
    );
}
