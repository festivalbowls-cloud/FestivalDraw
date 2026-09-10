import React from 'react';
import { ChevronDown, Shuffle, Dices, Users, CircleDot, Printer, Link2 } from 'lucide-react';

interface PlayerCountSelectorProps {
  playerCount: number;
  onCountChange: (newCount: number) => void;
  startRink: number;
  onStartRinkChange: (newStartRink: number) => void;
  keepPair: boolean;
  onKeepPairChange: (newKeepPair: boolean) => void;
  onPrintScorecards: () => void;
  onGenerateDraw: () => void;
  isDrawing: boolean;
  hasDraw: boolean;
  balanceRoles: boolean;
  onToggleBalanceRoles: (enabled: boolean) => void;
}

// Even numbers options: from 4 (1 rink pairs) or 6 (1 rink triples) up to 96 (16 rinks)
export const EVEN_PLAYER_COUNTS = Array.from({ length: 47 }, (_, i) => (i + 2) * 2); // 4, 6, 8, 10, ..., 96
const RINK_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1);

export const PlayerCountSelector: React.FC<PlayerCountSelectorProps> = ({
  playerCount,
  onCountChange,
  startRink,
  onStartRinkChange,
  keepPair,
  onKeepPairChange,
  onPrintScorecards,
  onGenerateDraw,
  isDrawing,
  hasDraw,
  balanceRoles,
  onToggleBalanceRoles
}) => {
  const rinkCount = Math.max(1, Math.ceil(playerCount / 6));
  const rem = playerCount % 6;
  const isSmall6nMinus4 = playerCount < 20 && rem === 2;
  const secondsRemoved = isSmall6nMinus4 ? 2 : rem === 4 ? 2 : rem === 2 ? 4 : 0;
  const leadsRemoved = isSmall6nMinus4 ? 2 : 0;
  const numSkips = rinkCount * 2;
  const numSeconds = Math.max(0, rinkCount * 2 - secondsRemoved);
  const numLeads = Math.max(0, rinkCount * 2 - leadsRemoved);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 mb-6 no-print">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-5">
        
        {/* Left: Row with Player Number, Starting Rink, Keep Pair, and Print Scorecards */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
            
            {/* 1. Number of Players Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="player-count-select"
                  className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Number of Players</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'}
                  {isSmall6nMinus4
                    ? ' • -2 Sec, -2 Lead'
                    : secondsRemoved > 0
                    ? ` • -${secondsRemoved} Sec`
                    : ''}
                </span>
              </div>

              <div className="relative">
                <select
                  id="player-count-select"
                  value={playerCount}
                  onChange={(e) => onCountChange(Number(e.target.value))}
                  className="w-full h-10 sm:h-11 pl-3 pr-9 text-sm sm:text-base font-bold text-stone-900 bg-stone-50 hover:bg-stone-100/80 border-2 border-emerald-600 rounded-xl focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-700 transition cursor-pointer appearance-none shadow-xs"
                  aria-label="Select number of players (all even numbers)"
                >
                  {EVEN_PLAYER_COUNTS.map((num) => {
                    const rinks = Math.max(1, Math.ceil(num / 6));
                    return (
                      <option key={num} value={num} className="font-sans py-1.5 text-stone-900 font-medium">
                        {num} Players ({rinks} {rinks === 1 ? 'Rink' : 'Rinks'})
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-emerald-800">
                  <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* 2. Starting Rink Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="start-rink-select"
                  className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5"
                >
                  <CircleDot className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Starting Rink</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Rinks {startRink}–{startRink + rinkCount - 1}
                </span>
              </div>

              <div className="relative">
                <select
                  id="start-rink-select"
                  value={startRink}
                  onChange={(e) => onStartRinkChange(Number(e.target.value))}
                  className="w-full h-10 sm:h-11 pl-3 pr-9 text-sm sm:text-base font-bold text-stone-900 bg-stone-50 hover:bg-stone-100/80 border-2 border-emerald-600 rounded-xl focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-700 transition cursor-pointer appearance-none shadow-xs"
                  aria-label="Select starting rink"
                >
                  {RINK_OPTIONS.map((num) => {
                    const endRink = num + rinkCount - 1;
                    return (
                      <option key={num} value={num} className="font-sans py-1.5 text-stone-900 font-medium">
                        Rink {num} &nbsp;(Rinks {num}–{endRink})
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-emerald-800">
                  <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* 3. Keep Pair Dropdown (True / False, defaulting to False) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="keep-pair-select"
                  className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Keep Pair</span>
                </label>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  keepPair 
                    ? 'text-amber-900 bg-amber-50 border-amber-300' 
                    : 'text-stone-600 bg-stone-100 border-stone-200'
                }`}>
                  {keepPair ? 'True' : 'False'}
                </span>
              </div>

              <div className="relative">
                <select
                  id="keep-pair-select"
                  value={keepPair ? 'true' : 'false'}
                  onChange={(e) => onKeepPairChange(e.target.value === 'true')}
                  className="w-full h-10 sm:h-11 pl-3 pr-9 text-sm sm:text-base font-bold text-stone-900 bg-stone-50 hover:bg-stone-100/80 border-2 border-emerald-600 rounded-xl focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-700 transition cursor-pointer appearance-none shadow-xs"
                  aria-label="Keep Pair dropdown of true or false"
                >
                  <option value="false" className="font-sans py-1.5 text-stone-900 font-medium">
                    False
                  </option>
                  <option value="true" className="font-sans py-1.5 text-stone-900 font-medium">
                    True
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-emerald-800">
                  <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* 4. Print Scorecards Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Scorecards</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  2×2 Layout
                </span>
              </div>

              <button
                id="row-print-scorecards-btn"
                type="button"
                onClick={onPrintScorecards}
                className="w-full h-10 sm:h-11 px-3 sm:px-4 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] rounded-xl shadow-xs hover:shadow-md transition cursor-pointer border-2 border-emerald-700"
                title="Print all player scorecards (2x2 Landscape format)"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">Print Scorecards</span>
              </button>
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-stone-600">Player Numbers:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold border border-amber-300">
                Skips: 1–29 ({numSkips})
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 font-bold border border-sky-300">
                Seconds: 30–59 ({numSeconds})
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 font-bold border border-emerald-300">
                Leads: 60–89 ({numLeads})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSmall6nMinus4 ? (
                <span className="text-xs font-semibold text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                  Format: -2 Seconds &amp; -2 Leads ({rinkCount === 2 ? 'All Pairs' : '1 Triples, 2 Pairs'})
                </span>
              ) : secondsRemoved > 0 ? (
                <span className="text-xs font-semibold text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                  Format: -{secondsRemoved} Second{secondsRemoved > 1 ? 's' : ''} ({secondsRemoved / 2} Pairs {secondsRemoved / 2 === 1 ? 'match' : 'matches'})
                </span>
              ) : null}

              {keepPair && (
                <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-amber-700" />
                  Keep Pair: Lead 60 &amp; Second 30 together
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row 2xl:flex-col justify-center gap-2.5 pt-4 2xl:pt-0 border-t 2xl:border-t-0 2xl:border-l border-stone-200 2xl:pl-5 shrink-0">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={balanceRoles}
                onChange={(e) => onToggleBalanceRoles(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-stone-300 cursor-pointer"
              />
              <span>Respect role preferences</span>
            </label>
          </div>

          <button
            id="make-draw-btn"
            type="button"
            onClick={onGenerateDraw}
            disabled={isDrawing}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-75"
          >
            {isDrawing ? (
              <>
                <Dices className="w-4 h-4 animate-spin" />
                <span>Rolling Draw...</span>
              </>
            ) : hasDraw ? (
              <>
                <Shuffle className="w-4 h-4" />
                <span>Redraw &amp; Shuffle</span>
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4" />
                <span>Generate Bowls Draw</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
