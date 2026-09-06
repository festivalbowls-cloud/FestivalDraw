import React, { useState } from 'react';
import { TournamentDraw, Player } from '../types';
import { Award, CheckCircle2, Calendar, UserCheck, ChevronDown, ChevronUp, Layers, Table, FileSpreadsheet } from 'lucide-react';

interface TournamentRoundSelectorProps {
  tournament: TournamentDraw | null;
  activeRound: number; // 1, 2, 3 or 0 for "all"
  onSelectRound: (round: number) => void;
  players: Player[];
  viewMode?: 'rinks' | 'flat' | 'scorecards';
  onSelectViewMode?: (mode: 'rinks' | 'flat' | 'scorecards') => void;
  isFlatDraw?: boolean;
  onToggleFlatDraw?: () => void;
  isScorecards?: boolean;
  onToggleScorecards?: () => void;
}

export const TournamentRoundSelector: React.FC<TournamentRoundSelectorProps> = ({
  tournament,
  activeRound,
  onSelectRound,
  players,
  viewMode = 'rinks',
  onSelectViewMode,
  isFlatDraw,
  onToggleFlatDraw,
  isScorecards,
  onToggleScorecards
}) => {
  const [showBowlerSchedule, setShowBowlerSchedule] = useState(false);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>('');

  if (!tournament) return null;

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

  const { metrics, rounds, rinkCount } = tournament;

  // Selected player itinerary
  const selectedBowler = players.find(p => p.id === selectedBowlerId) || players[0];

  const getBowlerItinerary = (bowler: Player) => {
    return rounds.map(round => {
      let foundRink: number | null = null;
      let teamColor: 'Red' | 'Blue' | null = null;
      let teammates: string[] = [];
      let opponent: string = '';

      round.rinks.forEach(r => {
        if (r.teamA.skip.bowlerNumber === bowler.bowlerNumber ||
            r.teamA.second.bowlerNumber === bowler.bowlerNumber ||
            r.teamA.lead.bowlerNumber === bowler.bowlerNumber) {
          foundRink = r.rinkNumber;
          teamColor = 'Red';
          const team = [r.teamA.skip, r.teamA.second, r.teamA.lead].filter(p => p.bowlerNumber !== bowler.bowlerNumber);
          teammates = team.map(p => `#${p.bowlerNumber} ${p.name}`);
          if (bowler.position === 'skip') opponent = `#${r.teamB.skip.bowlerNumber} ${r.teamB.skip.name} (Skip)`;
          else if (bowler.position === 'second') opponent = `#${r.teamB.second.bowlerNumber} ${r.teamB.second.name} (Second)`;
          else opponent = `#${r.teamB.lead.bowlerNumber} ${r.teamB.lead.name} (Lead)`;
        } else if (r.teamB.skip.bowlerNumber === bowler.bowlerNumber ||
                   r.teamB.second.bowlerNumber === bowler.bowlerNumber ||
                   r.teamB.lead.bowlerNumber === bowler.bowlerNumber) {
          foundRink = r.rinkNumber;
          teamColor = 'Blue';
          const team = [r.teamB.skip, r.teamB.second, r.teamB.lead].filter(p => p.bowlerNumber !== bowler.bowlerNumber);
          teammates = team.map(p => `#${p.bowlerNumber} ${p.name}`);
          if (bowler.position === 'skip') opponent = `#${r.teamA.skip.bowlerNumber} ${r.teamA.skip.name} (Skip)`;
          else if (bowler.position === 'second') opponent = `#${r.teamA.second.bowlerNumber} ${r.teamA.second.name} (Second)`;
          else opponent = `#${r.teamA.lead.bowlerNumber} ${r.teamA.lead.name} (Lead)`;
        }
      });

      return {
        roundNumber: round.roundNumber,
        rinkNumber: foundRink,
        teamColor,
        teammates,
        opponent
      };
    });
  };

  const bowlerSchedule = selectedBowler ? getBowlerItinerary(selectedBowler) : [];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 mb-6 no-print">
      {/* Top Banner: Round Navigation Tabs + Optimization Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
        
        {/* Left: View Mode Tabs and Round Filter */}
        <div className="w-full lg:w-auto">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tournament Views</span>
              </span>
            </div>

            {/* Primary View Switcher: 3 columns on mobile (fits 100%), inline-flex on desktop */}
            <div className="grid grid-cols-3 sm:inline-flex p-1 bg-stone-100 rounded-xl gap-1 w-full sm:w-auto">
              <button
                type="button"
                id="toggle-rinks-tab"
                onClick={() => handleModeChange('rinks')}
                className={`py-2 px-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentMode === 'rinks'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Rinks</span>
              </button>

              <button
                type="button"
                id="toggle-flat-draw-tab"
                onClick={() => handleModeChange('flat')}
                className={`py-2 px-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentMode === 'flat'
                    ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
                title="Display flat draw isolating each individual player on separate rows"
              >
                <Table className="w-4 h-4 shrink-0 text-amber-700" />
                <span>Flat Draw</span>
              </button>

              <button
                type="button"
                id="toggle-scorecards-tab"
                onClick={() => handleModeChange('scorecards')}
                className={`py-2 px-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentMode === 'scorecards'
                    ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
                title="Display player scorecards grouped dynamically by player number with Result, Ends, Points tracking"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>Scorecards</span>
              </button>
            </div>

            {/* If in Rinks view: Show Round filter directly below */}
            {currentMode === 'rinks' && (
              <div className="pt-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Select Round:
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:inline-flex p-1 bg-stone-50 border border-stone-200 rounded-xl gap-1 w-full sm:w-auto">
                  {[1, 2, 3].map((roundNum) => (
                    <button
                      key={roundNum}
                      type="button"
                      id={`round-tab-${roundNum}`}
                      onClick={() => onSelectRound(roundNum)}
                      className={`py-1.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
                        activeRound === roundNum
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                      }`}
                    >
                      <span>Round {roundNum}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    id="round-tab-all"
                    onClick={() => onSelectRound(0)}
                    className={`py-1.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
                      activeRound === 0
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
                    }`}
                  >
                    <span>All 3</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Optimization Verification Metrics */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unique Teammates Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">{metrics.uniqueTeammatesPercent}% Unique Teammates</span>
              <span className="text-[10px] block text-emerald-700 font-medium">Never paired together twice</span>
            </div>
          </div>

          {/* Unique Opponents Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <span className="font-bold">{metrics.uniquePositionalOpponentsPercent}% Unique Opponents</span>
              <span className="text-[10px] block text-sky-700 font-medium">Fresh Skip/Sec/Lead matchups</span>
            </div>
          </div>

          {/* Rink Rotation Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-950 border border-amber-200 text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">
                {rinkCount >= 3 ? '100% Unique Rinks' : `Max ${metrics.maxRinkVisitsPerPlayer} on Same Rink`}
              </span>
              <span className="text-[10px] block text-amber-800 font-medium">
                {rinkCount >= 3 ? 'Different rink every round' : 'Never > 2 times on same rink'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion / Toggle for Individual Bowler 3-Round Schedule */}
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBowlerSchedule(!showBowlerSchedule)}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Check Individual Bowler 3-Round Card</span>
            {showBowlerSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <span className="text-xs text-stone-500">
            {activeRound === 0 ? 'Viewing complete 3-round schedule' : `Viewing Round ${activeRound} of 3`}
          </span>
        </div>

        {showBowlerSchedule && (
          <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <label htmlFor="bowler-itinerary-select" className="font-semibold text-stone-700 flex items-center gap-2">
                <span>Select Bowler:</span>
                <select
                  id="bowler-itinerary-select"
                  value={selectedBowlerId || (selectedBowler?.id ?? '')}
                  onChange={(e) => setSelectedBowlerId(e.target.value)}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-medium text-stone-900 cursor-pointer"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.bowlerNumber} — {p.name} ({p.position.toUpperCase()})
                    </option>
                  ))}
                </select>
              </label>

              <span className="text-stone-500">
                Playing as <strong>{selectedBowler.position.toUpperCase()}</strong> (#{selectedBowler.bowlerNumber})
              </span>
            </div>

            {/* 3-Round Cards for Selected Bowler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bowlerSchedule.map(item => (
                <div
                  key={item.roundNumber}
                  className={`p-3 rounded-lg border ${
                    activeRound === item.roundNumber || activeRound === 0
                      ? 'bg-white border-emerald-300 shadow-xs'
                      : 'bg-stone-100/70 border-stone-200 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 border-b border-stone-100 pb-1">
                    <span className="font-bold text-stone-900">Round {item.roundNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      item.teamColor === 'Red' ? 'bg-rose-100 text-rose-900' : 'bg-sky-100 text-sky-900'
                    }`}>
                      Rink {item.rinkNumber} • {item.teamColor}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">Teammates:</span>
                      <span className="font-medium text-stone-800">{item.teammates.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Direct Opponent:</span>
                      <span className="font-medium text-stone-800">{item.opponent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
