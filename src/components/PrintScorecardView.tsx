import React from 'react';
import { Rink, TournamentDraw } from '../types';

interface PrintScorecardViewProps {
  rinks: Rink[];
  tournament: TournamentDraw | null;
  activeRound: number; // 1, 2, 3 or 0 for all
  playerCount: number;
  dateStr: string;
}

export const PrintScorecardView: React.FC<PrintScorecardViewProps> = ({
  rinks,
  tournament,
  activeRound,
  playerCount,
  dateStr
}) => {
  const displayRounds = tournament
    ? activeRound === 0
      ? tournament.rounds
      : tournament.rounds.filter(r => r.roundNumber === activeRound)
    : [{ roundNumber: 1, rinks }];

  if (displayRounds.length === 0 || !displayRounds[0].rinks.length) return null;

  return (
    <div className="hidden print:block text-black bg-white p-6 max-w-5xl mx-auto font-sans">
      {/* Printable Sheet Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide">
            Lawn Bowls 3-Round Tournament Draw
          </h1>
          <p className="text-sm font-semibold text-neutral-800">
            {playerCount} Bowlers ({tournament?.rinkCount || rinks.length} Rinks • Triples) • Blocks: Skips 1+, Seconds 30+, Leads 60+
          </p>
          {tournament && (
            <p className="text-xs text-neutral-600 mt-0.5">
              100% Unique Teammates • 100% Unique Positional Opponents • Optimized Rink Rotation
            </p>
          )}
        </div>
        <div className="text-right text-xs font-mono">
          <p>Date: {dateStr}</p>
          <p>Schedule: {activeRound === 0 ? 'All 3 Rounds' : `Round ${activeRound} of 3`}</p>
        </div>
      </div>

      {/* Rounds Container */}
      <div className="space-y-8">
        {displayRounds.map((round) => (
          <div key={round.roundNumber} className="border-t-2 border-dashed border-neutral-300 pt-4 first:border-t-0 first:pt-0">
            <div className="bg-white border-2 border-black rounded px-3 py-1.5 mb-4 flex justify-between items-center">
              <span className="font-black text-base uppercase tracking-wider">
                ROUND {round.roundNumber} OF 3
              </span>
              <span className="text-xs font-mono text-neutral-800 font-bold">
                {round.rinks.length} Rinks in Play
              </span>
            </div>

            {/* Grid of Rinks for Noticeboard */}
            <div className="grid grid-cols-2 gap-4">
              {round.rinks.map((rink) => (
                <div
                  key={rink.id}
                  className="border-2 border-black rounded p-2.5 bg-white page-break-avoid"
                >
                  <div className="bg-white border-b-2 border-black -mx-2.5 -mt-2.5 p-1.5 flex justify-between items-center mb-2">
                    <span className="font-black text-sm">RINK {rink.rinkNumber}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {(!rink.teamA.second && !rink.teamB.second) ? 'Pairs Match (4 Bowls)' : 'Triples Match'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Team A */}
                    <div className="border border-neutral-400 rounded p-1.5 bg-white">
                      <div className="font-black text-[11px] uppercase border-b border-neutral-300 pb-1 mb-1 flex justify-between">
                        <span>TEAM A</span>
                        <span>Score: ___</span>
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>
                          <span className="font-semibold text-[9px] text-neutral-600 block leading-tight">SKIP (1+):</span>
                          <span className="font-bold leading-tight">#{rink.teamA.skip.bowlerNumber} {rink.teamA.skip.name}</span>
                        </div>
                        {rink.teamA.second ? (
                          <div>
                            <span className="font-semibold text-[9px] text-neutral-600 block leading-tight">SECOND (30+):</span>
                            <span className="font-bold leading-tight">#{rink.teamA.second.bowlerNumber} {rink.teamA.second.name}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-[9px] text-neutral-400 block leading-tight italic">No Second (Pairs)</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-[9px] text-neutral-600 block leading-tight">
                            {rink.teamA.lead.bowlerNumber < 60 ? 'LEAD / PARTNER (30+):' : 'LEAD (60+):'}
                          </span>
                          <span className="font-bold leading-tight">#{rink.teamA.lead.bowlerNumber} {rink.teamA.lead.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="border border-neutral-400 rounded p-1.5 bg-white">
                      <div className="font-black text-[11px] uppercase border-b border-neutral-300 pb-1 mb-1 flex justify-between">
                        <span>TEAM B</span>
                        <span>Score: ___</span>
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>
                          <span className="font-semibold text-[9px] text-neutral-600 block leading-tight">SKIP (1+):</span>
                          <span className="font-bold leading-tight">#{rink.teamB.skip.bowlerNumber} {rink.teamB.skip.name}</span>
                        </div>
                        {rink.teamB.second ? (
                          <div>
                            <span className="font-semibold text-[9px] text-neutral-600 block leading-tight">SECOND (30+):</span>
                            <span className="font-bold leading-tight">#{rink.teamB.second.bowlerNumber} {rink.teamB.second.name}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-[9px] text-neutral-400 block leading-tight italic">No Second (Pairs)</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-[9px] text-neutral-600 block leading-tight">
                            {rink.teamB.lead.bowlerNumber < 60 ? 'LEAD / PARTNER (30+):' : 'LEAD (60+):'}
                          </span>
                          <span className="font-bold leading-tight">#{rink.teamB.lead.bowlerNumber} {rink.teamB.lead.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scorecard row for writing ends */}
                  <div className="mt-2 pt-1 border-t border-dashed border-neutral-400 flex justify-between text-[10px] font-mono">
                    <span>Ends: [  ]</span>
                    <span>Result: [ W / L / D ]</span>
                    <span>Sign: ____________</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-neutral-300 text-center text-xs text-neutral-600 font-mono">
        Generated by Lawn Bowls Draw App • Return completed cards to match secretary.
      </div>
    </div>
  );
};
