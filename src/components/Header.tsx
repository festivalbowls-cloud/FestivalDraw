import React from 'react';
import { CircleDot, Printer, Copy, Check, Users, Table, FileSpreadsheet, Layers } from 'lucide-react';

interface HeaderProps {
  playerCount: number;
  rinkCount: number;
  onOpenPlayerModal: () => void;
  onPrint: () => void;
  onCopyDraw: () => void;
  copied: boolean;
  hasDraw: boolean;
  viewMode?: 'rinks' | 'flat' | 'scorecards';
  onSelectViewMode?: (mode: 'rinks' | 'flat' | 'scorecards') => void;
  isFlatDraw?: boolean;
  onToggleFlatDraw?: () => void;
  isScorecards?: boolean;
  onToggleScorecards?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  playerCount,
  rinkCount,
  onOpenPlayerModal,
  onPrint,
  onCopyDraw,
  copied,
  hasDraw,
  viewMode = 'rinks',
  onSelectViewMode,
  isFlatDraw,
  onToggleFlatDraw,
  isScorecards,
  onToggleScorecards
}) => {
  const currentMode = isScorecards ? 'scorecards' : isFlatDraw ? 'flat' : viewMode;

  const handleModeChange = (mode: 'rinks' | 'flat' | 'scorecards') => {
    if (onSelectViewMode) {
      onSelectViewMode(mode);
      return;
    }
    if (mode === 'rinks') {
      if (isFlatDraw && onToggleFlatDraw) onToggleFlatDraw();
      if (isScorecards && onToggleScorecards) onToggleScorecards();
    } else if (mode === 'flat') {
      if (!isFlatDraw && onToggleFlatDraw) onToggleFlatDraw();
    } else if (mode === 'scorecards') {
      if (!isScorecards && onToggleScorecards) onToggleScorecards();
    }
  };

  return (
    <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-950/40 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        {/* Mobile View: Top Row (Brand + Actions) & Bottom Row (Full-width View Switcher) */}
        <div className="flex flex-col sm:hidden gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-700/60 flex items-center justify-center shadow-inner text-amber-300 shrink-0">
                <CircleDot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold tracking-tight font-heading text-white truncate">
                    Lawn Bowls
                  </h1>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    {playerCount % 6 === 0 ? 'Triples' : 'Pairs & Triples'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 truncate">
                  {playerCount} Bowlers • {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'}
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="mobile-manage-bowlers-btn"
                onClick={onOpenPlayerModal}
                className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 transition cursor-pointer"
                title="Edit bowlers"
              >
                <Users className="w-4 h-4" />
              </button>

              {hasDraw && (
                <>
                  <button
                    id="mobile-copy-draw-btn"
                    onClick={onCopyDraw}
                    className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 transition cursor-pointer"
                    title="Copy draw"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    id="mobile-print-draw-btn"
                    onClick={onPrint}
                    className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 transition cursor-pointer shadow-xs font-bold"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Full-Width View Mode Segmented Control */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-emerald-950/70 border border-emerald-800/70 rounded-xl">
            <button
              type="button"
              id="mobile-view-rinks-btn"
              onClick={() => handleModeChange('rinks')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentMode === 'rinks'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Rinks</span>
            </button>

            <button
              type="button"
              id="mobile-view-flat-btn"
              onClick={() => handleModeChange('flat')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentMode === 'flat'
                  ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <Table className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span>Flat Draw</span>
            </button>

            <button
              type="button"
              id="mobile-view-scorecards-btn"
              onClick={() => handleModeChange('scorecards')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentMode === 'scorecards'
                  ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
              <span>Scorecards</span>
            </button>
          </div>
        </div>

        {/* Desktop View (sm: and up) */}
        <div className="hidden sm:flex sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-800 border border-emerald-700/60 flex items-center justify-center shadow-inner text-amber-300">
              <CircleDot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-heading text-white">
                  Lawn Bowls Draw
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {playerCount % 6 === 0 ? 'Triples' : 'Pairs & Triples'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/80">
                {playerCount} Bowlers • {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'}
                {playerCount % 6 !== 0 ? ` • 6N-${playerCount % 6 === 4 ? 2 : 4}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Flat Draw Toggle Button */}
            {hasDraw && (
              <button
                type="button"
                id="flat-draw-btn"
                onClick={() => handleModeChange(currentMode === 'flat' ? 'rinks' : 'flat')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer border ${
                  currentMode === 'flat'
                    ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-xs font-bold'
                    : 'bg-emerald-800/90 hover:bg-emerald-700 text-white border-emerald-600'
                }`}
                title="Display flat draw isolating each player on separate rows with player numbers"
              >
                <Table className="w-4 h-4" />
                <span>Flat Draw</span>
              </button>
            )}

            {/* Scorecards Toggle Button */}
            {hasDraw && (
              <button
                type="button"
                id="scorecards-nav-btn"
                onClick={() => handleModeChange(currentMode === 'scorecards' ? 'rinks' : 'scorecards')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer border ${
                  currentMode === 'scorecards'
                    ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-xs font-bold'
                    : 'bg-emerald-800/90 hover:bg-emerald-700 text-white border-emerald-600'
                }`}
                title="Display scorecards for each player with Result, Ends, and Points tracking"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Scorecards</span>
              </button>
            )}

            <button
              id="manage-bowlers-btn"
              onClick={onOpenPlayerModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-sm font-medium border border-emerald-700 transition cursor-pointer"
              title="Edit bowler names and preferences"
            >
              <Users className="w-4 h-4" />
              <span>Bowlers</span>
            </button>

            {hasDraw && (
              <>
                <button
                  id="copy-draw-btn"
                  onClick={onCopyDraw}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-sm font-medium border border-emerald-700 transition cursor-pointer"
                  title="Copy draw to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  id="print-draw-btn"
                  onClick={onPrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 text-sm font-semibold transition cursor-pointer shadow-sm"
                  title="Print rink draw sheet"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
