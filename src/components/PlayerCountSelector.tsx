import React from 'react';
import { ChevronDown, Shuffle, Dices, Users } from 'lucide-react';

interface PlayerCountSelectorProps {
  playerCount: number;
  onCountChange: (newCount: number) => void;
  onGenerateDraw: () => void;
  isDrawing: boolean;
  hasDraw: boolean;
  balanceRoles: boolean;
  onToggleBalanceRoles: (enabled: boolean) => void;
}

// Multiples of 6 options: from 6 (1 rink) up to 72 or 96 (16 rinks)
const MULTIPLES_OF_SIX = Array.from({ length: 16 }, (_, i) => (i + 1) * 6);

export const PlayerCountSelector: React.FC<PlayerCountSelectorProps> = ({
  playerCount,
  onCountChange,
  onGenerateDraw,
  isDrawing,
  hasDraw,
  balanceRoles,
  onToggleBalanceRoles
}) => {
  const rinkCount = Math.max(1, Math.floor(playerCount / 6));

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 mb-6 no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Dropdown Selection for Number of Players */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="player-count-select" className="text-sm font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Select Number of Players</span>
            </label>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'} • {rinkCount * 2} Triples Teams
            </span>
          </div>

          {/* Styled Native Select Dropdown */}
          <div className="relative mt-1">
            <select
              id="player-count-select"
              value={playerCount}
              onChange={(e) => onCountChange(Number(e.target.value))}
              className="w-full h-14 pl-4 pr-11 text-base sm:text-lg font-bold text-stone-900 bg-stone-50 hover:bg-stone-100/80 border-2 border-emerald-600 rounded-xl focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-700 transition cursor-pointer appearance-none shadow-xs"
              aria-label="Select number of players (multiples of 6)"
            >
              {MULTIPLES_OF_SIX.map((num) => {
                const rinks = num / 6;
                return (
                  <option key={num} value={num} className="font-sans py-2 text-stone-900 font-medium">
                    {num} Players &nbsp;({rinks} {rinks === 1 ? 'Rink' : 'Rinks'} — {rinks * 2} Teams of 3)
                  </option>
                );
              })}
            </select>
            
            {/* Custom dropdown chevron */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-800">
              <ChevronDown className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
            <span className="font-semibold text-stone-600">Position Blocks:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold border border-amber-300">
              Skips: 1–29
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 font-bold border border-sky-300">
              Seconds: 30–59
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 font-bold border border-emerald-300">
              Leads: 60–89
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-stone-200 lg:pl-6">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={balanceRoles}
                onChange={(e) => onToggleBalanceRoles(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-stone-300 cursor-pointer"
              />
              <span>Respect role preferences if set</span>
            </label>
          </div>

          <button
            id="make-draw-btn"
            type="button"
            onClick={onGenerateDraw}
            disabled={isDrawing}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-base shadow-sm hover:shadow-md transition cursor-pointer disabled:opacity-75"
          >
            {isDrawing ? (
              <>
                <Dices className="w-5 h-5 animate-spin" />
                <span>Rolling Draw...</span>
              </>
            ) : hasDraw ? (
              <>
                <Shuffle className="w-5 h-5" />
                <span>Redraw & Shuffle</span>
              </>
            ) : (
              <>
                <Shuffle className="w-5 h-5" />
                <span>Generate Bowls Draw</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
