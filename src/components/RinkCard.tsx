import React from 'react';
import { Rink, Player } from '../types';
import { Crown, Circle, Target, ArrowLeftRight, Check } from 'lucide-react';
import { isUserEnteredName } from '../utils/bowlsDraw';

interface RinkCardProps {
  rink: Rink;
  startRink?: number;
  selectedPlayerId: string | null;
  onSelectPlayer: (player: Player, rinkNumber: number, teamSide: 'teamA' | 'teamB', role: 'skip' | 'second' | 'lead') => void;
  searchQuery: string;
}

export const RinkCard: React.FC<RinkCardProps> = ({
  rink,
  startRink = 1,
  selectedPlayerId,
  onSelectPlayer,
  searchQuery
}) => {
  const calculatedRink = (startRink - 1) + rink.rinkNumber;
  const isSearchMatch = (name: string) => {
    if (!searchQuery.trim()) return false;
    return name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  const renderPlayerRow = (
    player: Player,
    teamSide: 'teamA' | 'teamB',
    role: 'skip' | 'second' | 'lead',
    roleLabel: string,
    roleIcon: React.ReactNode,
    badgeColor: string
  ) => {
    const isSelected = selectedPlayerId === player.id;
    const isHighlighted = isSearchMatch(player.name);

    // Block styling based on position range (1+ Skips amber, 30+ Seconds sky, 60+ Leads emerald)
    const numberBlockBadge =
      player.bowlerNumber < 30
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : player.bowlerNumber < 60
        ? 'bg-sky-100 text-sky-900 border-sky-300'
        : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    const blockType = player.bowlerNumber < 30 ? 'SKIP' : player.bowlerNumber < 60 ? 'SECOND' : 'LEAD';

    const displayName = isUserEnteredName(player.name, player.bowlerNumber)
      ? player.name
      : `Player ${player.bowlerNumber}`;

    return (
      <button
        type="button"
        onClick={() => onSelectPlayer(player, rink.rinkNumber, teamSide, role)}
        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer border ${
          isSelected
            ? 'bg-amber-100/90 border-amber-500 shadow-sm ring-2 ring-amber-400'
            : isHighlighted
            ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400'
            : 'bg-white hover:bg-stone-50 border-stone-200/80'
        }`}
        title={`Click to swap ${displayName} (Block: ${blockType})`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Positional Number Badge */}
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-heading border shrink-0 ${numberBlockBadge}`}
            title={`Bowler #${player.bowlerNumber} (${blockType} block)`}
          >
            #{player.bowlerNumber}
          </span>

          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-950' : 'text-stone-900'}`}>
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
              <span className="capitalize">{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 pl-1">
          {isSelected ? (
            <span className="text-[10px] uppercase font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">
              Selected
            </span>
          ) : (
            <span className="text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 hover:text-stone-600">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col page-break-avoid">
      {/* Rink Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 px-4 py-3 flex items-center justify-between text-white border-b border-emerald-950/20">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center font-heading">
            {calculatedRink}
          </span>
          <h3 className="font-bold text-base tracking-wide font-heading">
            RINK {calculatedRink}
          </h3>
        </div>
        <span className="text-[11px] font-medium text-emerald-200/90 bg-emerald-950/40 px-2 py-0.5 rounded-full">
          {(!rink.teamA.second && !rink.teamB.second)
            ? 'Pairs (2 vs 2)'
            : (!rink.teamA.second || !rink.teamB.second)
            ? 'Pairs vs Triples'
            : 'Triples (3 vs 3)'}
        </span>
      </div>

      {/* Teams Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        
        {/* Team A */}
        <div className="flex flex-col bg-stone-50/70 rounded-xl p-3 border border-stone-200">
          <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block"></span>
              <span className="font-bold text-xs uppercase tracking-wider text-stone-900 font-heading">
                Team A
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-stone-200/80 text-stone-700 px-1.5 py-0.5 rounded border border-stone-300" title="Delivers the Jack and bowl first on End 1">
              Holds Mat (End 1)
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            {renderPlayerRow(
              rink.teamA.skip,
              'teamA',
              'skip',
              'Skip (Captain)',
              <Crown className="w-3.5 h-3.5 text-amber-700" />,
              'bg-amber-100'
            )}
            {rink.teamA.second ? (
              renderPlayerRow(
                rink.teamA.second,
                'teamA',
                'second',
                'Second',
                <Circle className="w-3.5 h-3.5 text-blue-700" />,
                'bg-blue-100'
              )
            ) : (
              <div className="flex items-center justify-center p-2 rounded-lg border border-dashed border-stone-300 bg-white/70 text-stone-600 text-xs font-semibold italic">
                Pairs Match (No Second — 4 Bowls each)
              </div>
            )}
            {renderPlayerRow(
              rink.teamA.lead,
              'teamA',
              'lead',
              !rink.teamA.second && rink.teamA.lead.bowlerNumber < 60
                ? 'Lead / Partner'
                : rink.teamA.second
                ? 'Lead (Jack Delivery)'
                : 'Lead (Pairs)',
              <Target className="w-3.5 h-3.5 text-emerald-700" />,
              'bg-emerald-100'
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-col bg-stone-50/70 rounded-xl p-3 border border-stone-200">
          <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-600 inline-block"></span>
              <span className="font-bold text-xs uppercase tracking-wider text-stone-900 font-heading">
                Team B
              </span>
            </div>
          </div>

          <div className="space-y-1.5 flex-1">
            {renderPlayerRow(
              rink.teamB.skip,
              'teamB',
              'skip',
              'Skip (Captain)',
              <Crown className="w-3.5 h-3.5 text-amber-700" />,
              'bg-amber-100'
            )}
            {rink.teamB.second ? (
              renderPlayerRow(
                rink.teamB.second,
                'teamB',
                'second',
                'Second',
                <Circle className="w-3.5 h-3.5 text-blue-700" />,
                'bg-blue-100'
              )
            ) : (
              <div className="flex items-center justify-center p-2 rounded-lg border border-dashed border-stone-300 bg-white/70 text-stone-600 text-xs font-semibold italic">
                Pairs Match (No Second — 4 Bowls each)
              </div>
            )}
            {renderPlayerRow(
              rink.teamB.lead,
              'teamB',
              'lead',
              !rink.teamB.second && rink.teamB.lead.bowlerNumber < 60
                ? 'Lead / Partner'
                : rink.teamB.second
                ? 'Lead'
                : 'Lead (Pairs)',
              <Target className="w-3.5 h-3.5 text-emerald-700" />,
              'bg-emerald-100'
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
