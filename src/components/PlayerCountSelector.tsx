import React from 'react';
import { Minus, Plus, Shuffle, Dices } from 'lucide-react';

interface PlayerCountSelectorProps {
  playerCount: number;
  onCountChange: (newCount: number) => void;
  onGenerateDraw: () => void;
  isDrawing: boolean;
  hasDraw: boolean;
  balanceRoles: boolean;
  onToggleBalanceRoles: (enabled: boolean) => void;
}

const COMMON_PRESETS = [6, 12, 18, 24, 30, 36, 42, 48];

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

  const handleDecrease = () => {
    if (playerCount > 6) {
      onCountChange(playerCount - 6);
    }
  };

  const handleIncrease = () => {
    if (playerCount < 96) {
      onCountChange(playerCount + 6);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 mb-6 no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Player Count Controls */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold uppercase tracking-wider text-stone-500">
              Select Number of Bowlers (Multiples of 6)
            </label>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'} • {rinkCount * 2} Triples Teams
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            {/* Decrease Button */}
            <button
              id="decrease-players-btn"
              type="button"
              onClick={handleDecrease}
              disabled={playerCount <= 6}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition cursor-pointer border border-stone-200"
              aria-label="Decrease by 6 players"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Display Box */}
            <div className="flex-1 max-w-[200px] h-12 px-4 rounded-xl bg-stone-50 border-2 border-emerald-600 flex items-center justify-center gap-2">
              <span className="text-2xl font-black font-heading text-emerald-950 tabular-nums">
                {playerCount}
              </span>
              <span className="text-sm font-medium text-stone-600">
                Bowlers
              </span>
            </div>

            {/* Increase Button */}
            <button
              id="increase-players-btn"
              type="button"
              onClick={handleIncrease}
              disabled={playerCount >= 96}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition cursor-pointer border border-stone-200"
              aria-label="Increase by 6 players"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-stone-600 font-medium mr-1">Quick Select:</span>
            {COMMON_PRESETS.map((preset) => {
              const isSelected = preset === playerCount;
              const rinks = preset / 6;
              return (
                <button
                  key={preset}
                  id={`preset-${preset}-btn`}
                  type="button"
                  onClick={() => onCountChange(preset)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700/30'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {preset} <span className="text-[10px] opacity-80 font-normal">({rinks}R)</span>
                </button>
              );
            })}
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
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-stone-300"
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
