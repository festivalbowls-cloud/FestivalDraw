import { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, Rink, BowlerPosition } from './types';
import { Header } from './components/Header';
import { PlayerCountSelector } from './components/PlayerCountSelector';
import { RinkCard } from './components/RinkCard';
import { PlayerListModal } from './components/PlayerListModal';
import { PrintScorecardView } from './components/PrintScorecardView';
import { generateDefaultPlayers, executeDraw, formatDrawText } from './utils/bowlsDraw';
import { Search, RotateCcw, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [playerCount, setPlayerCount] = useState<number>(24);
  const [players, setPlayers] = useState<Player[]>(() => generateDefaultPlayers(48, true));
  const [rinks, setRinks] = useState<Rink[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [balanceRoles, setBalanceRoles] = useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected player for swapping
  const [swapSelection, setSwapSelection] = useState<{
    player: Player;
    rinkNumber: number;
    teamColor: 'red' | 'blue';
    role: 'skip' | 'second' | 'lead';
  } | null>(null);

  const rinkCount = Math.floor(playerCount / 6);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Generate draw function
  const handleGenerateDraw = useCallback(() => {
    setIsDrawing(true);
    setSwapSelection(null);

    // Make sure we have enough players
    const activePlayers = players.slice(0, playerCount);

    setTimeout(() => {
      const newRinks = executeDraw(activePlayers, balanceRoles);
      setRinks(newRinks);
      setIsDrawing(false);
      showToast(`Draw generated for ${playerCount} bowlers (${rinkCount} rinks)!`);

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
    }, 350);
  }, [players, playerCount, balanceRoles, rinkCount, showToast]);

  // Initial draw on mount
  useEffect(() => {
    handleGenerateDraw();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle player count change
  const handleCountChange = (newCount: number) => {
    setPlayerCount(newCount);
    setSwapSelection(null);

    // If needed, expand players list
    if (newCount > players.length) {
      const additional = generateDefaultPlayers(newCount, true);
      setPlayers((prev) => {
        const merged = [...prev];
        for (let i = prev.length; i < newCount; i++) {
          merged.push(additional[i] || { id: `p-${i + 1}`, name: `Player ${i + 1}`, rolePreference: 'any' });
        }
        return merged;
      });
    }

    // Auto update draw
    setTimeout(() => {
      const activePlayers = players.slice(0, newCount);
      const newRinks = executeDraw(activePlayers, balanceRoles);
      setRinks(newRinks);
      showToast(`Updated to ${newCount} bowlers (${Math.floor(newCount / 6)} rinks)`);
    }, 50);
  };

  // Handle swapping two players between rinks or positions
  const handleSelectPlayer = (
    player: Player,
    rinkNumber: number,
    teamColor: 'red' | 'blue',
    role: 'skip' | 'second' | 'lead'
  ) => {
    if (!swapSelection) {
      // First player selected
      setSwapSelection({ player, rinkNumber, teamColor, role });
      showToast(`Selected ${player.name}. Now click another bowler to swap.`);
      return;
    }

    if (swapSelection.player.id === player.id) {
      // Cancelled
      setSwapSelection(null);
      showToast('Swap cancelled.');
      return;
    }

    // Execute swap between swapSelection and currently clicked player
    const updatedRinks = rinks.map((r) => {
      const rinkClone = {
        ...r,
        teamA: { ...r.teamA },
        teamB: { ...r.teamB }
      };

      // Helper to assign role in a team
      const assignRole = (team: typeof rinkClone.teamA, targetRole: BowlerPosition, p: Player) => {
        if (targetRole === 'skip') team.skip = p;
        else if (targetRole === 'second') team.second = p;
        else if (targetRole === 'lead') team.lead = p;
      };

      // Check if this rink has slot 1
      if (r.rinkNumber === swapSelection.rinkNumber) {
        const team = swapSelection.teamColor === 'red' ? rinkClone.teamA : rinkClone.teamB;
        assignRole(team, swapSelection.role, player);
      }

      // Check if this rink has slot 2
      if (r.rinkNumber === rinkNumber) {
        const team = teamColor === 'red' ? rinkClone.teamA : rinkClone.teamB;
        assignRole(team, role, swapSelection.player);
      }

      return rinkClone;
    });

    setRinks(updatedRinks);
    showToast(`Swapped ${swapSelection.player.name} with ${player.name}!`);
    setSwapSelection(null);
  };

  // Reset players
  const handleResetToDefault = (useSampleNames: boolean) => {
    const fresh = generateDefaultPlayers(playerCount, useSampleNames);
    setPlayers(fresh);
    const newRinks = executeDraw(fresh, balanceRoles);
    setRinks(newRinks);
    showToast(useSampleNames ? 'Loaded sample club bowlers' : 'Reset to Player 1..N');
  };

  // Update players from modal
  const handleUpdatePlayers = (updated: Player[]) => {
    setPlayers(updated);
    const newRinks = executeDraw(updated.slice(0, playerCount), balanceRoles);
    setRinks(newRinks);
  };

  // Copy draw to clipboard
  const handleCopyDraw = () => {
    const text = formatDrawText(rinks);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Draw copied to clipboard! Ready to paste into chat or notice.');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Print sheet
  const handlePrint = () => {
    window.print();
  };

  // Filtered rinks or search counts
  const matchingBowlersCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase().trim();
    let count = 0;
    rinks.forEach((r) => {
      [r.teamA.skip, r.teamA.second, r.teamA.lead, r.teamB.skip, r.teamB.second, r.teamB.lead].forEach((p) => {
        if (p.name.toLowerCase().includes(q)) count++;
      });
    });
    return count;
  }, [rinks, searchQuery]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

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
        hasDraw={rinks.length > 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Selector Section: Player Count (Multiples of 6) */}
        <PlayerCountSelector
          playerCount={playerCount}
          onCountChange={handleCountChange}
          onGenerateDraw={handleGenerateDraw}
          isDrawing={isDrawing}
          hasDraw={rinks.length > 0}
          balanceRoles={balanceRoles}
          onToggleBalanceRoles={(enabled) => setBalanceRoles(enabled)}
        />

        {/* Swap Alert Banner if a player is currently selected */}
        {swapSelection && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between shadow-xs no-print animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm">
                ⇄
              </span>
              <div>
                <p className="text-sm font-bold text-amber-950">
                  Swapping: <span className="underline">{swapSelection.player.name}</span> (Rink {swapSelection.rinkNumber}, {swapSelection.role.toUpperCase()})
                </p>
                <p className="text-xs text-amber-800">
                  Click any other bowler on any rink to swap them, or cancel below.
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
              <span>Rink Allocations</span>
              <span className="text-xs font-medium text-stone-500 bg-stone-200 px-2.5 py-0.5 rounded-full">
                {rinkCount} {rinkCount === 1 ? 'Rink' : 'Rinks'} • {playerCount} Bowlers
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Each rink is a Triples game: Skip, Second, Lead vs Skip, Second, Lead. Click any bowler to swap.
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

        {/* Rinks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 no-print">
          {rinks.map((rink) => (
            <RinkCard
              key={rink.id}
              rink={rink}
              selectedPlayerId={swapSelection?.player.id || null}
              onSelectPlayer={handleSelectPlayer}
              searchQuery={searchQuery}
            />
          ))}
        </div>

        {/* Empty state safeguard */}
        {rinks.length === 0 && (
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
              Generate Draw Now
            </button>
          </div>
        )}

        {/* Print-only View (rendered when user prints) */}
        <PrintScorecardView
          rinks={rinks}
          playerCount={playerCount}
          dateStr={todayStr}
        />

      </main>

      {/* Footer */}
      <footer className="bg-stone-50 border-t border-stone-200 py-4 px-6 text-center text-xs text-stone-500 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Lawn Bowls Triples Rink Draw • Multiples of 6 Players</span>
          <span className="text-stone-600">Standard Club Triples: Lead, Second, Skip</span>
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
    </div>
  );
}
