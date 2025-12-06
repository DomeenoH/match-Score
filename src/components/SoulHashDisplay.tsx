import React, { useState, useMemo, useRef } from 'react';
import { decodeSoul } from '../lib/codec';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import type { ScenarioType } from '../lib/questions';

interface SoulHashDisplayProps {
    hash: string;
}

// Theme configuration based on scenario type
const THEME_CONFIG: Record<ScenarioType, {
    primary: string;
    secondary: string;
    accent: string;
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
        accent: 'text-purple-600',
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
        accent: 'text-blue-600',
        bgGradient: 'bg-gradient-to-br from-blue-100 via-cyan-50 to-yellow-100',
        borderColor: 'border-blue-200',
        textPrimary: 'text-blue-900',
        textSecondary: 'text-yellow-600',
        emoji: '🤝',
        title: '朋友默契度测试'
    }
};

export default function SoulHashDisplay({ hash }: SoulHashDisplayProps) {
    const [copied, setCopied] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Decode hash to extract user's profile
    const userProfile = useMemo(() => {
        try {
            return decodeSoul(hash);
        } catch {
            return null;
        }
    }, [hash]);

    const userName = userProfile?.name || '神秘用户';
    const scenario: ScenarioType = userProfile?.type || 'couple';
    const theme = THEME_CONFIG[scenario];

    // Construct the full URL for QR code
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/match?host=${hash}`
        : `/match?host=${hash}`;

    // Personalized invitation text with fallback
    const invitationText = `【Match Score 邀请函】我是${userName}，我已完成${theme.title}。点击下方链接，完成你的问卷，看看我们的相性如何：

${shareUrl}

或直接复制我的 Match Score 编码（如果链接失效）：
${hash}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(invitationText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSaveCard = async () => {
        if (!cardRef.current) return;
        setGeneratingImage(true);

        // Wait a bit for any rendering to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null, // Transparent to pick up gradient
                logging: false, // Disable logging for production
                windowWidth: 600,
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `MatchScore_Invite_${userName}.png`;
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

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Match Score 邀请函',
                text: invitationText,
                url: shareUrl,
            }).then(() => {
                console.log('Shared successfully');
            }).catch((error) => {
                console.error('Error sharing:', error);
                navigator.clipboard.writeText(invitationText).then(() => {
                    alert('邀请函已复制到剪贴板！');
                }).catch(err => {
                    console.error('Failed to copy invitation text: ', err);
                });
            });
        } else {
            navigator.clipboard.writeText(invitationText).then(() => {
                alert('邀请函已复制到剪贴板！');
            }).catch(err => {
                console.error('Failed to copy invitation text: ', err);
            });
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-8 p-4">
            {/* Invitation Card - This is what gets captured as image */}
            <div
                ref={cardRef}
                data-card-container
                className={`relative overflow-hidden rounded-3xl ${theme.bgGradient} p-8 shadow-2xl`}
                style={{ minHeight: '520px' }}
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
                    {/* Header */}
                    <div className={`text-5xl mb-4`}>{theme.emoji}</div>
                    <h1 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                        Match Score 邀请函
                    </h1>
                    <p className={`text-sm ${theme.textSecondary} font-medium mb-6`}>
                        {theme.title}
                    </p>

                    {/* User Info */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border ${theme.borderColor} mb-4`}>
                        <span className="text-gray-500 text-sm">发起人</span>
                        <span className={`font-bold ${theme.textPrimary}`}>{userName}</span>
                    </div>

                    {/* Invitation Text */}
                    <p className={`text-sm ${theme.textPrimary} opacity-80 mb-6 max-w-[280px]`}>
                        「邀请你进行一次灵魂深度的碰撞」
                    </p>

                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
                        <QRCodeCanvas
                            value={shareUrl}
                            size={160}
                            level="M"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#1a1a1a"
                        />
                    </div>

                    {/* Hash display */}
                    <div className={`w-full bg-white/50 backdrop-blur-sm rounded-xl p-3 border ${theme.borderColor}`}>
                        <p className="text-xs text-gray-500 mb-1">Match Score 编码</p>
                        <code className="block text-xs font-mono text-gray-600 break-all line-clamp-2">
                            {hash.length > 50 ? `${hash.substring(0, 50)}...` : hash}
                        </code>
                    </div>

                    {/* Logo / Footer */}
                    <div className="mt-6 flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${theme.primary} flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                        </div>
                        <span className={`text-sm font-semibold ${theme.textPrimary}`}>Match Score</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
                <button
                    onClick={handleSaveCard}
                    disabled={generatingImage}
                    className={`w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r ${theme.primary} hover:opacity-90 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                >
                    {generatingImage ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            生成中...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            保存邀请卡
                        </>
                    )}
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleShare}
                        className="py-3 px-4 rounded-xl font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        分享
                    </button>
                    <button
                        onClick={handleCopy}
                        className="py-3 px-4 rounded-xl font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                已复制
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                复制链接
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Hash Fallback Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 mb-2 text-center">如二维码失效，可复制编码手动匹配</p>
                <div className="flex items-center gap-2">
                    <code className="flex-1 block p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono break-all text-gray-500 max-h-16 overflow-y-auto">
                        {hash}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        {copied ? '✓' : '复制'}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="text-center">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    返回首页
                </a>
            </div>
        </div>
    );
}
