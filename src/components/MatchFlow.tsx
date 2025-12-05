import React, { useState, useEffect } from 'react';
import MatchInput from './MatchInput';
import Questionnaire from './Questionnaire';
import AnalysisReport from './AnalysisReport';
import { decodeSoul } from '../lib/codec';
import { fetchAIAnalysis, type AnalysisResult, calculateDistance, type AIConfig } from '../lib/ai';

export default function MatchFlow() {
    const [hostHash, setHostHash] = useState<string | null>(null);
    const [myHash, setMyHash] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiConfig, setAiConfig] = useState<AIConfig>({
        endpoint: '',
        apiKey: '',
        model: ''
    });
    const [showSettings, setShowSettings] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleMatchStart = (hash: string) => {
        console.log("Match started with hash:", hash);
        setHostHash(hash);
        const url = new URL(window.location.href);
        url.searchParams.set('host', hash);
        window.history.pushState({}, '', url);

        // Auto-start analysis if local user exists
        const localHash = localStorage.getItem('soul_hash');
        if (localHash) {
            const profile = decodeSoul(localHash);
            if (profile) {
                setMyHash(localHash);
                runAnalysis(hash, localHash);
            }
        }
    };

    useEffect(() => {
        const savedConfig = localStorage.getItem('soul_match_ai_config');
        if (savedConfig) {
            try {
                setAiConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error("Failed to parse saved config", e);
            }
        }
    }, []);

    const handleSaveConfig = (newConfig: AIConfig) => {
        setAiConfig(newConfig);
        localStorage.setItem('soul_match_ai_config', JSON.stringify(newConfig));
        setShowSettings(false);
    };

    const runAnalysis = async (hHash: string, mHash: string) => {
        setLoading(true);
        setError(null);
        setRetryCount(0);

        try {
            const hostProfile = decodeSoul(hHash);
            const myProfile = decodeSoul(mHash);

            if (hostProfile && myProfile) {
                const result = await fetchAIAnalysis(
                    hostProfile,
                    myProfile,
                    (count) => setRetryCount(count),
                    (partialText) => {
                        setAnalysis({
                            compatibilityScore: calculateDistance(hostProfile, myProfile),
                            summary: "正在生成分析报告...",
                            details: partialText
                        });
                    },
                    aiConfig // Pass user config
                );
                setAnalysis(result);
            } else {
                setError("解析灵魂档案失败，请重试。");
            }
        } catch (e) {
            console.error(e);
            setError("分析过程中发生错误，请稍后重试。");
        } finally {
            setLoading(false);
            setRetryCount(0);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hParam = params.get('host');
        const gParam = params.get('guest');

        if (hParam) {
            setHostHash(hParam);
        }

        // Check for local hash if not in URL
        const localHash = localStorage.getItem('soul_hash');

        if (hParam && gParam) {
            setMyHash(gParam);
            runAnalysis(hParam, gParam);
        } else if (hParam && localHash) {
            // If we have host param AND a local hash, use local hash as guest
            // Verify it's valid first
            const profile = decodeSoul(localHash);
            if (profile) {
                setMyHash(localHash);
                runAnalysis(hParam, localHash);
            }
        }
    }, [aiConfig]); // Re-run if config changes? Maybe not, but initial load needs config. 
    // Actually, config is loaded in another useEffect. We should probably merge them or ensure config is ready.
    // But config has default values, so it's fine.

    const handleQuestionnaireComplete = async (newMyHash: string) => {
        setMyHash(newMyHash);
        if (hostHash) {
            runAnalysis(hostHash, newMyHash);
        }
    };

    // Settings Modal Component
    const SettingsModal = () => {
        const [tempConfig, setTempConfig] = useState(aiConfig);

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-xl font-bold mb-4">AI 模型设置</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                自定义 Endpoint (可选)
                            </label>
                            <input
                                type="text"
                                value={tempConfig.endpoint || ''}
                                onChange={e => setTempConfig({ ...tempConfig, endpoint: e.target.value })}
                                placeholder="https://api.openai.com/v1/chat/completions"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">留空则使用默认服务</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                API Key (可选)
                            </label>
                            <input
                                type="password"
                                value={tempConfig.apiKey || ''}
                                onChange={e => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                模型名称 (可选)
                            </label>
                            <input
                                type="text"
                                value={tempConfig.model || ''}
                                onChange={e => setTempConfig({ ...tempConfig, model: e.target.value })}
                                placeholder="gemini-2.5-flash-lite"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => handleSaveConfig(tempConfig)}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900">正在进行灵魂共鸣分析...</h3>
                <p className="text-gray-500 mt-2">AI 正在对比你们的 50 个维度数据</p>
                {retryCount > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm animate-pulse border border-yellow-200">
                        AI 服务连接不稳定，正在进行第 {retryCount} 次重试...
                    </div>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <h3 className="text-lg font-bold text-red-800 mb-2">出错了</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => window.location.href = '/match'}
                    className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                >
                    返回重试
                </button>
                {/* Allow settings access even on error */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="mt-4 text-sm text-gray-500 underline hover:text-gray-700"
                >
                    检查 AI 设置
                </button>
                {showSettings && <SettingsModal />}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Settings Button */}
            <button
                onClick={() => setShowSettings(true)}
                className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                title="AI 设置"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            </button>

            {showSettings && <SettingsModal />}

            {analysis ? (
                <AnalysisReport
                    result={analysis}
                    hostName={hostHash ? decodeSoul(hostHash)?.name : undefined}
                    guestName={myHash ? decodeSoul(myHash)?.name : undefined}
                    hostHash={hostHash || undefined}
                    guestHash={myHash || undefined}
                    comparisonMatrix={analysis.comparisonMatrix}
                />
            ) : hostHash ? (
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 text-center bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-mono mb-3">
                            匹配模式
                        </span>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {hostHash ? decodeSoul(hostHash)?.name : '对方'} 已就位，请完成你的灵魂档案
                        </h2>
                        <p className="text-gray-500 text-sm font-mono break-all mb-4">目标编码: {hostHash}</p>

                        {/* Direct Hash Input for Self */}
                        <div className="text-sm text-gray-500">
                            已有自己的 Soul Hash？
                            <button
                                onClick={() => {
                                    const hash = prompt("请输入你的 Soul Hash:");
                                    if (hash) {
                                        const profile = decodeSoul(hash);
                                        if (profile) {
                                            localStorage.setItem('soul_hash', hash);
                                            setMyHash(hash);
                                            if (hostHash) {
                                                runAnalysis(hostHash, hash);
                                            }
                                        } else {
                                            alert("无效的 Hash");
                                        }
                                    }
                                }}
                                className="text-black font-bold underline hover:text-gray-700 ml-1"
                            >
                                直接导入
                            </button>
                        </div>
                    </div>
                    <Questionnaire onComplete={handleQuestionnaireComplete} />
                </div>
            ) : (
                <MatchInput onMatch={handleMatchStart} />
            )}
        </div>
    );
}
