import { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, Rink, BowlerPosition, TournamentDraw } from './types';
import { Header } from './components/Header';
import { PlayerCountSelector } from './components/PlayerCountSelector';
import { TournamentRoundSelector } from './components/TournamentRoundSelector';
import { RinkCard } from './components/RinkCard';
import { FlatDrawView } from './components/FlatDrawView';
import { PlayerScorecardsView } from './components/PlayerScorecardsView';
import { PlayerListModal } from './components/PlayerListModal';
import { PrintScorecardView } from './components/PrintScorecardView';
import {
  generateDefaultPlayers,
  executeTournamentDraw,
  formatTournamentDrawText,
  formatFlatDrawText,
  calculateDrawMetrics
} from './utils/bowlsDraw';
import { Search, X, Sparkles, CheckCircle2, Layers, Table, FileSpreadsheet } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [playerCount, setPlayerCount] = useState<number>(24);
  const [players, setPlayers] = useState<Player[]>(() => generateDefaultPlayers(24, true));
  const [tournament, setTournament] = useState<TournamentDraw | null>(() => executeTournamentDraw(generateDefaultPlayers(24, true), 24));
  const [activeRound, setActiveRound] = useState<number>(1); // 1, 2, 3 or 0 for All
  const [viewMode, setViewMode] = useState<'rinks' | 'flat' | 'scorecards'>('rinks');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [balanceRoles, setBalanceRoles] = useState<boolean>(true);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScorecardsPrintPreviewOpen, setIsScorecardsPrintPreviewOpen] = useState<boolean>(false);

  // Selected player for swapping
  const [swapSelection, setSwapSelection] = useState<{
    player: Player;
    rinkNumber: number;
    teamColor: 'red' | 'blue';
    role: 'skip' | 'second' | 'lead';
    roundNumber: number;
  } | null>(null);

  const rinkCount = Math.floor(playerCount / 6);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Generate 3-round tournament draw
  const handleGenerateDraw = useCallback(() => {
    setIsDrawing(true);
    setSwapSelection(null);

    setTimeout(() => {
      const newTournament = executeTournamentDraw(players, playerCount);
      setTournament(newTournament);
      setIsDrawing(false);
      showToast(`3-Round Draw generated! 100% unique teammates & opponents across all rounds.`);

      // Gentle celebratory confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#047857', '#10b981', '#f59e0b', '#fbbf24']
        });
      } catch (e) {
        // Confetti fallback
      }
    }, 300);
  }, [players, playerCount, showToast]);

  // Initial draw on mount
  useEffect(() => {
    handleGenerateDraw();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle player count change
  const handleCountChange = (newCount: number) => {
    setPlayerCount(newCount);
    setSwapSelection(null);

    const fresh = generateDefaultPlayers(newCount, true);
    setPlayers(fresh);

    setTimeout(() => {
      const newTournament = executeTournamentDraw(fresh, newCount);
      setTournament(newTournament);
      showToast(`Updated to ${newCount} bowlers (${Math.floor(newCount / 6)} rinks) with 3-round schedule`);
    }, 50);
  };

  // Determine current active rounds to display
  const currentRoundsToDisplay = useMemo(() => {
    if (!tournament) return [];
    if (activeRound === 0) {
      return tournament.rounds;
    }
    const single = tournament.rounds.find(r => r.roundNumber === activeRound);
    return single ? [single] : [];
  }, [tournament, activeRound]);

  // Handle swapping two players between rinks or positions in a round
  const handleSelectPlayer = (
    player: Player,
    rinkNumber: number,
    teamColor: 'red' | 'blue',
    role: 'skip' | 'second' | 'lead',
    roundNum?: number
  ) => {
    const effectiveRound = roundNum || (activeRound === 0 ? 1 : activeRound);

    if (!swapSelection) {
      // First player selected
      setSwapSelection({ player, rinkNumber, teamColor, role, roundNumber: effectiveRound });
      showToast(`Selected #${player.bowlerNumber} ${player.name} in Round ${effectiveRound}. Now click another bowler to swap.`);
      return;
    }

    if (swapSelection.player.id === player.id) {
      // Cancelled
      setSwapSelection(null);
      showToast('Swap cancelled.');
      return;
    }

    if (swapSelection.roundNumber !== effectiveRound) {
      showToast(`Please swap bowlers within Round ${swapSelection.roundNumber} or cancel.`);
      return;
    }

    if (!tournament) return;

    // Execute swap in tournament round
    const updatedRounds = tournament.rounds.map((round) => {
      if (round.roundNumber !== effectiveRound) return round;

      const updatedRinks = round.rinks.map((r) => {
        const rinkClone = {
          ...r,
          teamA: { ...r.teamA },
          teamB: { ...r.teamB }
        };

        const assignRole = (team: typeof rinkClone.teamA, targetRole: BowlerPosition, p: Player) => {
          if (targetRole === 'skip') team.skip = p;
          else if (targetRole === 'second') team.second = p;
          else if (targetRole === 'lead') team.lead = p;
        };

        if (r.rinkNumber === swapSelection.rinkNumber) {
          const team = swapSelection.teamColor === 'red' ? rinkClone.teamA : rinkClone.teamB;
          assignRole(team, swapSelection.role, player);
        }

        if (r.rinkNumber === rinkNumber) {
          const team = teamColor === 'red' ? rinkClone.teamA : rinkClone.teamB;
          assignRole(team, role, swapSelection.player);
        }

        return rinkClone;
      });

      return {
        ...round,
        rinks: updatedRinks
      };
    });

    const newMetrics = calculateDrawMetrics(updatedRounds, playerCount, rinkCount);
    setTournament({
      ...tournament,
      rounds: updatedRounds,
      metrics: newMetrics
    });

    showToast(`Swapped #${swapSelection.player.bowlerNumber} ${swapSelection.player.name} with #${player.bowlerNumber} ${player.name}!`);
    setSwapSelection(null);
  };

  // Reset players
  const handleResetToDefault = (useSampleNames: boolean) => {
    const fresh = generateDefaultPlayers(playerCount, useSampleNames);
    setPlayers(fresh);
    const newTournament = executeTournamentDraw(fresh, playerCount);
    setTournament(newTournament);
    showToast(useSampleNames ? 'Loaded sample club bowlers' : 'Reset to Player 1..N');
  };

  // Update players from modal
  const handleUpdatePlayers = (updated: Player[]) => {
    setPlayers(updated);
    const newTournament = executeTournamentDraw(updated, playerCount);
    setTournament(newTournament);
  };

  // Copy draw to clipboard
  const handleCopyDraw = () => {
    if (!tournament) return;
    const text = formatTournamentDrawText(tournament);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('3-Round draw copied to clipboard! Ready to paste into chat or notice.');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Print sheet
  const handlePrint = () => {
    if (viewMode === 'scorecards') {
      setIsScorecardsPrintPreviewOpen(true);
    } else {
      window.print();
    }
  };

  // Filtered rinks or search counts
  const matchingBowlersCount = useMemo(() => {
    if (!searchQuery.trim() || !tournament) return 0;
    const q = searchQuery.toLowerCase().trim();
    let count = 0;
    tournament.rounds.forEach((round) => {
      round.rinks.forEach((r) => {
        [r.teamA.skip, r.teamA.second, r.teamA.lead, r.teamB.skip, r.teamB.second, r.teamB.lead].forEach((p) => {
          if (p.name.toLowerCase().includes(q) || String(p.bowlerNumber).includes(q)) {
            count++;
          }
        });
      });
    });
    return count;
  }, [tournament, searchQuery]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const firstRoundRinks = tournament?.rounds[0]?.rinks || [];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 selection:bg-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-stone-700 animate-in fade-in slide-in-from-bottom-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        playerCount={playerCount}
        rinkCount={rinkCount}
        onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
        onPrint={handlePrint}
        onCopyDraw={handleCopyDraw}
        copied={copied}
        hasDraw={tournament !== null}
        viewMode={viewMode}
        onSelectViewMode={(mode) => setViewMode(mode)}
        isFlatDraw={viewMode === 'flat'}
        onToggleFlatDraw={() => setViewMode((prev) => (prev === 'flat' ? 'rinks' : 'flat'))}
        isScorecards={viewMode === 'scorecards'}
        onToggleScorecards={() => setViewMode((prev) => (prev === 'scorecards' ? 'rinks' : 'scorecards'))}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8">
        
        {/* Selector Section: Player Count (Multiples of 6) */}
        <PlayerCountSelector
          playerCount={playerCount}
          onCountChange={handleCountChange}
          onGenerateDraw={handleGenerateDraw}
          isDrawing={isDrawing}
          hasDraw={tournament !== null}
          balanceRoles={balanceRoles}
          onToggleBalanceRoles={(enabled) => setBalanceRoles(enabled)}
        />

        {/* 3-Round Tournament Navigation & Optimization Metrics */}
        {tournament && (
          <TournamentRoundSelector
            tournament={tournament}
            activeRound={activeRound}
            onSelectRound={(r) => {
              setActiveRound(r);
              setViewMode('rinks');
            }}
            players={players}
            viewMode={viewMode}
            onSelectViewMode={(mode) => setViewMode(mode)}
            isFlatDraw={viewMode === 'flat'}
            onToggleFlatDraw={() => setViewMode((prev) => (prev === 'flat' ? 'rinks' : 'flat'))}
            isScorecards={viewMode === 'scorecards'}
            onToggleScorecards={() => setViewMode((prev) => (prev === 'scorecards' ? 'rinks' : 'scorecards'))}
          />
        )}

        {/* View Mode: Flat Draw View */}
        {tournament && viewMode === 'flat' ? (
          <FlatDrawView
            tournament={tournament}
            players={players}
            onBackToRinks={() => setViewMode('rinks')}
            onGoToScorecards={() => setViewMode('scorecards')}
            onPrint={handlePrint}
          />
        ) : tournament && viewMode === 'scorecards' ? (
          <PlayerScorecardsView
            tournament={tournament}
            players={players}
            onBackToRinks={() => setViewMode('rinks')}
            onGoToFlatDraw={() => setViewMode('flat')}
            isPrintPreviewOpen={isScorecardsPrintPreviewOpen}
            onTogglePrintPreview={setIsScorecardsPrintPreviewOpen}
          />
        ) : (
          <>
            {/* Swap Alert Banner if a player is currently selected */}
            {swapSelection && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between shadow-xs no-print animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm">
                    ⇄
                  </span>
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      Swapping: <span className="underline">{swapSelection.player.name}</span> (#{swapSelection.player.bowlerNumber} • {swapSelection.role.toUpperCase()} on Rink {swapSelection.rinkNumber} — Round {swapSelection.roundNumber})
                    </p>
                    <p className="text-xs text-amber-800">
                      Click any other bowler in Round {swapSelection.roundNumber} to swap them, or cancel below.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSwapSelection(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Swap</span>
                </button>
              </div>
            )}

            {/* Search / Filter Bar & Draw Details Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 no-print">
              <div>
                <h2 className="text-xl font-bold font-heading text-stone-900 flex items-center gap-2">
                  <span>
                    {activeRound === 0 ? 'All 3 Rounds Schedule' : `Round ${activeRound} Rink Allocations`}
                  </span>
                  <span className="text-xs font-medium text-stone-500 bg-stone-200 px-2.5 py-0.5 rounded-full">
                    {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'} • {playerCount} Bowlers
                  </span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Position blocks active: <strong>Skips (1+)</strong>, <strong>Seconds (30+)</strong>, <strong>Leads (60+)</strong>. 100% unique teammates & opponents.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    id="search-bowler-input"
                    type="text"
                    placeholder="Find a bowler..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 w-48 sm:w-56"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                    {matchingBowlersCount} found
                  </span>
                )}
              </div>
            </div>

            {/* Display Current Round(s) Rinks */}
            {currentRoundsToDisplay.map((round) => (
              <div key={round.roundNumber} className="mb-8 no-print">
                {activeRound === 0 && (
                  <div className="flex items-center justify-between bg-stone-200/80 px-4 py-2 rounded-xl mb-3 border border-stone-300">
                    <span className="font-bold text-stone-800 text-sm tracking-wide uppercase">
                      Round {round.roundNumber} of 3
                    </span>
                    <span className="text-xs font-medium text-stone-600">
                      {round.rinks.length} {round.rinks.length === 1 ? 'Rink' : 'Rinks'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {round.rinks.map((rink) => (
                    <RinkCard
                      key={rink.id}
                      rink={rink}
                      selectedPlayerId={swapSelection?.player.id || null}
                      onSelectPlayer={(p, rNum, color, role) => handleSelectPlayer(p, rNum, color, role, round.roundNumber)}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state safeguard */}
        {(!tournament || tournament.rounds.length === 0) && (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Ready for Lawn Bowls Draw</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-1 mb-4">
              Select your number of bowlers in multiples of 6 (e.g. 18, 24, 30) and roll the draw!
            </p>
            <button
              onClick={handleGenerateDraw}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm"
            >
              Generate 3-Round Draw
            </button>
          </div>
        )}

        {/* Print-only View (rendered when user prints in rink cards mode) */}
        {viewMode === 'rinks' && (
          <PrintScorecardView
            rinks={firstRoundRinks}
            tournament={tournament}
            activeRound={activeRound}
            playerCount={playerCount}
            dateStr={todayStr}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-stone-50 border-t border-stone-200 py-4 px-6 text-center text-xs text-stone-500 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Lawn Bowls Triples Rink Draw • Multiples of 6 Players</span>
          <span className="text-stone-600">3-Round Optimization: 100% Unique Teammates & Positional Matchups</span>
        </div>
      </footer>

      {/* Bowler Names Modal */}
      <PlayerListModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        players={players}
        playerCount={playerCount}
        onUpdatePlayers={handleUpdatePlayers}
        onResetToDefault={handleResetToDefault}
      />

      {/* Mobile Fixed Bottom Navigation Bar (Phone Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-300 shadow-2xl px-3 py-2 sm:hidden flex items-center justify-around no-print"
      >
        <button
          type="button"
          id="mobile-bottom-nav-rinks"
          onClick={() => setViewMode('rinks')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer ${
            viewMode === 'rinks'
              ? 'text-emerald-900 font-bold bg-emerald-100 ring-1 ring-emerald-300 shadow-xs'
              : 'text-stone-600 font-medium hover:text-stone-900'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-bold">Rinks</span>
        </button>

        <button
          type="button"
          id="mobile-bottom-nav-flat"
          onClick={() => setViewMode('flat')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer ${
            viewMode === 'flat'
              ? 'text-emerald-950 font-black bg-amber-400 ring-1 ring-amber-500 shadow-xs'
              : 'text-stone-600 font-medium hover:text-stone-900'
          }`}
        >
          <Table className="w-5 h-5 mb-0.5 text-emerald-950" />
          <span className="text-[11px] font-bold">Flat Draw</span>
        </button>

        <button
          type="button"
          id="mobile-bottom-nav-scorecards"
          onClick={() => setViewMode('scorecards')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer ${
            viewMode === 'scorecards'
              ? 'text-emerald-950 font-black bg-amber-400 ring-1 ring-amber-500 shadow-xs'
              : 'text-stone-600 font-medium hover:text-stone-900'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 mb-0.5 text-emerald-950" />
          <span className="text-[11px] font-bold">Scorecards</span>
        </button>
      </nav>
    </div>
  );
}
