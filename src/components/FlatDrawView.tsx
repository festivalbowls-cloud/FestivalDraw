import React, { useState, useMemo } from 'react';
import { Player, TournamentDraw } from '../types';
import { Copy, Check, Printer, ArrowLeft, Search, Filter, Shield, User, FileSpreadsheet } from 'lucide-react';
import { formatFlatDrawText, isUserEnteredName } from '../utils/bowlsDraw';

interface FlatDrawViewProps {
  tournament: TournamentDraw;
  players: Player[];
  startRink?: number;
  onBackToRinks: () => void;
  onGoToScorecards?: () => void;
  onPrint: () => void;
}

interface PlayerMatchInfo {
  roundNumber: number;
  rinkNumber: number;
  teamSide: 'Team A' | 'Team B';
  teamNumbers: number[];
  oppositionNumbers: number[];
}

interface PlayerFlatRow {
  player: Player;
  matches: PlayerMatchInfo[];
}

export const FlatDrawView: React.FC<FlatDrawViewProps> = ({
  tournament,
  players,
  startRink = 1,
  onBackToRinks,
  onGoToScorecards,
  onPrint
}) => {
  const [copied, setCopied] = useState(false);
  const [filterPosition, setFilterPosition] = useState<'all' | 'skip' | 'second' | 'lead'>('all');
  const [searchNumber, setSearchNumber] = useState('');

  // Build the flat rows for each player
  const flatRows: PlayerFlatRow[] = useMemo(() => {
    // Sort players strictly by bowler number (Skips 1+, Seconds 30+, Leads 60+)
    const sorted = [...players].sort((a, b) => a.bowlerNumber - b.bowlerNumber);

    return sorted.map((player) => {
      const matches: PlayerMatchInfo[] = tournament.rounds.map((round) => {
        let rinkNumber = 1;
        let teamSide: 'Team A' | 'Team B' = 'Team A';
        let teamNumbers: number[] = [];
        let oppositionNumbers: number[] = [];

        round.rinks.forEach((r) => {
          const teamA = [r.teamA.skip, r.teamA.second, r.teamA.lead].filter((p): p is Player => Boolean(p));
          const teamB = [r.teamB.skip, r.teamB.second, r.teamB.lead].filter((p): p is Player => Boolean(p));

          if (teamA.some((p) => p.bowlerNumber === player.bowlerNumber)) {
            rinkNumber = r.rinkNumber;
            teamSide = 'Team A';
            teamNumbers = teamA.map((p) => p.bowlerNumber).sort((a, b) => a - b);
            oppositionNumbers = teamB.map((p) => p.bowlerNumber).sort((a, b) => a - b);
          } else if (teamB.some((p) => p.bowlerNumber === player.bowlerNumber)) {
            rinkNumber = r.rinkNumber;
            teamSide = 'Team B';
            teamNumbers = teamB.map((p) => p.bowlerNumber).sort((a, b) => a - b);
            oppositionNumbers = teamA.map((p) => p.bowlerNumber).sort((a, b) => a - b);
          }
        });

        return {
          roundNumber: round.roundNumber,
          rinkNumber,
          teamSide,
          teamNumbers,
          oppositionNumbers
        };
      });

      return {
        player,
        matches
      };
    });
  }, [players, tournament]);

  // Filter rows based on position & search
  const filteredRows = useMemo(() => {
    return flatRows.filter((row) => {
      if (filterPosition !== 'all' && row.player.position !== filterPosition) {
        return false;
      }
      if (searchNumber.trim()) {
        const q = searchNumber.trim().toLowerCase();
        const numMatch = String(row.player.bowlerNumber).includes(q);
        const nameMatch = row.player.name.toLowerCase().includes(q);
        return numMatch || nameMatch;
      }
      return true;
    });
  }, [flatRows, filterPosition, searchNumber]);

  const handleCopy = () => {
    const text = formatFlatDrawText(tournament, players, startRink);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const getPositionBadge = (pos: 'skip' | 'second' | 'lead') => {
    if (pos === 'skip') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          SKIP (1+)
        </span>
      );
    }
    if (pos === 'second') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          SECOND (30+)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
        LEAD (60+)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Flat Draw Toolbar / Header */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="back-to-rinks-btn"
              onClick={onBackToRinks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer border border-stone-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rink Cards</span>
            </button>

            {onGoToScorecards && (
              <button
                type="button"
                id="flat-go-scorecards-btn"
                onClick={onGoToScorecards}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-bold transition cursor-pointer border border-emerald-300"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
                <span>Scorecards</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-stone-900">
                  Flat Draw (Player-by-Player)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Player Numbers View
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Every player isolated on their own row with their 3 matches grouped chronologically showing Round &amp; Rink, Team numbers (player and teammates), and Opposition numbers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              id="copy-flat-draw-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-300 transition cursor-pointer"
              title="Copy flat draw player numbers to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-600" />
                  <span>Copy Flat Draw</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="print-flat-draw-btn"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 text-xs font-bold transition cursor-pointer shadow-xs"
              title="Print the flat draw sheet"
            >
              <Printer className="w-4 h-4" />
              <span>Print Flat Draw</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Position Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filter:
            </span>
            {(['all', 'skip', 'second', 'lead'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                id={`filter-flat-${pos}`}
                onClick={() => setFilterPosition(pos)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterPosition === pos
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {pos === 'all' ? 'All Bowlers' : pos.toUpperCase() + 'S'}
              </button>
            ))}
          </div>

          {/* Quick Bowler Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search player number or name..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 w-48 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Flat Draw Table / Rows */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-800 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-44">Player</th>
                <th className="py-3 px-4 border-l border-stone-700 bg-stone-900/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Round 1</span>
                  </div>
                </th>
                <th className="py-3 px-4 border-l border-stone-700 bg-stone-900/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Round 2</span>
                  </div>
                </th>
                <th className="py-3 px-4 border-l border-stone-700 bg-stone-900/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Round 3</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs font-sans">
              {filteredRows.map(({ player, matches }, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={player.id}
                    id={`flat-row-player-${player.bowlerNumber}`}
                    className={`transition-colors hover:bg-emerald-50/50 ${
                      isEven ? 'bg-white' : 'bg-stone-50/60'
                    }`}
                  >
                    {/* Isolated Player Column */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            player.position === 'skip'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : player.position === 'second'
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-sky-600 text-white border-sky-700'
                          }`}
                        >
                          {player.bowlerNumber}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-sm leading-tight">
                            Player {player.bowlerNumber}
                          </div>
                          {isUserEnteredName(player.name, player.bowlerNumber) && (
                            <div className="text-[11px] text-stone-500 truncate max-w-[110px]">
                              {player.name}
                            </div>
                          )}
                          <div className="mt-1">
                            {getPositionBadge(player.position)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Chronological Matches: Round 1, 2, 3 */}
                    {matches.map((m) => {
                      const calculatedRink = (startRink - 1) + m.rinkNumber;
                      return (
                        <td
                          key={m.roundNumber}
                          className="py-3.5 px-4 align-top border-l border-stone-200"
                        >
                          <div className="space-y-2">
                            {/* Round and Rink Header */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-black text-xs bg-stone-800 text-white tracking-wide">
                                Round {m.roundNumber}. Rink {calculatedRink}
                              </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                              {m.teamSide}
                            </span>
                          </div>

                          {/* Team (Player & Teammates Numbers - No # signs) */}
                          <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                                Team (Player &amp; Teammates):
                              </span>
                              <span className="text-[10px] text-emerald-700 font-medium">3 Bowlers</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {m.teamNumbers.map((num) => {
                                const isCurrentPlayer = num === player.bowlerNumber;
                                return (
                                  <span
                                    key={num}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold shadow-2xs ${
                                      isCurrentPlayer
                                        ? 'bg-emerald-700 text-white border border-emerald-800 ring-2 ring-emerald-400'
                                        : 'bg-white text-emerald-950 border border-emerald-300'
                                    }`}
                                    title={isCurrentPlayer ? `Player ${num}` : `Teammate ${num}`}
                                  >
                                    {num}
                                    {isCurrentPlayer && (
                                      <span className="ml-1 text-[9px] font-normal opacity-90">(Player)</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Opposition Player Numbers (No # signs) */}
                          <div className="bg-rose-50/80 border border-rose-200 rounded-lg p-2">
                            <span className="text-[10px] font-bold text-rose-900 block uppercase tracking-wider mb-1">
                              Opposition:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {m.oppositionNumbers.map((num) => (
                                <span
                                  key={num}
                                  className="inline-flex items-center px-2 py-0.5 rounded bg-white text-rose-950 font-bold border border-rose-300 text-xs shadow-2xs"
                                >
                                  {num}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div className="text-center py-12 text-stone-500 text-xs">
            No bowlers found matching your filter or search.
          </div>
        )}
      </div>

      {/* Print-Only Sheet for Flat Draw */}
      <div className="hidden print:block text-black bg-white p-4 max-w-5xl mx-auto font-sans">
        <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">
              Lawn Bowls Flat Draw — Player Numbers
            </h1>
            <p className="text-xs font-semibold text-neutral-800">
              {players.length} Bowlers ({tournament.rinkCount} Rinks • Triples) • 3 Chronological Matches per Bowler
            </p>
          </div>
          <div className="text-right text-[11px] font-mono">
            <p>100% Unique Teammates &amp; Opponents</p>
          </div>
        </div>

        <table className="w-full text-left border border-black text-[11px]">
          <thead>
            <tr className="bg-neutral-200 border-b border-black font-bold">
              <th className="p-1.5 border-r border-black w-28">Player</th>
              <th className="p-1.5 border-r border-black">Round 1</th>
              <th className="p-1.5 border-r border-black">Round 2</th>
              <th className="p-1.5">Round 3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {flatRows.map(({ player, matches }) => (
              <tr key={player.id} className="page-break-avoid">
                <td className="p-1.5 border-r border-black font-bold bg-neutral-50">
                  <span className="text-sm font-black">Player {player.bowlerNumber}</span>
                  <span className="block text-[10px] text-neutral-600 uppercase font-semibold">
                    {player.position}
                  </span>
                </td>
                {matches.map((m) => (
                  <td key={m.roundNumber} className="p-1.5 border-r border-black last:border-r-0">
                    <div className="font-bold">
                      Round {m.roundNumber}. Rink {(startRink - 1) + m.rinkNumber}
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600">Team: </span>
                      <span className="font-bold">{m.teamNumbers.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600">Opp: </span>
                      <span className="font-bold">{m.oppositionNumbers.join(', ')}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
