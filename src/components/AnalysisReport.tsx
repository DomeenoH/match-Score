import React, { useState, useRef, useMemo } from 'react';
import type { AnalysisResult, ComparisonPoint } from '../lib/ai';
import { decodeSoul } from '../lib/codec';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import type { ScenarioType } from '../lib/questions';

// Theme configuration based on scenario type
const THEME_CONFIG: Record<ScenarioType, {
    primary: string;
    secondary: string;
    bgGradient: string;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    emoji: string;
    title: string;
}> = {
    couple: {
        primary: 'from-purple-600 to-pink-500',
        secondary: 'bg-gradient-to-br from-purple-50 to-pink-50',
        bgGradient: 'bg-gradient-to-br from-purple-100 via-pink-50 to-rose-100',
        borderColor: 'border-pink-200',
        textPrimary: 'text-purple-900',
        textSecondary: 'text-pink-600',
        emoji: '💕',
        title: '情侣契合度测试'
    },
    friend: {
        primary: 'from-blue-500 to-yellow-400',
        secondary: 'bg-gradient-to-br from-blue-50 to-yellow-50',
        bgGradient: 'bg-gradient-to-br from-blue-100 via-cyan-50 to-yellow-100',
        borderColor: 'border-blue-200',
        textPrimary: 'text-blue-900',
        textSecondary: 'text-yellow-600',
        emoji: '🤝',
        title: '朋友默契度测试'
    }
};

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
    const [showInviteCard, setShowInviteCard] = useState(false);
    const [generatingInvite, setGeneratingInvite] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    const inviteCardRef = useRef<HTMLDivElement>(null);

    // Decode guest hash to get scenario type
    const guestProfile = useMemo(() => {
        if (!guestHash) return null;
        try {
            return decodeSoul(guestHash);
        } catch {
            return null;
        }
    }, [guestHash]);

    const guestUserName = guestProfile?.name || nameB;
    const scenario: ScenarioType = guestProfile?.type || 'couple';
    const theme = THEME_CONFIG[scenario];
    const guestShareUrl = typeof window !== 'undefined' && guestHash
        ? `${window.location.origin}/match?host=${guestHash}`
        : '';

    // Check if we are in fallback mode
    const isFallback = rawText.includes('[系统提示：AI 服务暂时不可用');

    // Log raw text for debugging
    console.log('Analysis Report Raw Text:', rawText);

    // Robust parsing using Regex to find sections with new separators
    const extractSection = (text: string, sectionName: string) => {
        // Match content between ### Section Name ### and the next ### (or end of string)
        // The regex looks for:
        // 1. ### Section Name ### (allowing for loose whitespace)
        // 2. Captures everything until the next ### or end of text
        const pattern = `###\\s*${sectionName}\\s*###([\\s\\S]*?)(?:###|$)`;
        const regex = new RegExp(pattern, 'i');
        const match = text.match(regex);

        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback for old format (just in case) or partial matches
        // Try matching the line containing the section name
        const fallbackPattern = `(?:^|\\n)[^\\n]*${sectionName}.*([\\s\\S]*)`;
        const fallbackRegex = new RegExp(fallbackPattern, 'i');
        const fallbackMatch = text.match(fallbackRegex);

        if (fallbackMatch && fallbackMatch[1]) {
            // This is risky as it grabs everything till end, so we rely on the new format mostly.
            // For safety, let's just return null if strict match fails, or try to be smart?
            // Given we control the prompt now, let's stick to strict parsing but maybe allow "1. Section" style as legacy fallback?
            return null;
        }

        return null;
    };

    // Parsing logic based on new separators
    const conclusion = extractSection(rawText, "核心结论") || extractSection(rawText, "1.\\s*核心结论") || "暂无结论";
    const strengths = extractSection(rawText, "关键优势分析") || extractSection(rawText, "2.\\s*关键优势分析");
    const conflicts = extractSection(rawText, "潜在雷区预警") || extractSection(rawText, "3.\\s*潜在雷区预警");
    const advice = extractSection(rawText, "长期相处建议") || extractSection(rawText, "4.\\s*长期相处建议");

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

        // Wait a bit for any rendering to settle
        await new Promise(resolve => setTimeout(resolve, 100));

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
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate image:", error);
            alert(`生成图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleCopyHash = () => {
        if (guestHash) {
            const text = `【Match Score 邀请函】\n我是${guestUserName}，我已完成${theme.title}。点击下方链接，完成你的问卷，看看我们的相性如何：\n\n${guestShareUrl}\n\n或直接复制我的 Match Score 编码：\n${guestHash}`;
            navigator.clipboard.writeText(text).then(() => {
                setCopiedHash(true);
                setTimeout(() => setCopiedHash(false), 2000);
            });
        }
    };

    const handleSaveInviteCard = async () => {
        if (!inviteCardRef.current) return;
        setGeneratingInvite(true);

        // Wait a bit for any rendering to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(inviteCardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                logging: false,
                windowWidth: 600,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `MatchScore_Invite_${guestUserName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate invite image:", error);
            alert(`生成邀请卡失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setGeneratingInvite(false);
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
        <div ref={reportRef} data-report-container className="max-w-4xl mx-auto p-6 sm:p-10 bg-white border border-gray-200 rounded-2xl shadow-xl">
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

                {/* My Hash - Enhanced Invite Card */}
                <div className={`${theme.secondary} p-6 rounded-xl border ${theme.borderColor} text-center`}>
                    <h3 className={`font-bold ${theme.textPrimary} mb-2`}>我也要发起测试</h3>
                    <p className={`text-sm ${theme.textSecondary} mb-4`}>获取你的专属邀请卡，寻找其他共鸣</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowInviteCard(!showInviteCard)}
                            className={`flex-1 py-3 bg-gradient-to-r ${theme.primary} text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            {showInviteCard ? '收起邀请卡' : '生成邀请卡'}
                        </button>
                        <button
                            onClick={handleCopyHash}
                            className={`px-4 py-3 bg-white border ${theme.borderColor} ${theme.textPrimary} rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center`}
                        >
                            {copiedHash ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invite Card Modal/Section */}
            {showInviteCard && guestHash && (
                <div className="mt-8 space-y-4" data-html2canvas-ignore>
                    {/* The Invitation Card */}
                    <div
                        ref={inviteCardRef}
                        data-invite-card-container
                        className={`relative overflow-hidden rounded-3xl ${theme.bgGradient} p-8 shadow-2xl`}
                        style={{ minHeight: '480px' }}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

                        {/* Floating particles based on theme */}
                        {scenario === 'couple' && (
                            <>
                                <div className="absolute top-16 left-8 text-2xl animate-pulse">💕</div>
                                <div className="absolute top-24 right-10 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>💗</div>
                                <div className="absolute bottom-32 left-6 text-xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>
                            </>
                        )}
                        {scenario === 'friend' && (
                            <>
                                <div className="absolute top-16 left-8 text-2xl animate-pulse">⭐</div>
                                <div className="absolute top-24 right-10 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>🎯</div>
                                <div className="absolute bottom-32 left-6 text-xl animate-pulse" style={{ animationDelay: '1s' }}>🌟</div>
                            </>
                        )}

                        {/* Card Content */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="text-5xl mb-4">{theme.emoji}</div>
                            <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                                Match Score 邀请函
                            </h2>
                            <p className={`text-sm ${theme.textSecondary} font-medium mb-4`}>
                                {theme.title}
                            </p>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border ${theme.borderColor} mb-4`}>
                                <span className="text-gray-500 text-sm">发起人</span>
                                <span className={`font-bold ${theme.textPrimary}`}>{guestUserName}</span>
                            </div>

                            <p className={`text-sm ${theme.textPrimary} opacity-80 mb-6`}>
                                「邀请你进行一次灵魂深度的碰撞」
                            </p>

                            {/* QR Code */}
                            <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                                <QRCodeCanvas
                                    value={guestShareUrl}
                                    size={140}
                                    level="M"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#1a1a1a"
                                />
                            </div>

                            {/* Hash display */}
                            <div className={`w-full max-w-xs bg-white/50 backdrop-blur-sm rounded-xl p-3 border ${theme.borderColor}`}>
                                <p className="text-xs text-gray-500 mb-1">Match Score 编码</p>
                                <code className="block text-xs font-mono text-gray-600 break-all line-clamp-2">
                                    {guestHash.length > 40 ? `${guestHash.substring(0, 40)}...` : guestHash}
                                </code>
                            </div>

                            {/* Logo */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${theme.primary} flex items-center justify-center`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                    </svg>
                                </div>
                                <span className={`text-sm font-semibold ${theme.textPrimary}`}>Match Score</span>
                            </div>
                        </div>
                    </div>

                    {/* Save Card Button */}
                    <button
                        onClick={handleSaveInviteCard}
                        disabled={generatingInvite}
                        className={`w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r ${theme.primary} hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                    >
                        {generatingInvite ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                保存邀请卡到相册
                            </>
                        )}
                    </button>
                </div>
            )}

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
