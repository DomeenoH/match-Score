import React, { useState, useEffect } from 'react';
import MatchInput from './MatchInput';
import Questionnaire from './Questionnaire';
import AnalysisReport from './AnalysisReport';
import { decodeSoul } from '../lib/codec';
import { fetchAIAnalysis, type AnalysisResult } from '../lib/ai';

export default function MatchFlow() {
    const [hostHash, setHostHash] = useState<string | null>(null);
    const [myHash, setMyHash] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const host = params.get('host');
        if (host) {
            // Validate host hash immediately
            const profile = decodeSoul(host);
            if (profile) {
                setHostHash(host);
            } else {
                setError("无效的邀请链接或 Soul Hash 已损坏。");
            }
        }
    }, []);

    const handleMatchStart = (hash: string) => {
        const profile = decodeSoul(hash);
        if (profile) {
            setHostHash(hash);
            window.history.pushState({}, '', `/match?host=${hash}`);
            setError(null);
        } else {
            setError("无效的 Soul Hash，请检查后重试。");
        }
    };

    const handleQuestionnaireComplete = async (myHash: string) => {
        setMyHash(myHash);
        setLoading(true);
        setError(null);

        try {
            if (hostHash) {
                const hostProfile = decodeSoul(hostHash);
                const myProfile = decodeSoul(myHash);

                if (hostProfile && myProfile) {
                    const result = await fetchAIAnalysis(hostProfile, myProfile);
                    setAnalysis(result);
                } else {
                    setError("解析 Soul Profile 失败，请重试。");
                }
            }
        } catch (e) {
            console.error(e);
            setError("分析过程中发生错误，请稍后重试。");
        } finally {
            setLoading(false);
        }
    };

    if (analysis) {
        return (
            <AnalysisReport
                result={analysis}
                hostInfo={hostHash ? hostHash.substring(0, 8) + '...' : undefined}
                guestInfo={myHash ? myHash.substring(0, 8) + '...' : undefined}
            />
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900">正在进行灵魂共鸣分析...</h3>
                <p className="text-gray-500 mt-2">AI 正在对比你们的 50 个维度数据</p>
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
            </div>
        );
    }

    if (hostHash) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-mono mb-3">
                        MATCHING MODE
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">对方已就位，请完成你的 Soul Profile</h2>
                    <p className="text-gray-500 text-sm font-mono">Target Hash: {hostHash.substring(0, 12)}...</p>
                </div>
                <Questionnaire onComplete={handleQuestionnaireComplete} />
            </div>
        );
    }

    return <MatchInput onMatch={handleMatchStart} />;
}
