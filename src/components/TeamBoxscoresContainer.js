'use client';

import { useState } from 'react';
import InteractiveBoxscore from './InteractiveBoxscore';
import dynamic from 'next/dynamic';

const MomentumChart = dynamic(() => import('./MomentumChart'), { 
    ssr: false,
    loading: () => <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '3rem' }} />
});

export default function TeamBoxscoresContainer({ 
    teamAName, teamAId, teamABox, teamAPeriodBoxscores, teamAScore,
    teamBName, teamBId, teamBBox, teamBPeriodBoxscores, teamBScore,
    periods, isWinnerA, isWinnerB,
    pbpPeriodsPresent, teamAPeriods, teamBPeriods
}) {
    const [selectedPeriod, setSelectedPeriod] = useState('Full Match');
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div>
            {pbpPeriodsPresent && periods.length > 0 && (
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <MomentumChart 
                        periods={periods}
                        teamAPeriods={teamAPeriods}
                        teamBPeriods={teamBPeriods}
                        teamAName={teamAName}
                        teamBName={teamBName}
                    />
                </div>
            )}
            <InteractiveBoxscore 
                teamName={teamAName} 
                teamId={teamAId} 
                boxscores={teamABox} 
                periodBoxscores={teamAPeriodBoxscores}
                totalScore={teamAScore}
                periods={periods}
                isWinner={isWinnerA}
                externalState={{ selectedPeriod, setSelectedPeriod, showAdvanced, setShowAdvanced }}
            />
            <InteractiveBoxscore 
                teamName={teamBName} 
                teamId={teamBId} 
                boxscores={teamBBox} 
                periodBoxscores={teamBPeriodBoxscores}
                totalScore={teamBScore}
                periods={periods}
                isWinner={isWinnerB}
                externalState={{ selectedPeriod, setSelectedPeriod, showAdvanced, setShowAdvanced }}
            />
        </div>
    );
}
