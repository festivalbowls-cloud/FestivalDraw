import React from 'react';
import { Rink, Player } from '../types';
import { Crown, Circle, Target, ArrowLeftRight, Check } from 'lucide-react';
import { isUserEnteredName } from '../utils/bowlsDraw';

interface RinkCardProps {
  rink: Rink;
  startRink?: number;
  selectedPlayerId: string | null;
  onSelectPlayer: (player: Player, rinkNumber: number, teamColor: 'red' | 'blue', role: 'skip' | 'second' | 'lead') => void;
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
    teamColor: 'red' | 'blue',
    role: 'skip' | 'second' | 'lead',
    roleLabel: string,
    roleIcon: React.ReactNode,
    badgeColor: string
  ) => {
    const isSelected = selectedPlayerId === player.id;
    const isHighlighted = isSearchMatch(player.name);

    // Block styling based on position range
    const numberBlockBadge =
      role === 'skip'
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : role === 'second'
        ? 'bg-sky-100 text-sky-900 border-sky-300'
        : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    const displayName = isUserEnteredName(player.name, player.bowlerNumber)
      ? player.name
      : `Player ${player.bowlerNumber}`;

    return (
      <button
        type="button"
        onClick={() => onSelectPlayer(player, rink.rinkNumber, teamColor, role)}
        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer border ${
          isSelected
            ? 'bg-amber-100/90 border-amber-500 shadow-sm ring-2 ring-amber-400'
            : isHighlighted
            ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400'
            : 'bg-white hover:bg-stone-50 border-stone-200/80'
        }`}
        title={`Click to swap ${displayName} (Position: ${role.toUpperCase()})`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Positional Number Badge */}
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-heading border shrink-0 ${numberBlockBadge}`}
            title={`Bowler #${player.bowlerNumber} (${role.toUpperCase()} block)`}
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
          Triples (3 vs 3)
        </span>
      </div>

      {/* Teams Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        
        {/* Red Team */}
        <div className="flex flex-col bg-red-50/40 rounded-xl p-3 border border-red-200/70">
          <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-red-200/50">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block shadow-xs"></span>
              <span className="font-bold text-xs uppercase tracking-wider text-red-950">
                Red Stickers
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-200" title="Delivers the Jack and bowl first on End 1">
              Holds Mat (End 1)
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            {renderPlayerRow(
              rink.teamA.skip,
              'red',
              'skip',
              'Skip (Captain)',
              <Crown className="w-3.5 h-3.5 text-amber-700" />,
              'bg-amber-100'
            )}
            {renderPlayerRow(
              rink.teamA.second,
              'red',
              'second',
              'Second',
              <Circle className="w-3.5 h-3.5 text-blue-700" />,
              'bg-blue-100'
            )}
            {renderPlayerRow(
              rink.teamA.lead,
              'red',
              'lead',
              'Lead (Jack Delivery)',
              <Target className="w-3.5 h-3.5 text-emerald-700" />,
              'bg-emerald-100'
            )}
          </div>
        </div>

        {/* Blue Team */}
        <div className="flex flex-col bg-sky-50/40 rounded-xl p-3 border border-sky-200/70">
          <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-sky-200/50">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-600 inline-block shadow-xs"></span>
              <span className="font-bold text-xs uppercase tracking-wider text-sky-950">
                Blue Stickers
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
              Team B
            </span>
          </div>

          <div className="space-y-1.5 flex-1">
            {renderPlayerRow(
              rink.teamB.skip,
              'blue',
              'skip',
              'Skip (Captain)',
              <Crown className="w-3.5 h-3.5 text-amber-700" />,
              'bg-amber-100'
            )}
            {renderPlayerRow(
              rink.teamB.second,
              'blue',
              'second',
              'Second',
              <Circle className="w-3.5 h-3.5 text-blue-700" />,
              'bg-blue-100'
            )}
            {renderPlayerRow(
              rink.teamB.lead,
              'blue',
              'lead',
              'Lead',
              <Target className="w-3.5 h-3.5 text-emerald-700" />,
              'bg-emerald-100'
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
