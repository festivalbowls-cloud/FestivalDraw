import React, { useState, useMemo, useEffect } from 'react';
import { Player, TournamentDraw } from '../types';
import {
  Copy,
  Check,
  Printer,
  ArrowLeft,
  Search,
  Filter,
  RotateCcw,
  Table as TableIcon,
  X,
  ExternalLink,
  Eye,
  LayoutGrid
} from 'lucide-react';

interface PlayerScorecardsViewProps {
  tournament: TournamentDraw;
  players: Player[];
  onBackToRinks: () => void;
  onGoToFlatDraw: () => void;
  isPrintPreviewOpen?: boolean;
  onTogglePrintPreview?: (open: boolean) => void;
}

interface ScoreRecord {
  result: string; // e.g. 'W', 'L', 'D' or score
  ends: string; // number of ends won
  points: string; // points or shots scored
}

interface MatchRowData {
  roundNumber: number;
  rinkNumber: number;
  rinkFormula: string; // =startrink-1+X
  teamColor: 'Red' | 'Blue';
  teamNumbers: number[];
  oppositionNumbers: number[];
}

interface PlayerScorecardGroup {
  player: Player;
  roleHeading: string; // Skip (0–29), Second (31–59), or Lead (over 60)
  matches: MatchRowData[];
}

// Evaluate player numbers to display Skip (0–29), Second (31–59), or Lead (over 60)
export function evaluatePlayerRoleHeading(num: number): string {
  if (num <= 29) {
    return 'Skip (0–29)';
  }
  if (num <= 59) {
    return 'Second (31–59)';
  }
  return 'Lead (over 60)';
}

