import React, { useState } from 'react';
import { Player, BowlerPosition } from '../types';
import { X, Users, Clipboard, RefreshCw, Check, Sparkles } from 'lucide-react';
import { SAMPLE_BOWLER_NAMES } from '../utils/bowlsDraw';

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
  const [pasteText, setPasteText] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (id: string, newName: string) => {
    const updated = players.map(p => p.id === id ? { ...p, name: newName } : p);
    onUpdatePlayers(updated);
  };

  const handleRoleChange = (id: string, role: BowlerPosition | 'any') => {
    const updated = players.map(p => p.id === id ? { ...p, rolePreference: role } : p);
    onUpdatePlayers(updated);
  };

  const handleApplyPaste = () => {
    const lines = pasteText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    const newPlayers: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      const name = lines[i] || `Player ${i + 1}`;
      newPlayers.push({
        id: `p-${i + 1}`,
        name,
        rolePreference: 'any'
      });
    }

    onUpdatePlayers(newPlayers);
    setPasteSuccess(true);
    setTimeout(() => {
      setPasteSuccess(false);
      setActiveTab('roster');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-950">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-lg font-heading">
                Bowler Roster ({playerCount} Bowlers)
              </h2>
              <p className="text-xs text-emerald-200">
                Customise names or paste sign-up sheet
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
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-2.5 text-sm font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'roster'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Current Bowlers ({playerCount})
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'roster' ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-200 text-xs">
                <span className="text-stone-600 font-medium">
                  Positions can optionally guide the draw if preferred.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onResetToDefault(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                    title="Fill with typical club names"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sample Names</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResetToDefault(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                    title="Reset to Player 1, Player 2..."
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Player 1..N</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {players.slice(0, playerCount).map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <span className="w-6 text-right text-xs font-bold text-stone-500 shrink-0">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => handleNameChange(player.id, e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1 text-sm bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900"
                      placeholder={`Player ${index + 1}`}
                    />
                    <select
                      value={player.rolePreference || 'any'}
                      onChange={(e) => handleRoleChange(player.id, e.target.value as BowlerPosition | 'any')}
                      className="text-xs bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shrink-0"
                      title="Role preference for balanced draw"
                    >
                      <option value="any">Any Role</option>
                      <option value="skip">Skip</option>
                      <option value="second">Second</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1">
                  Paste Bowler Names (One name per line)
                </label>
                <p className="text-xs text-stone-600 mb-2">
                  Paste a list copied from an email, WhatsApp, or spreadsheet. The first {playerCount} names will be assigned to bowlers.
                </p>
                <textarea
                  rows={10}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Arthur Davies\nBetty Cooper\nColin Taylor\nDorothy Evans\n...`}
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
                      <span>Applied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4" />
                      <span>Apply to Draw</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-end">
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
