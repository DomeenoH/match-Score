import React, { useState } from 'react';

interface SoulHashDisplayProps {
    hash: string;
}

export default function SoulHashDisplay({ hash }: SoulHashDisplayProps) {
    const [copied, setCopied] = useState(false);

    // Construct the full URL
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/match?host=${hash}`
        : `/match?host=${hash}`;

    const invitationText = `【Match Score 邀请函】
朋友，我已完成我的灵魂契合度测试。点击下方链接，完成你的问卷，看看我们的相性如何：

${shareUrl}

或直接复制我的 Match Score 编码（如果链接失效）：
${hash}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(invitationText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
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
                // Fallback to copying if share fails or is not available
                navigator.clipboard.writeText(invitationText).then(() => {
                    alert('邀请函已复制到剪贴板！');
                }).catch(err => {
                    console.error('Failed to copy invitation text: ', err);
                });
            });
        } else {
            // Fallback for browsers that do not support Web Share API
            navigator.clipboard.writeText(invitationText).then(() => {
                alert('邀请函已复制到剪贴板！');
            }).catch(err => {
                console.error('Failed to copy invitation text: ', err);
            });
        }
    };

    return (
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
                <p className="text-sm text-gray-500 mb-2 font-mono">或直接复制我的 Match Score 编码（如果链接失效）：</p>
                <div className="flex items-center gap-2">
                    <code className="flex-1 block p-3 bg-white border border-gray-300 rounded text-xs font-mono break-all text-gray-600 max-h-20 overflow-y-auto">
                        {hash}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        {copied ? '已复制' : '复制'}
                    </button>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">你的 Match Score 已生成</h2>
                <p className="text-gray-500 mb-6">快去寻找那个和你灵魂共鸣的人吧</p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-transform hover:scale-105 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        分享给朋友
                    </button>
                    <a
                        href="/match"
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black border border-gray-200 rounded-full font-bold hover:bg-gray-50 transition-transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                        返回首页
                    </a>
                </div>
                <p className="mt-4 text-xs text-gray-400">
                    包含：测试链接 + Match Score 编码
                </p>
            </div>
        </div>
    );
}
