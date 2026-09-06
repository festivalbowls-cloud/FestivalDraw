import React from 'react';
import { CircleDot, Printer, Copy, Check, Users } from 'lucide-react';

interface HeaderProps {
  playerCount: number;
  rinkCount: number;
  onOpenPlayerModal: () => void;
  onPrint: () => void;
  onCopyDraw: () => void;
  copied: boolean;
  hasDraw: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  playerCount,
  rinkCount,
  onOpenPlayerModal,
  onPrint,
  onCopyDraw,
  copied,
  hasDraw
}) => {
  return (
    <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-950/40 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  Triples
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/80">
                {playerCount} Bowlers • {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'} • Multiples of 6
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              id="manage-bowlers-btn"
              onClick={onOpenPlayerModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-sm font-medium border border-emerald-700 transition cursor-pointer"
              title="Edit bowler names and preferences"
            >
              <Users className="w-4 h-4" />
              <span>Bowler Names</span>
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
                      <span className="hidden sm:inline">Copy Draw</span>
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
                  <span>Print Sheet</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
