import React, { useState, useEffect } from 'react';
import Questionnaire from './Questionnaire';
import SoulHashDisplay from './SoulHashDisplay';
import type { ScenarioType } from '../lib/questions';

export default function CreateFlow() {
    const [hash, setHash] = useState<string | null>(null);
    const [scenario, setScenario] = useState<ScenarioType>('couple');

    useEffect(() => {
        // Check URL for hash and mode
        const params = new URLSearchParams(window.location.search);
        const urlHash = params.get('hash');
        const mode = params.get('mode') as ScenarioType | null;

        if (urlHash) {
            setHash(urlHash);
        }
        if (mode === 'friend' || mode === 'couple') {
            setScenario(mode);
        }
    }, []);

    const handleComplete = (newHash: string) => {
        setHash(newHash);
        // Preserve the mode in URL if it was friend
        const modeParam = scenario === 'friend' ? '&mode=friend' : '';
        window.history.pushState({}, '', `/create?hash=${newHash}${modeParam}`);
    };

    if (hash) {
        return <SoulHashDisplay hash={hash} />;
    }

    return <Questionnaire onComplete={handleComplete} scenario={scenario} />;
}
