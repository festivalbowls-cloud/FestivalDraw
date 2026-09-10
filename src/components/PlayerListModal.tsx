import React, { useState } from 'react';
import { Player, BowlerPosition } from '../types';
import { X, Users, Clipboard, RefreshCw, Check, Sparkles, Crown, Circle, Target } from 'lucide-react';
import { POSITION_BLOCKS } from '../utils/bowlsDraw';

interface PlayerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  playerCount: number;
  onUpdatePlayers: (updated: Player[]) => void;
  onResetToDefault: (useSampleNames: boolean) => void;
}

export const PlayerListModal: React.FC<PlayerListModalProps> = ({
  isOpen,
  onClose,
  players,
  playerCount,
  onUpdatePlayers,
  onResetToDefault
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'paste'>('roster');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'skip' | 'second' | 'lead'>('all');
  const [pasteText, setPasteText] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  if (!isOpen) return null;

  const rinks = Math.max(1, Math.ceil(playerCount / 6));
  const rem = playerCount % 6;
  const isSmall6nMinus4 = playerCount < 20 && rem === 2;
  const secondsRemoved = isSmall6nMinus4 ? 2 : rem === 4 ? 2 : rem === 2 ? 4 : 0;
  const leadsRemoved = isSmall6nMinus4 ? 2 : 0;
  const numSkips = rinks * 2;
  const numSeconds = Math.max(0, rinks * 2 - secondsRemoved);
  const numLeads = Math.max(0, rinks * 2 - leadsRemoved);

  const skips = players.filter(p => p.position === 'skip' || (p.bowlerNumber >= 1 && p.bowlerNumber < 30)).slice(0, numSkips);
  const seconds = players.filter(p => p.position === 'second' || (p.bowlerNumber >= 30 && p.bowlerNumber < 60)).slice(0, numSeconds);
  const leads = players.filter(p => p.position === 'lead' || (p.bowlerNumber >= 60 && p.bowlerNumber < 90)).slice(0, numLeads);

  const handleNameChange = (id: string, newName: string) => {
    const updated = players.map(p => p.id === id ? { ...p, name: newName } : p);
    onUpdatePlayers(updated);
  };

  const handleApplyPaste = () => {
    const lines = pasteText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    // Distribute into 3 blocks: Skips (1+), Seconds (30+), Leads (60+)
    const newPlayers: Player[] = [];
    let lineIdx = 0;

    // First numSkips are Skips (1+)
    for (let i = 0; i < numSkips; i++) {
      const name = lines[lineIdx++] || '';
      newPlayers.push({
        id: `skip-${1 + i}`,
        name,
        bowlerNumber: 1 + i,
        position: 'skip',
        rolePreference: 'skip'
      });
    }

    // Next numSeconds are Seconds (30+)
    for (let i = 0; i < numSeconds; i++) {
      const name = lines[lineIdx++] || '';
      newPlayers.push({
        id: `second-${30 + i}`,
        name,
        bowlerNumber: 30 + i,
        position: 'second',
        rolePreference: 'second'
      });
    }

    // Next numLeads are Leads (60+)
    for (let i = 0; i < numLeads; i++) {
      const name = lines[lineIdx++] || '';
      newPlayers.push({
        id: `lead-${60 + i}`,
        name,
        bowlerNumber: 60 + i,
        position: 'lead',
        rolePreference: 'lead'
      });
    }

    onUpdatePlayers(newPlayers);
    setPasteSuccess(true);
    setTimeout(() => {
      setPasteSuccess(false);
      setActiveTab('roster');
    }, 800);
  };

  const renderPlayerBlock = (
    title: string,
    rangeLabel: string,
    role: BowlerPosition,
    list: Player[],
    badgeBg: string,
    icon: React.ReactNode
  ) => {
    return (
      <div className="space-y-2 mb-6 last:mb-0">
        <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-sm text-stone-900 font-heading">
              {title}
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
              Numbers {rangeLabel}
            </span>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {list.length} Bowlers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition"
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs font-heading border shrink-0 ${badgeBg}`}>
                #{player.bowlerNumber}
              </span>
              <input
                type="text"
                value={player.name}
                onChange={(e) => handleNameChange(player.id, e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1 text-sm bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 font-medium"
                placeholder="Enter player name (or leave blank)"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-lg font-heading">
                Bowler Roster & Position Blocks
              </h2>
              <p className="text-xs text-emerald-200">
                Skips (1+), Seconds (30+), Leads (60+) to prevent role confusion
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-200 bg-stone-50 px-6 pt-2 gap-2">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`pb-2.5 text-sm font-semibold transition cursor-pointer border-b-2 ${
                activeTab === 'roster'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Numeric Blocks ({playerCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 text-sm font-semibold transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste Names List</span>
            </button>
          </div>

          {activeTab === 'roster' && (
            <div className="flex items-center gap-1 pb-2">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Blocks
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('skip')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedFilter === 'skip' ? 'bg-amber-500 text-stone-950' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                Skips (1+)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('second')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedFilter === 'second' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                }`}
              >
                Seconds (30+)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('lead')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedFilter === 'lead' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                Leads (60+)
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'roster' ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-stone-200 text-xs">
                <span className="text-stone-600 font-medium">
                  Each role is locked to its numeric block to prevent players from playing the wrong position.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onResetToDefault(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                    title="Load realistic club bowler names"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sample Names</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResetToDefault(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                    title="Reset to generic position numbers"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Numbers</span>
                  </button>
                </div>
              </div>

              {/* Skips (1+) */}
              {(selectedFilter === 'all' || selectedFilter === 'skip') &&
                renderPlayerBlock(
                  'Skips Block',
                  '1 to 29',
                  'skip',
                  skips,
                  'bg-amber-100 text-amber-950 border-amber-300',
                  <Crown className="w-4 h-4 text-amber-600" />
                )}

              {/* Seconds (30+) */}
              {(selectedFilter === 'all' || selectedFilter === 'second') &&
                renderPlayerBlock(
                  'Seconds Block',
                  '30 to 59',
                  'second',
                  seconds,
                  'bg-sky-100 text-sky-950 border-sky-300',
                  <Circle className="w-4 h-4 text-sky-600" />
                )}

              {/* Leads (60+) */}
              {(selectedFilter === 'all' || selectedFilter === 'lead') &&
                renderPlayerBlock(
                  'Leads Block',
                  '60 to 89',
                  'lead',
                  leads,
                  'bg-emerald-100 text-emerald-950 border-emerald-300',
                  <Target className="w-4 h-4 text-emerald-600" />
                )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Paste Bowler Names List (Total {playerCount} Bowlers)
                </label>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl mb-3 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Position Block Order:</p>
                  <p>• First {numSkips} names → <strong>Skips (#1 to #{numSkips})</strong></p>
                  {numSeconds > 0 ? (
                    <p>• Next {numSeconds} names → <strong>Seconds (#30 to #{29 + numSeconds})</strong> {secondsRemoved > 0 ? `(-${secondsRemoved} removed)` : ''}</p>
                  ) : (
                    <p>• <strong>Seconds: None</strong> (Pairs format)</p>
                  )}
                  <p>• Next {numLeads} names → <strong>Leads (#60 to #{59 + numLeads})</strong> {leadsRemoved > 0 ? `(-${leadsRemoved} removed)` : ''}</p>
                </div>
                <textarea
                  rows={10}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Arthur Davies\nMargaret Bell\nBob Campbell\nBetty Cooper\n...`}
                  className="w-full p-3 font-mono text-sm border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600">
                  Detected: {pasteText.split('\n').filter(l => l.trim().length > 0).length} names
                </span>
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition cursor-pointer"
                >
                  {pasteSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Applied to Blocks!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4" />
                      <span>Distribute to Blocks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 1+ Skips</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> 30+ Seconds</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 60+ Leads</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