// Return player position title (Skip, Second, Lead)
export function getPlayerPositionTitle(player: Player): string {
  if (player.position === 'skip' || player.bowlerNumber <= 29) {
    return 'Skip';
  }
  if (player.position === 'second' || (player.bowlerNumber >= 30 && player.bowlerNumber <= 59)) {
    return 'Second';
  }
  return 'Lead';
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Utility to chunk array into pages of specified size (4 scorecards per landscape page)
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// Single scorecard card component designed with font size 18 and no dashes in results cells
interface ScorecardCardProps {
  group: PlayerScorecardGroup;
  startRink: number;
  rinkDisplayMode: 'number' | 'formula';
  scores: Record<string, ScoreRecord>;
  totals: { resultTotal: string; endsTotal: string; pointsTotal: string };
  isInteractive?: boolean;
  onScoreChange?: (playerId: string, roundNumber: number, field: keyof ScoreRecord, value: string) => void;
}

export const ScorecardCard: React.FC<ScorecardCardProps> = ({
  group,
  startRink,
  rinkDisplayMode,
  scores,
  totals,
  isInteractive = false,
  onScoreChange
}) => {
  const roleTitle = getPlayerPositionTitle(group.player);

  return (
    <div className="scorecard-card border-2 border-black rounded bg-white p-2.5 sm:p-3 flex flex-col justify-between h-full font-sans text-stone-900 box-border page-break-avoid">
      {/* Card Header: Position Title & Bowler Number in font size 18 */}
      <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[18px] font-black uppercase text-black tracking-tight shrink-0">
            {roleTitle} {group.player.bowlerNumber}
          </span>
          <span className="text-[18px] text-stone-800 font-semibold truncate max-w-[220px] sm:max-w-[260px]">
            ({group.player.name})
          </span>
        </div>
      </div>

      {/* Scorecard Table: Font Size 18, Reduced Rink/Team & Equal-Width Results (16% Rink, 24% Team, 20% Result, 20% Ends, 20% Points) */}
      <table className="w-full border-collapse border-2 border-black text-[18px] table-fixed">
        <thead>
          <tr className="bg-stone-100 border-b-2 border-black font-bold uppercase text-[15px] leading-snug">
            <th className="p-1.5 border-r border-black text-left w-[16%]">Rink</th>
            <th className="p-1.5 border-r border-black text-left w-[24%]">Team</th>
            <th className="p-1.5 border-r border-black text-center w-[20%]">Result</th>
            <th className="p-1.5 border-r border-black text-center w-[20%]">Ends</th>
            <th className="p-1.5 text-center w-[20%]">Points</th>
          </tr>
        </thead>
        <tbody>
          {group.matches.map((m) => {
            const scoreKey = `${group.player.id}-round-${m.roundNumber}`;
            const currentScore = scores[scoreKey] || { result: '', ends: '', points: '' };
            const calculatedRink = startRink - 1 + m.rinkNumber;
            const rinkText = rinkDisplayMode === 'formula' ? m.rinkFormula : `${calculatedRink}`;

            return (
              <tr key={m.roundNumber} className="border-b border-black h-9">
                {/* Rink Cell (16%) */}
                <td className="p-1.5 border-r border-black font-bold text-left text-[18px] whitespace-nowrap overflow-hidden">
                  {rinkText}
                </td>

                {/* Team Cell (24%) */}
                <td className="p-1.5 border-r border-black font-bold text-left text-[18px] truncate">
                  {m.teamNumbers.join(', ')}
                </td>

                {/* Result Cell (20%): Font size 18, NO DASHES */}
                <td className="p-1 border-r border-black font-bold text-center text-[18px]">
                  {isInteractive ? (
                    <input
                      type="text"
                      maxLength={6}
                      value={currentScore.result}
                      onChange={(e) =>
                        onScoreChange?.(group.player.id, m.roundNumber, 'result', e.target.value)
                      }
                      className="w-full text-center font-bold text-[18px] bg-transparent focus:bg-emerald-50 focus:outline-hidden"
                    />
                  ) : (
                    currentScore.result || ''
                  )}
                </td>

                {/* Ends Cell (20%): Font size 18, NO DASHES */}
                <td className="p-1 border-r border-black font-bold text-center text-[18px]">
                  {isInteractive ? (
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={currentScore.ends}
                      onChange={(e) =>
                        onScoreChange?.(group.player.id, m.roundNumber, 'ends', e.target.value)
                      }
                      className="w-full text-center font-bold text-[18px] bg-transparent focus:bg-emerald-50 focus:outline-hidden"
                    />
                  ) : (
                    currentScore.ends || ''
                  )}
                </td>

                {/* Points Cell (20%): Font size 18, NO DASHES */}
                <td className="p-1 font-bold text-center text-[18px]">
                  {isInteractive ? (
                    <input
                      type="number"
                      min={-99}
                      max={99}
                      value={currentScore.points}
                      onChange={(e) =>
                        onScoreChange?.(group.player.id, m.roundNumber, 'points', e.target.value)
                      }
                      className="w-full text-center font-bold text-[18px] bg-transparent focus:bg-emerald-50 focus:outline-hidden"
                    />
                  ) : (
                    currentScore.points || ''
                  )}
                </td>
              </tr>
            );
          })}

          {/* Custom Bottom Row: Total label directly before Result column slot (No word Summary) */}
          <tr className="bg-stone-100 border-t-2 border-black font-bold h-9">
            <td className="p-1.5 border-r border-black"></td>
            <td className="p-1.5 border-r border-black text-right font-black uppercase text-[18px]">
              TOTAL
            </td>
            {/* Total Result (20%): Font size 18, NO DASHES */}
            <td className="p-1 border-r border-black text-center font-bold text-[18px]">
              {totals.resultTotal || ''}
            </td>
            {/* Total Ends (20%): Font size 18, NO DASHES */}
            <td className="p-1 border-r border-black text-center font-bold text-[18px]">
              {totals.endsTotal || ''}
            </td>
            {/* Total Points (20%): Font size 18, NO DASHES */}
            <td className="p-1 text-center font-bold text-[18px]">
              {totals.pointsTotal || ''}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const PlayerScorecardsView: React.FC<PlayerScorecardsViewProps> = ({
  tournament,
  players,
  onBackToRinks,
  onGoToFlatDraw,
  isPrintPreviewOpen,
  onTogglePrintPreview
}) => {
  const [copied, setCopied] = useState(false);
  const [filterPosition, setFilterPosition] = useState<'all' | 'skip' | 'second' | 'lead'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalPrintPreview, setInternalPrintPreview] = useState(false);
  const [previewFilterPosition, setPreviewFilterPosition] = useState<'all' | 'skip' | 'second' | 'lead'>('all');

  // Start rink selector (1 - 24)
  const [startRink, setStartRink] = useState<number>(1);
  // Display mode for rink column: evaluated number or formula
  const [rinkDisplayMode, setRinkDisplayMode] = useState<'number' | 'formula'>('number');
  // Layout mode for on-screen view: 2x2 Landscape Cards or Full Table
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');

  const isPrintPreviewActive = isPrintPreviewOpen ?? internalPrintPreview;

  const setPreviewActive = (open: boolean) => {
    if (onTogglePrintPreview) {
      onTogglePrintPreview(open);
    }
    setInternalPrintPreview(open);
  };

  useEffect(() => {
    if (!isPrintPreviewActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintPreviewActive]);

  // Tracking field scores stored by key: `${playerId}-round-${roundNumber}`
  const [scores, setScores] = useState<Record<string, ScoreRecord>>({});

  const handleScoreChange = (
    playerId: string,
    roundNumber: number,
    field: keyof ScoreRecord,
    value: string
  ) => {
    const key = `${playerId}-round-${roundNumber}`;
    setScores((prev) => ({
      ...prev,
      [key]: {
        result: prev[key]?.result || '',
        ends: prev[key]?.ends || '',
        points: prev[key]?.points || '',
        [field]: value
      }
    }));
  };

  const handleClearScores = () => {
    if (Object.keys(scores).length === 0) return;
    if (window.confirm('Clear all entered tracking fields (Result, Ends, Points)?')) {
      setScores({});
    }
  };

  // Group rows dynamically by player number
  const playerGroups: PlayerScorecardGroup[] = useMemo(() => {
    // Sort players strictly by bowler number (1, 2, 3...)
    const sorted = [...players].sort((a, b) => a.bowlerNumber - b.bowlerNumber);

    return sorted.map((player) => {
      const roleHeading = evaluatePlayerRoleHeading(player.bowlerNumber);

      const matches: MatchRowData[] = tournament.rounds.map((round) => {
        let rinkNumber = 1;
        let teamColor: 'Red' | 'Blue' = 'Red';
        let teamNumbers: number[] = [];
        let oppositionNumbers: number[] = [];

        round.rinks.forEach((r) => {
          const teamA = [r.teamA.skip, r.teamA.second, r.teamA.lead];
          const teamB = [r.teamB.skip, r.teamB.second, r.teamB.lead];

          if (teamA.some((p) => p.bowlerNumber === player.bowlerNumber)) {
            rinkNumber = r.rinkNumber;
            teamColor = 'Red';
            teamNumbers = teamA.map((p) => p.bowlerNumber).sort((a, b) => a - b);
            oppositionNumbers = teamB.map((p) => p.bowlerNumber).sort((a, b) => a - b);
          } else if (teamB.some((p) => p.bowlerNumber === player.bowlerNumber)) {
            rinkNumber = r.rinkNumber;
            teamColor = 'Blue';
            teamNumbers = teamB.map((p) => p.bowlerNumber).sort((a, b) => a - b);
            oppositionNumbers = teamA.map((p) => p.bowlerNumber).sort((a, b) => a - b);
          }
        });

        return {
          roundNumber: round.roundNumber,
          rinkNumber,
          // Precede all numeric rink values with the dynamic text prefix =startrink-1+
          rinkFormula: `=startrink-1+${rinkNumber}`,
          teamColor,
          teamNumbers,
          oppositionNumbers
        };
      });

      return {
        player,
        roleHeading,
        matches
      };
    });
  }, [players, tournament]);

  // Filtered player groups
  const filteredGroups: PlayerScorecardGroup[] = useMemo(() => {
    return playerGroups.filter((group) => {
      if (filterPosition !== 'all' && group.player.position !== filterPosition) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = String(group.player.bowlerNumber).includes(q);
        const nameMatch = group.player.name.toLowerCase().includes(q);
        return numMatch || nameMatch;
      }
      return true;
    });
  }, [playerGroups, filterPosition, searchQuery]);

  // Calculate totals for a player group
  const getPlayerTotals = (playerId: string) => {
    let totalWins = 0;
    let totalLosses = 0;
    let totalDraws = 0;
    let totalEnds = 0;
    let totalPoints = 0;
    let hasResultValues = false;
    let hasEndsValues = false;
    let hasPointsValues = false;

    [1, 2, 3].forEach((roundNum) => {
      const rec = scores[`${playerId}-round-${roundNum}`];
      if (rec) {
        if (rec.result.trim()) {
          hasResultValues = true;
          const upper = rec.result.trim().toUpperCase();
          if (upper === 'W' || upper === 'WIN') totalWins++;
          else if (upper === 'L' || upper === 'LOSS') totalLosses++;
          else if (upper === 'D' || upper === 'DRAW') totalDraws++;
        }
        if (rec.ends.trim() && !isNaN(Number(rec.ends))) {
          hasEndsValues = true;
          totalEnds += Number(rec.ends);
        }
        if (rec.points.trim() && !isNaN(Number(rec.points))) {
          hasPointsValues = true;
          totalPoints += Number(rec.points);
        }
      }
    });

    let resultSummary = '';
    if (hasResultValues) {
      const parts = [];
      if (totalWins > 0) parts.push(`${totalWins}W`);
      if (totalDraws > 0) parts.push(`${totalDraws}D`);
      if (totalLosses > 0) parts.push(`${totalLosses}L`);
      resultSummary = parts.length > 0 ? parts.join(' ') : '';
    }

    return {
      resultTotal: resultSummary,
      endsTotal: hasEndsValues ? String(totalEnds) : '',
      pointsTotal: hasPointsValues ? String(totalPoints) : ''
    };
  };

  // Copy full scorecard table in clean TSV format for spreadsheet pasting
  const handleCopyScorecards = () => {
    let tsv = '';

    playerGroups.forEach((group) => {
      const roleTitle = getPlayerPositionTitle(group.player);

      // Main header for player (clean without Skips/0-29 box)
      tsv += `${roleTitle} ${group.player.bowlerNumber} — ${group.player.name}\t\t\t\t\n`;

      // Header row for group under main header for player
      tsv += `Rink\tTeam\tResult\tEnds\tPoints\n`;

      // 3 match rows
      group.matches.forEach((m) => {
        const key = `${group.player.id}-round-${m.roundNumber}`;
        const score = scores[key] || { result: '', ends: '', points: '' };
        const calculatedRink = startRink - 1 + m.rinkNumber;
        const rinkText = rinkDisplayMode === 'formula' ? m.rinkFormula : `${calculatedRink}`;
        tsv += `${rinkText}\t${m.teamNumbers.join(', ')}\t${score.result}\t${score.ends}\t${score.points}\n`;
      });

      // Anchored custom bottom row: Total label directly before Result column slot
      const { resultTotal, endsTotal, pointsTotal } = getPlayerTotals(group.player.id);
      tsv += `\tTotal\t${resultTotal}\t${endsTotal}\t${pointsTotal}\n`;

      // Separating each group with 2 empty spacing lines
      tsv += `\n\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const previewGroups: PlayerScorecardGroup[] = useMemo(() => {
    if (previewFilterPosition === 'all') return playerGroups;
    return playerGroups.filter((g) => g.player.position === previewFilterPosition);
  }, [playerGroups, previewFilterPosition]);

  const skipsCount = useMemo(() => playerGroups.filter((g) => g.player.position === 'skip').length, [playerGroups]);
  const secondsCount = useMemo(() => playerGroups.filter((g) => g.player.position === 'second').length, [playerGroups]);
  const leadsCount = useMemo(() => playerGroups.filter((g) => g.player.position === 'lead').length, [playerGroups]);

  const handlePrint = () => {
    setPreviewActive(true);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleOpenPrintWindow = () => {
    try {
      const printWin = window.open('', '_blank');
      if (!printWin) {
        window.print();
        return;
      }

      const pages = chunkArray(previewGroups, 4);
      let pagesHtml = '';

      pages.forEach((page) => {
        pagesHtml += `<div class="scorecard-landscape-page">`;
        page.forEach((group) => {
          const roleTitle = getPlayerPositionTitle(group.player);
          const { resultTotal, endsTotal, pointsTotal } = getPlayerTotals(group.player.id);

          pagesHtml += `
            <div class="scorecard-card">
              <div class="card-header">
                <div class="card-header-left">
                  <span class="role-title">${roleTitle} ${group.player.bowlerNumber}</span>
                  <span class="player-name">(${escapeHtml(group.player.name)})</span>
                </div>
              </div>
              <table class="card-table">
                <thead>
                  <tr>
                    <th class="col-rink">Rink</th>
                    <th class="col-team">Team</th>
                    <th class="col-res">Result</th>
                    <th class="col-ends">Ends</th>
                    <th class="col-pts">Points</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.matches.map((m) => {
                    const scoreKey = `${group.player.id}-round-${m.roundNumber}`;
                    const currentScore = scores[scoreKey] || { result: '', ends: '', points: '' };
                    const calculatedRink = startRink - 1 + m.rinkNumber;
                    const rinkText = rinkDisplayMode === 'formula' ? escapeHtml(m.rinkFormula) : `${calculatedRink}`;
                    return `
                      <tr>
                        <td class="col-rink font-bold">${rinkText}</td>
                        <td class="col-team font-bold">${m.teamNumbers.join(', ')}</td>
                        <td class="col-res">${currentScore.result ? escapeHtml(currentScore.result) : '&nbsp;'}</td>
                        <td class="col-ends">${currentScore.ends ? escapeHtml(currentScore.ends) : '&nbsp;'}</td>
                        <td class="col-pts">${currentScore.points ? escapeHtml(currentScore.points) : '&nbsp;'}</td>
                      </tr>
                    `;
                  }).join('')}
                  <tr class="total-row">
                    <td class="col-rink"></td>
                    <td class="col-team text-right bold">TOTAL</td>
                    <td class="col-res">${resultTotal ? escapeHtml(resultTotal) : '&nbsp;'}</td>
                    <td class="col-ends">${endsTotal ? escapeHtml(endsTotal) : '&nbsp;'}</td>
                    <td class="col-pts">${pointsTotal ? escapeHtml(pointsTotal) : '&nbsp;'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        });
        pagesHtml += `</div>`;
      });

      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lawn Bowls Player Scorecards (2x2 Landscape)</title>
  <style>
    @page {
      size: landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #fff;
      color: #000;
      font-size: 18px;
    }
    .scorecard-landscape-page {
      width: 100%;
      height: 100vh;
      max-height: 194mm;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8mm;
      page-break-after: always;
      break-after: page;
      padding: 0;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .scorecard-landscape-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .scorecard-card {
      border: 2px solid #000;
      border-radius: 4px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #fff;
      height: 100%;
      box-sizing: border-box;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .card-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .role-title {
      font-size: 19px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .player-name {
      font-size: 18px;
      color: #111;
      font-weight: 600;
    }
    .card-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 18px;
      table-layout: fixed;
    }
    .card-table th, .card-table td {
      border: 1.5px solid #000;
      padding: 6px 6px;
      line-height: 1.25;
    }
    .card-table th {
      background: #f0f0f0;
      font-weight: bold;
      font-size: 16px;
      text-transform: uppercase;
    }
    .col-rink { width: 16%; text-align: left; }
    .col-team { width: 24%; text-align: left; }
    .col-res  { width: 20%; text-align: center; font-weight: bold; }
    .col-ends { width: 20%; text-align: center; font-weight: bold; }
    .col-pts  { width: 20%; text-align: center; font-weight: bold; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .font-bold { font-weight: bold; }
    .total-row {
      background: #f5f5f5;
      font-weight: bold;
    }
    .total-row td {
      border-top: 2px solid #000;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  ${pagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`);
      printWin.document.close();
    } catch (e) {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Scorecards Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="scorecards-back-rinks-btn"
              onClick={onBackToRinks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer border border-stone-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rink Cards</span>
            </button>

            <button
              type="button"
              id="scorecards-go-flat-btn"
              onClick={onGoToFlatDraw}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition cursor-pointer border border-amber-300"
            >
              <TableIcon className="w-3.5 h-3.5 text-amber-800" />
              <span>Flat Draw</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-stone-900">
                  Player Scorecards
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Dynamic Player Groups
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Each player grouped with role heading aligned to Rink, =startrink-1+ formula, Result/Ends/Points tracking, anchored Total row, and 2 empty spacing lines.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Start Rink Selector (1 - 24) */}
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-300">
              <label htmlFor="startrink-select" className="text-xs font-black uppercase text-stone-700 tracking-wider">
                Start Rink:
              </label>
              <select
                id="startrink-select"
                value={startRink}
                onChange={(e) => setStartRink(Number(e.target.value))}
                className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-black text-stone-900 cursor-pointer focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Rink {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Rink Format: Calculated # vs Formula */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-300">
              <button
                type="button"
                id="rink-mode-number-btn"
                onClick={() => setRinkDisplayMode('number')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  rinkDisplayMode === 'number'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
                title={`Show calculated Rink numbers (starts at Rink ${startRink})`}
              >
                Rink #
              </button>
              <button
                type="button"
                id="rink-mode-formula-btn"
                onClick={() => setRinkDisplayMode('formula')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  rinkDisplayMode === 'formula'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
                title="Show Excel formula =startrink-1+X"
              >
                Formula
              </button>
            </div>

            {/* Layout Mode: 2x2 Cards vs Full Table */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-300">
              <button
                type="button"
                id="view-mode-cards-btn"
                onClick={() => setLayoutMode('cards')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  layoutMode === 'cards'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>2x2 Cards</span>
              </button>
              <button
                type="button"
                id="view-mode-table-btn"
                onClick={() => setLayoutMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  layoutMode === 'table'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {Object.keys(scores).length > 0 && (
              <button
                type="button"
                id="clear-scorecard-fields-btn"
                onClick={handleClearScores}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-semibold border border-stone-300 transition cursor-pointer"
                title="Clear all entered Result, Ends, and Points"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              id="copy-scorecards-btn"
              onClick={handleCopyScorecards}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-300 transition cursor-pointer"
              title="Copy scorecard tables with 2 empty spacing lines to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-600" />
                  <span>Copy TSV</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="print-scorecards-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              title="Print all player scorecards (2x2 Landscape)"
            >
              <Printer className="w-4 h-4" />
              <span>Print Scorecards</span>
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
                id={`filter-scorecards-${pos}`}
                onClick={() => setFilterPosition(pos)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterPosition === pos
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {pos === 'all'
                  ? 'All Bowlers'
                  : pos === 'skip'
                  ? 'Skips (0–29)'
                  : pos === 'second'
                  ? 'Seconds (31–59)'
                  : 'Leads (over 60)'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search player number or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 w-52 sm:w-60 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Main Scorecard View: 2x2 Landscape Cards or Full Table */}
      {layoutMode === 'cards' ? (
        <div className="space-y-6 no-print">
          {chunkArray(filteredGroups, 4).map((page, pageIdx) => (
            <div
              key={pageIdx}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-stone-900 text-white px-2.5 py-1 rounded-lg">
                    Page {pageIdx + 1}
                  </span>
                  <span className="text-xs font-semibold text-stone-600">
                    4 Scorecards (2x2 Landscape Layout • Font size 18 • Empty cells clean)
                  </span>
                </div>
                <div className="text-xs font-mono text-stone-500">
                  Start Rink: {startRink} • {rinkDisplayMode === 'formula' ? '=startrink-1+X' : 'Evaluated Rink #'}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {page.map((group) => {
                  const totals = getPlayerTotals(group.player.id);
                  return (
                    <ScorecardCard
                      key={group.player.id}
                      group={group}
                      startRink={startRink}
                      rinkDisplayMode={rinkDisplayMode}
                      scores={scores}
                      onScoreChange={handleScoreChange}
                      totals={totals}
                      isInteractive={true}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 text-xs">
              No bowler scorecards found matching your filter or search.
            </div>
          )}
        </div>
      ) : (
        /* Full Table Mode with Font size 18 and No Dashes */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-[18px]">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[24%]" />
                <col className="w-[20%] text-center" />
                <col className="w-[20%] text-center" />
                <col className="w-[20%] text-center" />
              </colgroup>
              <tbody>
                {filteredGroups.map((group) => {
                  const roleTitle = getPlayerPositionTitle(group.player);
                  const { resultTotal, endsTotal, pointsTotal } = getPlayerTotals(group.player.id);

                  return (
                    <React.Fragment key={group.player.id}>
                      {/* Main Header Row for Player */}
                      <tr
                        id={`scorecard-player-${group.player.bowlerNumber}`}
                        className="bg-stone-100 border-t-2 border-b border-stone-300 font-bold"
                      >
                        <td colSpan={2} className="py-2.5 px-4 text-[18px] font-black text-stone-900 border-r border-stone-200">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-black ${
                                group.player.position === 'skip'
                                  ? 'bg-emerald-600 text-white'
                                  : group.player.position === 'second'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-sky-600 text-white'
                              }`}
                            >
                              {group.player.bowlerNumber}
                            </span>
                            <span className="text-[18px] font-black text-stone-900">
                              {roleTitle} {group.player.bowlerNumber}
                            </span>
                            <span className="font-semibold text-stone-700 text-[18px] truncate max-w-[220px]">
                              ({group.player.name})
                            </span>
                          </div>
                        </td>

                        <td colSpan={3} className="py-2.5 px-4 border-b border-stone-300"></td>
                      </tr>

                      {/* Header Row under Main Player Header */}
                      <tr className="bg-stone-800 text-white text-[16px] font-bold uppercase tracking-wider">
                        <th className="py-2 px-4 border-r border-stone-700">Rink</th>
                        <th className="py-2 px-4 border-r border-stone-700">Team</th>
                        <th className="py-2 px-2 text-center border-r border-stone-700 bg-emerald-950/50">Result</th>
                        <th className="py-2 px-2 text-center border-r border-stone-700 bg-emerald-950/50">Ends</th>
                        <th className="py-2 px-2 text-center bg-emerald-950/50">Points</th>
                      </tr>

                      {/* 3 Matches */}
                      {group.matches.map((m) => {
                        const scoreKey = `${group.player.id}-round-${m.roundNumber}`;
                        const currentScore = scores[scoreKey] || { result: '', ends: '', points: '' };
                        const calculatedRink = startRink - 1 + m.rinkNumber;
                        const rinkText = rinkDisplayMode === 'formula' ? m.rinkFormula : `${calculatedRink}`;

                        return (
                          <tr
                            key={m.roundNumber}
                            className="border-b border-stone-200 hover:bg-stone-50/70 transition-colors text-[18px]"
                          >
                            <td className="py-2.5 px-4 font-bold text-stone-900 border-r border-stone-200 text-[18px]">
                              <span className="inline-block px-2.5 py-0.5 rounded bg-stone-100 text-stone-900 border border-stone-300 font-bold">
                                {rinkText}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 border-r border-stone-200 font-bold text-[18px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {m.teamNumbers.map((num) => {
                                  const isCurrentPlayer = num === group.player.bowlerNumber;
                                  return (
                                    <span
                                      key={num}
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[18px] font-bold ${
                                        isCurrentPlayer
                                          ? 'bg-emerald-700 text-white ring-1 ring-emerald-400'
                                          : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                                      }`}
                                      title={isCurrentPlayer ? `${roleTitle} ${num} (Self)` : `Teammate ${num}`}
                                    >
                                      {num}
                                      {isCurrentPlayer && (
                                        <span className="ml-1 text-[11px] font-normal opacity-90">*</span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>

                            {/* Result: Font size 18, NO DASHES */}
                            <td className="py-2 px-2 text-center border-r border-stone-200 bg-emerald-50/20">
                              <input
                                type="text"
                                maxLength={6}
                                value={currentScore.result}
                                onChange={(e) =>
                                  handleScoreChange(group.player.id, m.roundNumber, 'result', e.target.value)
                                }
                                className="w-20 text-center font-bold text-[18px] py-1 px-1 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                              />
                            </td>

                            {/* Ends: Font size 18, NO DASHES */}
                            <td className="py-2 px-2 text-center border-r border-stone-200 bg-emerald-50/20">
                              <input
                                type="number"
                                min={0}
                                max={30}
                                value={currentScore.ends}
                                onChange={(e) =>
                                  handleScoreChange(group.player.id, m.roundNumber, 'ends', e.target.value)
                                }
                                className="w-16 text-center font-bold text-[18px] py-1 px-1 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                              />
                            </td>

                            {/* Points: Font size 18, NO DASHES */}
                            <td className="py-2 px-2 text-center bg-emerald-50/20">
                              <input
                                type="number"
                                min={-99}
                                max={99}
                                value={currentScore.points}
                                onChange={(e) =>
                                  handleScoreChange(group.player.id, m.roundNumber, 'points', e.target.value)
                                }
                                className="w-16 text-center font-bold text-[18px] py-1 px-1 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Row */}
                      <tr className="bg-stone-100 border-t-2 border-b-2 border-stone-300 font-bold text-[18px]">
                        <td className="py-2 px-4 border-r border-stone-200"></td>
                        <td className="py-2 px-4 text-right font-black uppercase text-[18px] text-stone-900 tracking-wider border-r border-stone-300">
                          Total
                        </td>
                        <td className="py-2 px-2 text-center text-[18px] font-black text-emerald-950 border-r border-stone-300 bg-emerald-100/70">
                          {resultTotal || ''}
                        </td>
                        <td className="py-2 px-2 text-center text-[18px] font-black text-emerald-950 border-r border-stone-300 bg-emerald-100/70">
                          {endsTotal || ''}
                        </td>
                        <td className="py-2 px-2 text-center text-[18px] font-black text-emerald-950 bg-emerald-100/70">
                          {pointsTotal || ''}
                        </td>
                      </tr>

                      {/* 2 Spacing Lines */}
                      <tr className="h-6 border-0 bg-stone-50/40" aria-hidden="true">
                        <td colSpan={5} className="p-0 border-0 h-6"></td>
                      </tr>
                      <tr className="h-6 border-0 bg-stone-50/40" aria-hidden="true">
                        <td colSpan={5} className="p-0 border-0 h-6"></td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12 text-stone-500 text-xs">
              No bowler scorecards found matching your filter or search.
            </div>
          )}
        </div>
      )}

      {/* Print-Only Scorecard Document: 4 Scorecards per page in 2x2 Landscape */}
      <div className="print-only hidden print:block text-black bg-white font-sans">
        {chunkArray(playerGroups, 4).map((page, pageIdx) => (
          <div key={pageIdx} className="scorecard-landscape-page">
            {page.map((group) => {
              const totals = getPlayerTotals(group.player.id);
              return (
                <ScorecardCard
                  key={group.player.id}
                  group={group}
                  startRink={startRink}
                  rinkDisplayMode={rinkDisplayMode}
                  scores={scores}
                  totals={totals}
                  isInteractive={false}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Interactive In-App Print Preview Modal: 2x2 Landscape Layout */}
      {isPrintPreviewActive && (
        <div
          id="scorecard-print-preview-modal"
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex flex-col no-print animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Scorecards Print Preview"
        >
          {/* Top Modal Action Bar */}
          <div className="bg-stone-900 text-white px-4 sm:px-6 py-3 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Scorecards Print Preview</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    2x2 Landscape • 4 Cards/Page
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  {previewGroups.length} Bowlers ({Math.ceil(previewGroups.length / 4)} Pages) • Font Size 18
                </p>
              </div>
            </div>

            {/* Start Rink Selector inside Preview */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700">
                <label htmlFor="modal-startrink-select" className="text-xs font-bold text-stone-300">
                  Start Rink:
                </label>
                <select
                  id="modal-startrink-select"
                  value={startRink}
                  onChange={(e) => setStartRink(Number(e.target.value))}
                  className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs font-bold text-white cursor-pointer focus:ring-1 focus:ring-emerald-500"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Rink {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rink Display Mode inside Preview */}
              <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded-lg border border-stone-700">
                <button
                  type="button"
                  onClick={() => setRinkDisplayMode('number')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                    rinkDisplayMode === 'number'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Rink #
                </button>
                <button
                  type="button"
                  onClick={() => setRinkDisplayMode('formula')}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                    rinkDisplayMode === 'formula'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Formula
                </button>
              </div>

              {/* Filter Pills in Preview */}
              <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded-lg border border-stone-700">
                <button
                  type="button"
                  id="preview-filter-all"
                  onClick={() => setPreviewFilterPosition('all')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition cursor-pointer ${
                    previewFilterPosition === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  id="preview-filter-skips"
                  onClick={() => setPreviewFilterPosition('skip')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition cursor-pointer ${
                    previewFilterPosition === 'skip'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Skips
                </button>
                <button
                  type="button"
                  id="preview-filter-seconds"
                  onClick={() => setPreviewFilterPosition('second')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition cursor-pointer ${
                    previewFilterPosition === 'second'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Seconds
                </button>
                <button
                  type="button"
                  id="preview-filter-leads"
                  onClick={() => setPreviewFilterPosition('lead')}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition cursor-pointer ${
                    previewFilterPosition === 'lead'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Leads
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                id="preview-open-window-btn"
                onClick={handleOpenPrintWindow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-600 transition cursor-pointer"
                title="Open directly in a dedicated print window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Open in New Tab</span>
                <span className="md:hidden">New Tab</span>
              </button>

              <button
                type="button"
                id="preview-print-now-btn"
                onClick={handleTriggerPrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                title="Open system print dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                id="preview-close-btn"
                onClick={() => setPreviewActive(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                title="Close Print Preview (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Scrollable 2x2 Landscape Pages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-900/80">
            <div className="max-w-5xl mx-auto space-y-8">
              {chunkArray(previewGroups, 4).map((page, pageIdx) => (
                <div
                  key={pageIdx}
                  className="bg-white rounded-lg shadow-2xl border border-stone-300 p-6 sm:p-8 text-stone-900 font-sans"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {page.map((group) => {
                      const totals = getPlayerTotals(group.player.id);
                      return (
                        <ScorecardCard
                          key={group.player.id}
                          group={group}
                          startRink={startRink}
                          rinkDisplayMode={rinkDisplayMode}
                          scores={scores}
                          totals={totals}
                          isInteractive={false}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
