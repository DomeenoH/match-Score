import React from 'react';
import type { AnalysisResult } from '../lib/ai';

interface AnalysisReportProps {
    result: AnalysisResult;
    hostInfo?: string;
    guestInfo?: string;
}

export default function AnalysisReport({ result, hostInfo, guestInfo }: AnalysisReportProps) {
    // Simple parser to extract sections from the mock AI response
    // The mock response structure is:
    // [System: ...]
    // ... prompt content ...
    // 1. 核心结论 ...
    // 2. 关键优势分析 ...
    // 3. 潜在雷区预警 ...
    // 4. 长期相处建议 ...

    const parseSection = (text: string, title: string, nextTitle?: string) => {
        const startIndex = text.indexOf(title);
        if (startIndex === -1) return null;

        let content = "";
        if (nextTitle) {
            const endIndex = text.indexOf(nextTitle);
            if (endIndex !== -1) {
                content = text.substring(startIndex + title.length, endIndex).trim();
            } else {
                content = text.substring(startIndex + title.length).trim();
            }
        } else {
            content = text.substring(startIndex + title.length).trim();
        }

        // Clean up leading colons or newlines
        return content.replace(/^[:：\n]+/, '').trim();
    };

    // Since we are currently using a mock response that contains the PROMPT, 
    // we need to simulate the "Response" part. 
    // In a real app, 'result.details' would be the AI's output.
    // For this demo, let's extract the "comparison points" from the prompt text 
    // which are embedded in the mock details.

    // However, the prompt text itself has sections like:
    // --- 优势维度 ... ---
    // --- 核心雷区 ... ---

    const rawText = result.details;

    const strengthsSection = parseSection(rawText, "--- 优势维度（Difference <= 1）：两人天然契合点 ---", "--- 核心雷区");
    const conflictsSection = parseSection(rawText, "--- 核心雷区（Difference >= 3）：未来潜在的冲突爆发点 ---", "--- 维度总结");

    // Helper to render bullet points
    const renderList = (text: string | null) => {
        if (!text) return <p className="text-gray-500 italic">暂无显著数据</p>;
        return (
            <ul className="space-y-3">
                {text.split('\n').map((line, i) => {
                    const cleanLine = line.trim();
                    if (!cleanLine || cleanLine.startsWith('---')) return null;
                    return (
                        <li key={i} className="flex items-start">
                            <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60"></span>
                            <span className="text-sm leading-relaxed">{cleanLine.replace(/^- /, '')}</span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-white border border-gray-200 rounded-2xl shadow-xl">
            {/* Header Info */}
            <div className="flex justify-between items-center mb-8 text-xs font-mono text-gray-400 border-b border-gray-100 pb-4">
                <div>HOST: {hostInfo || 'Unknown'}</div>
                <div>GUEST: {guestInfo || 'Unknown'}</div>
            </div>

            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">灵魂契合度分析报告</h2>
                <p className="text-gray-500 text-sm">基于 50 维度深度比对算法</p>

                <div className="flex items-center justify-center gap-4 mt-8 relative">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#f3f4f6"
                                strokeWidth="12"
                                fill="transparent"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * result.compatibilityScore) / 100}
                                className="text-black transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-black tracking-tighter">{result.compatibilityScore}%</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Match</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Core Conclusion (Mocked for now as we don't have real AI output yet) */}
                <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg transform hover:scale-[1.01] transition-transform">
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                        <span className="mr-2">💡</span> 核心结论
                    </h3>
                    <p className="text-lg leading-relaxed font-medium opacity-90">
                        {result.summary}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                        <h3 className="text-green-800 font-bold mb-4 flex items-center">
                            <span className="bg-green-200 text-green-800 p-1 rounded mr-2 text-xs">MATCH</span>
                            关键优势
                        </h3>
                        <div className="text-green-900">
                            {renderList(strengthsSection)}
                        </div>
                    </div>

                    {/* Conflicts */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h3 className="text-red-800 font-bold mb-4 flex items-center">
                            <span className="bg-red-200 text-red-800 p-1 rounded mr-2 text-xs">CONFLICT</span>
                            潜在雷区
                        </h3>
                        <div className="text-red-900">
                            {renderList(conflictsSection)}
                        </div>
                    </div>
                </div>

                {/* Advice (Placeholder for real AI output) */}
                <div className="bg-blue-50 p-8 rounded-xl border border-blue-100">
                    <h3 className="text-blue-900 font-bold mb-4">🔮 长期相处建议</h3>
                    <p className="text-blue-800 leading-relaxed">
                        (此处将显示 AI 生成的详细建议。当前为演示模式，展示的是 Prompt 中的原始数据结构。)
                        <br /><br />
                        {/* Just showing raw details for debugging/demo purposes if needed, or hide it */}
                        <span className="text-xs opacity-50 font-mono block mt-4 border-t border-blue-200 pt-4">
                            Debug Info: Raw Prompt Data Available
                        </span>
                    </p>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-3 bg-white border-2 border-black text-black font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                    返回首页
                </button>
            </div>
        </div>
    );
}
