import React, { useState, useRef } from 'react';
import type { AnalysisResult, ComparisonPoint } from '../lib/ai';
import html2canvas from 'html2canvas';

interface AnalysisReportProps {
    result: AnalysisResult;
    hostName?: string;
    guestName?: string;
    hostHash?: string;
    guestHash?: string;
    comparisonMatrix?: ComparisonPoint[];
}

export default function AnalysisReport({ result, hostName, guestName, hostHash, guestHash, comparisonMatrix }: AnalysisReportProps) {
    const rawText = result.details;
    const nameA = hostName || 'A';
    const nameB = guestName || 'B';
    const [copiedHash, setCopiedHash] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Check if we are in fallback mode
    const isFallback = rawText.includes('[系统提示：AI 服务暂时不可用');

    // Log raw text for debugging
    console.log('Analysis Report Raw Text:', rawText);

    // Robust parsing using Regex to find sections regardless of formatting (markdown, numbering, etc.)
    const extractSection = (text: string, keyword: string, nextKeyword?: string) => {
        const pattern = '(?:^|\\n)[^\\n]*' + keyword + '.*(?:\\n|$)';
        const keywordRegex = new RegExp(pattern, 'i');

        const match = text.match(keywordRegex);
        if (!match) return null;

        const startIndex = match.index! + match[0].length;

        let endIndex = text.length;
        if (nextKeyword) {
            const remainingText = text.slice(startIndex);
            const nextPattern = '(?:^|\\n)[#*\\s]*\\d*[\\.\\、]?\\s*' + nextKeyword;
            const nextKeywordRegex = new RegExp(nextPattern, 'i');
            const nextMatch = remainingText.match(nextKeywordRegex);
            if (nextMatch) {
                endIndex = startIndex + nextMatch.index!;
            }
        }

        let content = text.slice(startIndex, endIndex).trim();
        return content.replace(/^[-—]+/, '').replace(/[-—]+$/, '').trim();
    };

    // Parsing logic based on keywords
    const conclusion = extractSection(rawText, "核心结论", "关键优势") || "暂无结论";
    const strengths = extractSection(rawText, "关键优势", "潜在雷区");
    const conflicts = extractSection(rawText, "潜在雷区", "长期相处");
    const advice = extractSection(rawText, "长期相处");

    // Helper to render text with bold markdown support and name highlighting
    const formatText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={`bold-${index}`} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }

            if (!part) return null;

            const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = `(${escapeRegExp(nameA)}|${escapeRegExp(nameB)})`;
            const nameRegex = new RegExp(pattern, 'g');

            const subParts = part.split(nameRegex);

            return (
                <span key={`text-${index}`}>
                    {subParts.map((subPart, subIndex) => {
                        if (subPart === nameA) {
                            return (
                                <span
                                    key={`nameA-${subIndex}`}
                                    className="inline-block px-1.5 rounded bg-indigo-50 text-indigo-800 font-semibold border border-indigo-100 mx-0.5 transform hover:scale-105 transition-transform cursor-default"
                                >
                                    {subPart}
                                </span>
                            );
                        }
                        if (subPart === nameB) {
                            return (
                                <span
                                    key={`nameB-${subIndex}`}
                                    className="inline-block px-1.5 rounded bg-rose-50 text-rose-800 font-semibold border border-rose-100 mx-0.5 transform hover:scale-105 transition-transform cursor-default"
                                >
                                    {subPart}
                                </span>
                            );
                        }
                        return subPart;
                    })}
                </span>
            );
        });
    };

    // Helper to render bullet points
    const renderList = (text: string | null) => {
        if (!text) return <p className="text-gray-500 italic">暂无显著数据</p>;
        return (
            <ul className="space-y-3">
                {text.split('\n').map((line, i) => {
                    const cleanLine = line.trim();
                    if (!cleanLine || cleanLine.startsWith('---')) return null;
                    const content = cleanLine.replace(/^[*•-]\s*/, '').replace(/^\d+[\.\、]\s*/, '');
                    return (
                        <li key={i} className="flex items-start">
                            <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60"></span>
                            <span className="text-sm leading-relaxed">{formatText(content)}</span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    const handleShareImage = async () => {
        if (!reportRef.current) return;
        setGeneratingImage(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1200, // Force desktop width for better layout
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `MatchScore_${nameA}_${nameB}.png`;
            link.click();
        } catch (error) {
            console.error("Failed to generate image:", error);
            alert("生成图片失败，请重试");
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleCopyHash = () => {
        if (guestHash) {
            const text = `【Match Score 邀请函】\n朋友，我已完成我的灵魂契合度测试。点击下方链接，完成你的问卷，看看我们的相性如何：\n\n${window.location.origin}/match?host=${guestHash}\n\n或直接复制我的 Match Score 编码：\n${guestHash}`;
            navigator.clipboard.writeText(text).then(() => {
                setCopiedHash(true);
                setTimeout(() => setCopiedHash(false), 2000);
            });
        }
    };

    // Visual Fallback Component
    const VisualFallback = () => {
        if (!comparisonMatrix) return <p>暂无详细数据</p>;

        // Group by dimension
        const grouped = comparisonMatrix.reduce((acc, curr) => {
            if (!acc[curr.dimension]) acc[curr.dimension] = [];
            acc[curr.dimension].push(curr);
            return acc;
        }, {} as Record<string, ComparisonPoint[]>);

        const dimensionNames: Record<string, string> = {
            lifestyle: '生活习惯',
            finance: '金钱财务',
            communication: '沟通情感',
            intimacy: '亲密家庭',
            values: '核心价值'
        };

        return (
            <div className="space-y-8">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm mb-6">
                    <p className="font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        AI 服务连接超时
                    </p>
                    <p className="mt-1">已为您切换至“可视化数据模式”，直接展示双方的答题差异。</p>
                </div>

                {Object.entries(grouped).map(([dim, items]) => (
                    <div key={dim} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-gray-700">
                            {dimensionNames[dim] || dim}
                        </div>
                        <div className="divide-y divide-gray-50">
                            {items.map(item => (
                                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="text-sm font-medium text-gray-900 mb-2">{item.question}</div>
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <div className={`flex-1 p-2 rounded ${item.difference === 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                                            <span className="font-bold mr-1">{nameA}:</span> {item.A_label}
                                        </div>
                                        <div className="mx-2 font-mono font-bold text-gray-300">VS</div>
                                        <div className={`flex-1 p-2 rounded ${item.difference === 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                                            <span className="font-bold mr-1">{nameB}:</span> {item.B_label}
                                        </div>
                                    </div>
                                    {item.difference >= 3 && (
                                        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                            差异显著，建议沟通
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div ref={reportRef} className="max-w-4xl mx-auto p-6 sm:p-10 bg-white border border-gray-200 rounded-2xl shadow-xl">
            <div className="text-center mb-10">
                <div className="inline-block p-3 rounded-full bg-black text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {nameA} & {nameB} 的灵魂共鸣分析
                </h2>
                <p className="text-gray-500 font-mono text-sm tracking-wider uppercase">AI 驱动的深度契合度报告</p>
            </div>

            {/* Score Circle */}
            <div className="flex justify-center mb-12">
                <div className="relative w-40 h-40">
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black tracking-tighter">{result.compatibilityScore}%</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">契合度</span>
                    </div>
                </div>
            </div>

            {isFallback ? (
                <VisualFallback />
            ) : (
                <div className="space-y-8">
                    {/* Core Conclusion */}
                    <div className="bg-gray-900 text-white p-8 rounded-xl shadow-lg transform hover:scale-[1.01] transition-transform">
                        <h3 className="text-lg font-bold mb-3 flex items-center">
                            <span className="mr-2">💡</span> 核心结论
                        </h3>
                        <p className="text-lg leading-relaxed font-medium opacity-90">
                            {formatText(conclusion)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <h3 className="text-green-800 font-bold mb-4 flex items-center">
                                <span className="bg-green-200 text-green-800 p-1 rounded mr-2 text-xs">契合点</span>
                                关键优势
                            </h3>
                            <div className="text-green-900">
                                {renderList(strengths)}
                            </div>
                        </div>

                        {/* Conflicts */}
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <h3 className="text-red-800 font-bold mb-4 flex items-center">
                                <span className="bg-red-200 text-red-800 p-1 rounded mr-2 text-xs">冲突点</span>
                                潜在雷区
                            </h3>
                            <div className="text-red-900">
                                {renderList(conflicts)}
                            </div>
                        </div>
                    </div>

                    {/* Advice */}
                    <div className="bg-blue-50 p-8 rounded-xl border border-blue-100">
                        <h3 className="text-blue-900 font-bold mb-4">🔮 长期相处建议</h3>
                        <div className="text-blue-800 leading-relaxed">
                            {renderList(advice)}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Actions */}
            <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6" data-html2canvas-ignore>
                {/* Share Image */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">分享这份报告</h3>
                    <p className="text-sm text-gray-500 mb-4">生成长图分享给朋友</p>
                    <button
                        onClick={handleShareImage}
                        disabled={generatingImage}
                        className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingImage ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                生成中...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                保存为图片
                            </>
                        )}
                    </button>
                </div>

                {/* My Hash */}
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center">
                    <h3 className="font-bold text-indigo-900 mb-2">我也要发起测试</h3>
                    <p className="text-sm text-indigo-600 mb-4">获取你的专属邀请函，寻找其他共鸣</p>
                    <button
                        onClick={handleCopyHash}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {copiedHash ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                已复制邀请函
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                复制我的邀请函
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-8 text-center" data-html2canvas-ignore>
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors"
                >
                    返回首页
                </button>
            </div>
        </div>
    );
}
