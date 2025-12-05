import React, { useState, useMemo } from 'react';
import { QUESTIONS, type SoulProfile, type Dimension, type ScenarioType, getQuestionsForScenario, getDimensionDetailsForScenario } from '../lib/questions';
import { encodeSoul } from '../lib/codec';

interface QuestionnaireProps {
    onComplete: (hash: string) => void;
    scenario?: ScenarioType;
}

export default function Questionnaire({ onComplete, scenario = 'couple' }: QuestionnaireProps) {
    // Get questions and dimension details based on scenario
    const questions = useMemo(() => getQuestionsForScenario(scenario), [scenario]);
    const dimensionDetails = useMemo(() => getDimensionDetailsForScenario(scenario), [scenario]);

    // Dynamically determine dimension order based on available questions
    const dimensionOrder = useMemo(() => {
        const dims = new Set(questions.map(q => q.dimension));
        // Maintain preferred order where possible
        const preferredOrder: Dimension[] = ['lifestyle', 'finance', 'communication', 'intimacy', 'values'];
        return preferredOrder.filter(d => dims.has(d));
    }, [questions]);

    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(0));
    const [currentDimIndex, setCurrentDimIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [showNameInput, setShowNameInput] = useState(true);

    const handleNameSubmit = () => {
        if (name.trim()) {
            setShowNameInput(false);
        }
    };

    const currentDimension = dimensionOrder[currentDimIndex];
    const currentQuestions = useMemo(() =>
        questions.filter(q => q.dimension === currentDimension),
        [currentDimension, questions]
    );

    const handleOptionSelect = (questionId: number, value: number) => {
        const index = questions.findIndex(q => q.id === questionId);
        if (index === -1) return;

        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
        if (error) setError(null);
    };

    const validateCurrentStep = () => {
        const unansweredInStep = currentQuestions.filter(q => {
            const index = questions.findIndex(globalQ => globalQ.id === q.id);
            return answers[index] === 0;
        });

        if (unansweredInStep.length > 0) {
            setError(`本页还有 ${unansweredInStep.length} 道题未完成，请回答所有问题后再继续。`);
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentDimIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        setCurrentDimIndex(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = () => {
        if (validateCurrentStep()) {
            if (answers.some(a => a === 0)) {
                setError("还有未完成的题目，请检查。");
                return;
            }

            const profile: Omit<SoulProfile, 'timestamp'> = {
                version: 1,
                answers: answers,
                name: name.trim() || '神秘人',
                type: scenario // Include scenario type in the profile
            };
            const hash = encodeSoul(profile);
            onComplete(hash);
        }
    };

    // Determine title based on scenario
    const testTitle = scenario === 'friend' ? '朋友默契度测试' : '灵魂契合度测试';
    const submitButtonText = scenario === 'friend' ? '生成我的默契密码' : '生成我的灵魂哈希';

    if (showNameInput) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-6">首先，请留下你的名字</h2>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="你的昵称"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 text-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                />
                <button
                    onClick={handleNameSubmit}
                    disabled={!name.trim()}
                    className="w-full py-3 bg-black text-white rounded-lg font-bold text-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
                >
                    开始测试
                </button>
            </div>
        );
    }

    const progress = Math.round((answers.filter(a => a !== 0).length / questions.length) * 100);

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Sticky Header Group */}
            <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm -mx-6 px-6 pt-4 pb-6 shadow-sm mb-8 border-b border-gray-100 transition-all duration-300">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{testTitle}</h2>
                        <span className="text-sm font-mono text-gray-500">{progress}% 完成</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className="bg-black h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Current Section Info */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {dimensionDetails[currentDimension]?.title || currentDimension}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {dimensionDetails[currentDimension]?.description || ''}
                    </p>
                </div>
            </div>

            {/* Questions List */}
            <div key={currentDimIndex} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
                {currentQuestions.map((question) => {
                    const globalIndex = questions.findIndex(q => q.id === question.id);
                    return (
                        <div key={question.id} className="border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                            <h4 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
                                <span className="text-gray-300 font-mono mr-3 text-sm">#{question.id}</span>
                                {question.text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
                                    part.startsWith('**') && part.endsWith('**')
                                        ? <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
                                        : part
                                )}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                {question.options.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`
                                            relative flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-200 text-center h-full
                                            ${answers[globalIndex] === option.value
                                                ? 'bg-black text-white border-black shadow-lg transform scale-[1.02]'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={option.value}
                                            checked={answers[globalIndex] === option.value}
                                            onChange={() => handleOptionSelect(question.id, option.value)}
                                            className="hidden"
                                        />
                                        <span className="text-sm font-medium">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg text-center font-medium border border-red-100 animate-pulse">
                    ⚠️ {error}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex justify-between gap-4 pt-6 border-t border-gray-100">
                <button
                    onClick={handlePrev}
                    disabled={currentDimIndex === 0}
                    className={`
                        px-8 py-3 rounded-lg font-medium transition-colors
                        ${currentDimIndex === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }
                    `}
                >
                    上一步
                </button>

                {currentDimIndex < dimensionOrder.length - 1 ? (
                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none"
                    >
                        下一步
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none"
                    >
                        {submitButtonText}
                    </button>
                )}
            </div>
        </div>
    );
}
