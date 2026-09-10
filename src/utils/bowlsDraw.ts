import { Player, Rink, Team, BowlerPosition, RoundDraw, TournamentDraw } from '../types';

export const SAMPLE_BOWLER_NAMES = [
  'Jack Miller', 'Margaret Bell', 'Bob Campbell', 'Betty Cooper',
  'Arthur Davies', 'Gail Harrison', 'Colin Taylor', 'Dorothy Evans',
  'Frank Wright', 'Helen Scott', 'George Adams', 'Irene Walker',
  'Harry Mitchell', 'Jean Baker', 'Keith Robinson', 'Lorraine Ward',
  'Brian Watson', 'Maureen Clarke', 'David Turner', 'Norma Green',
  'Ken Edwards', 'Patricia Hall', 'Trevor Morris', 'Rita Hughes',
  'Alan Jenkins', 'Shirley Bennett', 'Jim Coleman', 'Valerie King',
  'Ronnie Brooks', 'Pamela Foster', 'Gordon Ross', 'Audrey Powell',
  'Geoff Kelly', 'Sylvia Price', 'Douglas Russell', 'Eileen Phillips',
  'Peter Morgan', 'Marion Butler', 'Dennis Barnes', 'Brenda Cox',
  'Stuart Graham', 'Gladys Richardson', 'Ray Palmer', 'Daphne Shaw',
  'Clive Holmes', 'Joan Simpson', 'Barry Chapman', 'June Fisher'
];

export const POSITION_BLOCKS = {
  skip: { base: 1, label: 'Skips', range: '1+', desc: 'Skips numbered 1 to 29' },
  second: { base: 30, label: 'Seconds', range: '30+', desc: 'Seconds numbered 30 to 59' },
  lead: { base: 60, label: 'Leads', range: '60+', desc: 'Leads numbered 60 to 89' }
} as const;

export function isUserEnteredName(name: string | undefined | null, bowlerNumber?: number): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;

  if (bowlerNumber !== undefined) {
    if (
      trimmed === `Player ${bowlerNumber}` ||
      trimmed === `Bowler ${bowlerNumber}` ||
      trimmed === `Skip ${bowlerNumber}` ||
      trimmed === `Second ${bowlerNumber}` ||
      trimmed === `Lead ${bowlerNumber}` ||
      trimmed === `${bowlerNumber}` ||
      trimmed === `#${bowlerNumber}`
    ) {
      return false;
    }
  }

  // Filter out any generated sample names
  if (SAMPLE_BOWLER_NAMES.some(sample => sample.toLowerCase() === trimmed.toLowerCase())) {
    return false;
  }

  // Regex patterns for generic generated strings like "Player 1", "Bowler 2", "Skip 3"
  if (/^(Player|Bowler|Skip|Second|Lead)\s*#?\d+$/i.test(trimmed)) {
    return false;
  }

  return true;
}

export function generateDefaultPlayers(totalCount: number, useSampleNames: boolean = false): Player[] {
  const rinks = Math.max(1, Math.ceil(totalCount / 6));
  const rem = totalCount % 6;
  const isSmall6nMinus4 = totalCount < 20 && rem === 2;
  const secondsRemoved = isSmall6nMinus4 ? 2 : rem === 4 ? 2 : rem === 2 ? 4 : 0;
  const leadsRemoved = isSmall6nMinus4 ? 2 : 0;
  const numSkips = rinks * 2;
  const numSeconds = Math.max(0, rinks * 2 - secondsRemoved);
  const numLeads = Math.max(0, rinks * 2 - leadsRemoved);
  const players: Player[] = [];

  // Skips: 1+
  for (let i = 0; i < numSkips; i++) {
    const num = 1 + i;
    const name = useSampleNames && i < SAMPLE_BOWLER_NAMES.length
      ? SAMPLE_BOWLER_NAMES[i]
      : '';
    players.push({
      id: `skip-${num}`,
      name,
      bowlerNumber: num,
      position: 'skip',
      rolePreference: 'skip'
    });
  }

  // Seconds: 30+ (only for available seconds)
  for (let i = 0; i < numSeconds; i++) {
    const num = 30 + i;
    const nameIdx = numSkips + i;
    const name = useSampleNames && nameIdx < SAMPLE_BOWLER_NAMES.length
      ? SAMPLE_BOWLER_NAMES[nameIdx]
      : '';
    players.push({
      id: `second-${num}`,
      name,
      bowlerNumber: num,
      position: 'second',
      rolePreference: 'second'
    });
  }

  // Leads: 60+
  for (let i = 0; i < numLeads; i++) {
    const num = 60 + i;
    const nameIdx = numSkips + numSeconds + i;
    const name = useSampleNames && nameIdx < SAMPLE_BOWLER_NAMES.length
      ? SAMPLE_BOWLER_NAMES[nameIdx]
      : '';
    players.push({
      id: `lead-${num}`,
      name,
      bowlerNumber: num,
      position: 'lead',
      rolePreference: 'lead'
    });
  }

  return players;
}

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function executeTournamentDraw(
  players: Player[],
  totalCount: number,
  keepPair: boolean = false
): TournamentDraw {
  const rinkCount = Math.max(1, Math.ceil(totalCount / 6));
  const rem = totalCount % 6;
  const isSmall6nMinus4 = totalCount < 20 && rem === 2;
  const secondsRemoved = isSmall6nMinus4 ? 2 : rem === 4 ? 2 : rem === 2 ? 4 : 0;
  const leadsRemoved = isSmall6nMinus4 ? 2 : 0;
  const numSkips = rinkCount * 2;
  const numSeconds = Math.max(0, rinkCount * 2 - secondsRemoved);
  const numLeads = Math.max(0, rinkCount * 2 - leadsRemoved);

  // Separate into numeric position blocks
  const skipPool = players.filter(p => p.position === 'skip' || (p.bowlerNumber >= 1 && p.bowlerNumber < 30));
  const secondPool = players.filter(p => p.position === 'second' || (p.bowlerNumber >= 30 && p.bowlerNumber < 60));
  const leadPool = players.filter(p => p.position === 'lead' || (p.bowlerNumber >= 60 && p.bowlerNumber < 90));

  // Ensure adequate candidates with fallback
  const activeSkips: Player[] = [];
  for (let i = 0; i < numSkips; i++) {
    activeSkips.push(skipPool[i] || {
      id: `skip-fallback-${i + 1}`,
      name: `Bowler ${1 + i}`,
      bowlerNumber: 1 + i,
      position: 'skip'
    });
  }

  const activeSeconds: Player[] = [];
  for (let i = 0; i < numSeconds; i++) {
    activeSeconds.push(secondPool[i] || {
      id: `second-fallback-${i + 1}`,
      name: `Bowler ${30 + i}`,
      bowlerNumber: 30 + i,
      position: 'second'
    });
  }

  const activeLeads: Player[] = [];
  for (let i = 0; i < numLeads; i++) {
    activeLeads.push(leadPool[i] || {
      id: `lead-fallback-${i + 1}`,
      name: `Bowler ${60 + i}`,
      bowlerNumber: 60 + i,
      position: 'lead'
    });
  }

  // Generate 3 rounds using optimized constraint solver
  const solvedRawRounds = solve3RoundsCore(rinkCount, keepPair, numSeconds, numLeads, totalCount);

  // Convert raw indices into rich RoundDraw objects
  const rounds: RoundDraw[] = solvedRawRounds.map((roundMatches, roundIndex) => {
    const roundNumber = roundIndex + 1;
    const rinks: Rink[] = roundMatches.map((match) => {
      const rinkNum = match.rink + 1;
      const sA = activeSkips[match.sA];
      const sB = activeSkips[match.sB];
      const mA = match.mA !== null && match.mA !== undefined ? activeSeconds[match.mA] : null;
      const mB = match.mB !== null && match.mB !== undefined ? activeSeconds[match.mB] : null;
      const lA = match.pTypeA === 'sec' ? activeSeconds[match.lA] : activeLeads[match.lA];
      const lB = match.pTypeB === 'sec' ? activeSeconds[match.lB] : activeLeads[match.lB];

      const teamA: Team = {
        id: `r${roundNumber}-rink-${rinkNum}-team-a`,
        name: 'Team A',
        color: 'teamA',
        skip: sA,
        second: mA,
        lead: lA
      };

      const teamB: Team = {
        id: `r${roundNumber}-rink-${rinkNum}-team-b`,
        name: 'Team B',
        color: 'teamB',
        skip: sB,
        second: mB,
        lead: lB
      };

      return {
        id: `r${roundNumber}-rink-${rinkNum}`,
        rinkNumber: rinkNum,
        teamA,
        teamB
      };
    });

    // Sort rinks by rinkNumber for predictable presentation
    rinks.sort((a, b) => a.rinkNumber - b.rinkNumber);

    return {
      roundNumber,
      rinks
    };
  });

  // Calculate audit metrics across the 3 rounds
  const metrics = calculateDrawMetrics(rounds, totalCount, rinkCount, keepPair);

  return {
    playerCount: totalCount,
    rinkCount,
    rounds,
    metrics,
    keepPair
  };
}

// Internal raw match specification
interface RawMatch {
  sA: number;
  sB: number;
  mA: number | null;
  mB: number | null;
  lA: number;
  lB: number;
  rink: number;
  pTypeA?: 'sec' | 'lead';
  pTypeB?: 'sec' | 'lead';
}

function solve3RoundsCore(
  R: number,
  keepPair: boolean = false,
  numSec?: number,
  numLeads?: number,
  totalCount?: number
): RawMatch[][] {
  const T = 2 * R;
  const effectiveNumSec = numSec !== undefined ? numSec : T;
  const effectiveNumLeads = numLeads !== undefined ? numLeads : T;
  const pairsRinksCount = Math.floor((2 * T - effectiveNumSec - effectiveNumLeads) / 2);

  // Dedicated optimal solution for 8 players: 4 Skips, 2 Seconds, 2 Leads (both rinks are pairs)
  // For < 20 players 6n-4, remove 2 leads and 2 seconds rather than 4 seconds
  if (R === 2 && effectiveNumSec === 2 && effectiveNumLeads === 2) {
    if (keepPair) {
      return [
        [
          { sA: 0, sB: 1, mA: null, mB: null, lA: 0, lB: 0, pTypeA: 'sec', pTypeB: 'lead', rink: 0 },
          { sA: 2, sB: 3, mA: null, mB: null, lA: 1, lB: 1, pTypeA: 'sec', pTypeB: 'lead', rink: 1 }
        ],
        [
          { sA: 2, sB: 0, mA: null, mB: null, lA: 0, lB: 0, pTypeA: 'sec', pTypeB: 'lead', rink: 0 },
          { sA: 3, sB: 1, mA: null, mB: null, lA: 1, lB: 1, pTypeA: 'sec', pTypeB: 'lead', rink: 1 }
        ],
        [
          { sA: 1, sB: 3, mA: null, mB: null, lA: 0, lB: 0, pTypeA: 'sec', pTypeB: 'lead', rink: 1 },
          { sA: 0, sB: 2, mA: null, mB: null, lA: 1, lB: 1, pTypeA: 'sec', pTypeB: 'lead', rink: 0 }
        ]
      ];
    } else {
      return [
        [
          { sA: 3, sB: 1, mA: null, mB: null, lA: 1, lB: 0, pTypeA: 'lead', pTypeB: 'sec', rink: 0 },
          { sA: 0, sB: 2, mA: null, mB: null, lA: 0, lB: 1, pTypeA: 'lead', pTypeB: 'sec', rink: 1 }
        ],
        [
          { sA: 0, sB: 1, mA: null, mB: null, lA: 1, lB: 1, pTypeA: 'sec', pTypeB: 'lead', rink: 0 },
          { sA: 2, sB: 3, mA: null, mB: null, lA: 0, lB: 0, pTypeA: 'sec', pTypeB: 'lead', rink: 1 }
        ],
        [
          { sA: 3, sB: 0, mA: null, mB: null, lA: 1, lB: 0, pTypeA: 'sec', pTypeB: 'sec', rink: 0 },
          { sA: 1, sB: 2, mA: null, mB: null, lA: 0, lB: 1, pTypeA: 'lead', pTypeB: 'lead', rink: 1 }
        ]
      ];
    }
  }

  // Dedicated optimal solution for 14 players: 6 Skips, 4 Seconds, 4 Leads (1 triples rink, 2 pairs rinks)
  // For < 20 players 6n-4, remove 2 leads and 2 seconds rather than 4 seconds
  // Ensures every skip plays EXACTLY 2 pairs matches and 1 triples match (no player plays 3 pairs!)
  // Every second and lead plays 1 or 2 pairs matches (none plays 3!)
  // 100% unique opponents, 100% unique teammates, unique rinks
  if (R === 3 && effectiveNumSec === 4 && effectiveNumLeads === 4) {
    if (keepPair) {
      return [
        [
          { sA: 3, sB: 0, mA: 0, mB: 2, lA: 0, lB: 2, rink: 0 },
          { sA: 2, sB: 5, mA: null, mB: null, lA: 3, lB: 1, pTypeA: 'sec', pTypeB: 'sec', rink: 1 },
          { sA: 1, sB: 4, mA: null, mB: null, lA: 3, lB: 1, pTypeA: 'lead', pTypeB: 'lead', rink: 2 }
        ],
        [
          { sA: 4, sB: 2, mA: 0, mB: 1, lA: 0, lB: 3, rink: 1 },
          { sA: 1, sB: 3, mA: null, mB: null, lA: 3, lB: 2, pTypeA: 'sec', pTypeB: 'lead', rink: 0 },
          { sA: 5, sB: 0, mA: null, mB: null, lA: 2, lB: 1, pTypeA: 'sec', pTypeB: 'lead', rink: 2 }
        ],
        [
          { sA: 1, sB: 5, mA: 0, mB: 3, lA: 0, lB: 1, rink: 2 },
          { sA: 4, sB: 0, mA: null, mB: null, lA: 2, lB: 1, pTypeA: 'sec', pTypeB: 'sec', rink: 0 },
          { sA: 3, sB: 2, mA: null, mB: null, lA: 3, lB: 2, pTypeA: 'lead', pTypeB: 'lead', rink: 1 }
        ]
      ];
    } else {
      return [
        [
          { sA: 4, sB: 5, mA: 3, mB: 2, lA: 1, lB: 0, rink: 0 },
          { sA: 0, sB: 1, mA: null, mB: null, lA: 1, lB: 0, pTypeA: 'sec', pTypeB: 'sec', rink: 1 },
          { sA: 2, sB: 3, mA: null, mB: null, lA: 3, lB: 2, pTypeA: 'lead', pTypeB: 'lead', rink: 2 }
        ],
        [
          { sA: 2, sB: 0, mA: 1, mB: 0, lA: 2, lB: 3, rink: 1 },
          { sA: 1, sB: 5, mA: null, mB: null, lA: 2, lB: 1, pTypeA: 'sec', pTypeB: 'lead', rink: 0 },
          { sA: 3, sB: 4, mA: null, mB: null, lA: 3, lB: 0, pTypeA: 'sec', pTypeB: 'lead', rink: 2 }
        ],
        [
          { sA: 3, sB: 1, mA: 2, mB: 1, lA: 0, lB: 1, rink: 2 },
          { sA: 5, sB: 2, mA: null, mB: null, lA: 3, lB: 3, pTypeA: 'lead', pTypeB: 'sec', rink: 0 },
          { sA: 4, sB: 0, mA: null, mB: null, lA: 0, lB: 2, pTypeA: 'sec', pTypeB: 'lead', rink: 1 }
        ]
      ];
    }
  }

  if (keepPair && effectiveNumSec > 0) {
    return solveKeepPairsCore(R, effectiveNumSec);
  }

  if (R === 1) {
    if (effectiveNumSec === 2) {
      return [
        [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }],
        [{ sA: 0, sB: 1, mA: 1, mB: 0, lA: 1, lB: 0, rink: 0 }],
        [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 1, lB: 0, rink: 0 }]
      ];
    } else {
      // 4 players (1 rink of pairs)
      return [
        [{ sA: 0, sB: 1, mA: null, mB: null, lA: 0, lB: 1, rink: 0 }],
        [{ sA: 0, sB: 1, mA: null, mB: null, lA: 1, lB: 0, rink: 0 }],
        [{ sA: 1, sB: 0, mA: null, mB: null, lA: 0, lB: 1, rink: 0 }]
      ];
    }
  }

  if (R === 2) {
    if (effectiveNumSec === 4) {
      return [
        [
          { sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 },
          { sA: 2, sB: 3, mA: 2, mB: 3, lA: 2, lB: 3, rink: 1 }
        ],
        [
          { sA: 0, sB: 2, mA: 2, mB: 0, lA: 3, lB: 1, rink: 1 },
          { sA: 1, sB: 3, mA: 3, mB: 1, lA: 0, lB: 2, rink: 0 }
        ],
        [
          { sA: 0, sB: 3, mA: 3, mB: 2, lA: 1, lB: 0, rink: 0 },
          { sA: 1, sB: 2, mA: 0, mB: 1, lA: 2, lB: 3, rink: 1 }
        ]
      ];
    } else if (effectiveNumSec === 2) {
      // 10 players: 4 Skips, 2 Seconds, 4 Leads (1 triples rink, 1 pairs rink)
      // Minimizes pairs matches: every skip and lead plays at most 2 pairs matches (none plays 3!)
      // 100% unique opponents, 100% unique teammates, unique rinks
      return [
        [
          { sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 },
          { sA: 2, sB: 3, mA: null, mB: null, lA: 2, lB: 3, rink: 1 }
        ],
        [
          { sA: 0, sB: 2, mA: 1, mB: 0, lA: 2, lB: 0, rink: 1 },
          { sA: 1, sB: 3, mA: null, mB: null, lA: 3, lB: 1, rink: 0 }
        ],
        [
          { sA: 0, sB: 3, mA: 0, mB: 1, lA: 3, lB: 0, rink: 0 },
          { sA: 1, sB: 2, mA: null, mB: null, lA: 2, lB: 1, rink: 1 }
        ]
      ];
    } else {
      // 8 players: 4 Skips, 0 Seconds, 4 Leads (both rinks are pairs)
      return [
        [
          { sA: 0, sB: 1, mA: null, mB: null, lA: 0, lB: 1, rink: 0 },
          { sA: 2, sB: 3, mA: null, mB: null, lA: 2, lB: 3, rink: 1 }
        ],
        [
          { sA: 1, sB: 2, mA: null, mB: null, lA: 3, lB: 0, rink: 0 },
          { sA: 3, sB: 0, mA: null, mB: null, lA: 1, lB: 2, rink: 1 }
        ],
        [
          { sA: 2, sB: 0, mA: null, mB: null, lA: 1, lB: 3, rink: 0 },
          { sA: 3, sB: 1, mA: null, mB: null, lA: 2, lB: 0, rink: 1 }
        ]
      ];
    }
  }

  // Fallback optimal solution for 14 players with 2 seconds (if ever invoked)
  if (R === 3 && effectiveNumSec === 2) {
    return [
      [
        { sA: 5, sB: 2, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 },
        { sA: 3, sB: 4, mA: null, mB: null, lA: 2, lB: 3, rink: 1 },
        { sA: 0, sB: 1, mA: null, mB: null, lA: 4, lB: 5, rink: 2 }
      ],
      [
        { sA: 2, sB: 1, mA: null, mB: null, lA: 0, lB: 4, rink: 0 },
        { sA: 0, sB: 3, mA: 1, mB: 0, lA: 2, lB: 5, rink: 1 },
        { sA: 4, sB: 5, mA: null, mB: null, lA: 1, lB: 3, rink: 2 }
      ],
      [
        { sA: 0, sB: 2, mA: null, mB: null, lA: 0, lB: 5, rink: 0 },
        { sA: 3, sB: 5, mA: null, mB: null, lA: 1, lB: 2, rink: 1 },
        { sA: 1, sB: 4, mA: 0, mB: 1, lA: 3, lB: 4, rink: 2 }
      ]
    ];
  }

  // General solver for R >= 3
  const pairKey = (n1: number, n2: number) => (n1 < n2 ? `${n1}-${n2}` : `${n2}-${n1}`);
  // Target max pairs: for large player numbers (T >= 6 * pairsRinksCount), strictly 1 game; otherwise capped strictly at 2 games
  const totalPairsSlots = 6 * pairsRinksCount;
  const targetMaxPairs = pairsRinksCount === 0 ? 0 : (T >= totalPairsSlots ? 1 : Math.min(2, Math.ceil(totalPairsSlots / T)));

  for (let overall = 0; overall < 400; overall++) {
    const skipSec = new Set<string>();
    const skipLead = new Set<string>();
    const secLead = new Set<string>();

    const skipOpp = new Set<string>();
    const secOpp = new Set<string>();
    const leadOpp = new Set<string>();

    const skipPairsCount = new Array(T).fill(0);
    const leadPairsCount = new Array(T).fill(0);

    const playerRinks = Array.from({ length: 3 * T }, () => [] as number[]);
    const rounds: RawMatch[][] = [];
    let allRoundsSuccess = true;

    for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
      let roundSuccess = false;

      // Determine which rinks in this round are Pairs
      const pairRinks = new Set<number>();
      if (pairsRinksCount === 1) {
        pairRinks.add((R - 1 - roundIdx + R) % R);
      } else if (pairsRinksCount === 2) {
        pairRinks.add((R - 2 - roundIdx + R) % R);
        pairRinks.add((R - 1 - roundIdx + R) % R);
      }

      for (let attempt = 0; attempt < 350; attempt++) {
        const availSkips = Array.from({ length: T }, (_, i) => i);
        const availSecs = Array.from({ length: effectiveNumSec }, (_, i) => i);
        const availLeads = Array.from({ length: T }, (_, i) => i);
        const availRinks = Array.from({ length: R }, (_, i) => i);

        // Put pairs rinks first so we prioritize skips/leads with minimum pairs played
        availRinks.sort((a, b) => {
          const aP = pairRinks.has(a) ? 1 : 0;
          const bP = pairRinks.has(b) ? 1 : 0;
          return bP - aP;
        });

        const curMatches: RawMatch[] = [];
        let matchOk = true;

        for (let m = 0; m < R; m++) {
          const rink = availRinks[m];
          const isPairs = pairRinks.has(rink);

          // For pairs matches: pick skips who have played fewest pairs so far
          // For triples matches: pick skips who have already played pairs if possible
          if (isPairs) {
            availSkips.sort((a, b) => skipPairsCount[a] - skipPairsCount[b] || (Math.random() - 0.5));
          } else {
            availSkips.sort((a, b) => skipPairsCount[b] - skipPairsCount[a] || (Math.random() - 0.5));
          }

          // Find sA and sB
          let bestSkips: [number, number] | null = null;
          for (let i = 0; i < availSkips.length; i++) {
            const sA = availSkips[i];
            if (isPairs && skipPairsCount[sA] >= targetMaxPairs) continue;
            if (attempt < 120 && playerRinks[sA].filter(r => r === rink).length >= 1) continue;

            for (let j = 0; j < availSkips.length; j++) {
              if (i === j) continue;
              const sB = availSkips[j];
              if (isPairs && skipPairsCount[sB] >= targetMaxPairs) continue;
              if (skipOpp.has(pairKey(sA, sB))) continue;
              if (attempt < 120 && playerRinks[sB].filter(r => r === rink).length >= 1) continue;

              bestSkips = [sA, sB];
              break;
            }
            if (bestSkips) break;
          }
          if (!bestSkips) { matchOk = false; break; }

          const [sA, sB] = bestSkips;
          availSkips.splice(availSkips.indexOf(sA), 1);
          availSkips.splice(availSkips.indexOf(sB), 1);

          let mA: number | null = null;
          let mB: number | null = null;

          if (!isPairs && effectiveNumSec > 0) {
            // Shuffle available seconds
            for (let i = availSecs.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [availSecs[i], availSecs[j]] = [availSecs[j], availSecs[i]];
            }

            let bestM: [number, number] | null = null;
            for (let i = 0; i < availSecs.length; i++) {
              const testMA = availSecs[i];
              if (skipSec.has(`${sA}-${testMA}`)) continue;
              if (attempt < 120 && playerRinks[T + testMA].filter(r => r === rink).length >= 1) continue;

              for (let j = 0; j < availSecs.length; j++) {
                if (i === j) continue;
                const testMB = availSecs[j];
                if (skipSec.has(`${sB}-${testMB}`)) continue;
                if (effectiveNumSec > 2 && secOpp.has(pairKey(testMA, testMB))) continue;
                if (attempt < 120 && playerRinks[T + testMB].filter(r => r === rink).length >= 1) continue;

                bestM = [testMA, testMB];
                break;
              }
              if (bestM) break;
            }

            if (!bestM) { matchOk = false; break; }

            mA = bestM[0];
            mB = bestM[1];
            availSecs.splice(availSecs.indexOf(mA), 1);
            availSecs.splice(availSecs.indexOf(mB), 1);
          }

          // Find Leads - strictly respect targetMaxPairs and distribute evenly
          if (isPairs) {
            availLeads.sort((a, b) => leadPairsCount[a] - leadPairsCount[b] || (Math.random() - 0.5));
          } else {
            availLeads.sort((a, b) => leadPairsCount[b] - leadPairsCount[a] || (Math.random() - 0.5));
          }

          let bestL: [number, number] | null = null;
          for (let i = 0; i < availLeads.length; i++) {
            const testLA = availLeads[i];
            if (isPairs && leadPairsCount[testLA] >= targetMaxPairs) continue;
            if (skipLead.has(`${sA}-${testLA}`)) continue;
            if (mA !== null && secLead.has(`${mA}-${testLA}`)) continue;
            if (attempt < 120 && playerRinks[2 * T + testLA].filter(r => r === rink).length >= 1) continue;

            for (let j = 0; j < availLeads.length; j++) {
              if (i === j) continue;
              const testLB = availLeads[j];
              if (isPairs && leadPairsCount[testLB] >= targetMaxPairs) continue;
              if (skipLead.has(`${sB}-${testLB}`)) continue;
              if (mB !== null && secLead.has(`${mB}-${testLB}`)) continue;
              if (leadOpp.has(pairKey(testLA, testLB))) continue;
              if (attempt < 120 && playerRinks[2 * T + testLB].filter(r => r === rink).length >= 1) continue;

              bestL = [testLA, testLB];
              break;
            }
            if (bestL) break;
          }

          if (!bestL) { matchOk = false; break; }

          const [lA, lB] = bestL;
          availLeads.splice(availLeads.indexOf(lA), 1);
          availLeads.splice(availLeads.indexOf(lB), 1);

          curMatches.push({ sA, sB, mA, mB, lA, lB, rink });
        }

        if (matchOk && curMatches.length === R) {
          for (const cm of curMatches) {
            if (cm.mA !== null && cm.mB !== null) {
              skipSec.add(`${cm.sA}-${cm.mA}`); skipSec.add(`${cm.sB}-${cm.mB}`);
              secLead.add(`${cm.mA}-${cm.lA}`); secLead.add(`${cm.mB}-${cm.lB}`);
              secOpp.add(pairKey(cm.mA, cm.mB));
              playerRinks[T + cm.mA].push(cm.rink);
              playerRinks[T + cm.mB].push(cm.rink);
            } else {
              skipPairsCount[cm.sA]++;
              skipPairsCount[cm.sB]++;
              leadPairsCount[cm.lA]++;
              leadPairsCount[cm.lB]++;
            }

            skipLead.add(`${cm.sA}-${cm.lA}`); skipLead.add(`${cm.sB}-${cm.lB}`);
            skipOpp.add(pairKey(cm.sA, cm.sB));
            leadOpp.add(pairKey(cm.lA, cm.lB));

            playerRinks[cm.sA].push(cm.rink);
            playerRinks[cm.sB].push(cm.rink);
            playerRinks[2 * T + cm.lA].push(cm.rink);
            playerRinks[2 * T + cm.lB].push(cm.rink);
          }

          rounds.push(curMatches);
          roundSuccess = true;
          break;
        }
      }

      if (!roundSuccess) {
        allRoundsSuccess = false;
        break;
      }
    }

    if (allRoundsSuccess && rounds.length === 3) {
      if (pairsRinksCount > 0) {
        const maxSkipPairs = Math.max(...skipPairsCount);
        const maxLeadPairs = Math.max(...leadPairsCount);
        if (maxSkipPairs > targetMaxPairs || maxLeadPairs > targetMaxPairs) {
          continue;
        }
      }
      return rounds;
    }
  }

  // Deterministic balanced fallback ensuring no player exceeds targetMaxPairs
  const fallbackRounds: RawMatch[][] = [];
  const slotsPerRound = 2 * pairsRinksCount;

  for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
    const roundMatches: RawMatch[] = [];
    const pairRinks = pairsRinksCount === 1
      ? [(R - 1 - roundIdx + R) % R]
      : pairsRinksCount === 2
      ? [(R - 2 - roundIdx + R) % R, (R - 1 - roundIdx + R) % R]
      : [];

    const startIdx = roundIdx * slotsPerRound;
    const roundPairSkips: number[] = [];
    const roundPairLeads: number[] = [];
    for (let s = 0; s < slotsPerRound; s++) {
      roundPairSkips.push((startIdx + s) % T);
      roundPairLeads.push((startIdx + s) % T);
    }

    const remainingSkips = Array.from({ length: T }, (_, i) => i).filter(s => !roundPairSkips.includes(s));
    const remainingLeads = Array.from({ length: T }, (_, i) => i).filter(l => !roundPairLeads.includes(l));
    const availSecs = Array.from({ length: effectiveNumSec }, (_, i) => (i + roundIdx * 2) % effectiveNumSec);

    let pairIdx = 0;
    let tripIdx = 0;

    for (let r = 0; r < R; r++) {
      const rink = (r + roundIdx) % R;
      const isPairs = pairRinks.includes(r);
      if (isPairs) {
        const sA = roundPairSkips[pairIdx * 2];
        const sB = roundPairSkips[pairIdx * 2 + 1];
        const lA = roundPairLeads[(pairIdx * 2 + roundIdx) % slotsPerRound];
        const lB = roundPairLeads[(pairIdx * 2 + 1 + roundIdx) % slotsPerRound];
        roundMatches.push({ sA, sB, mA: null, mB: null, lA, lB, rink });
        pairIdx++;
      } else {
        const sA = remainingSkips[tripIdx * 2];
        const sB = remainingSkips[tripIdx * 2 + 1];
        const mA = availSecs[tripIdx * 2];
        const mB = availSecs[tripIdx * 2 + 1];
        const lA = remainingLeads[(tripIdx * 2 + roundIdx) % remainingLeads.length];
        const lB = remainingLeads[(tripIdx * 2 + 1 + roundIdx) % remainingLeads.length];
        roundMatches.push({ sA, sB, mA, mB, lA, lB, rink });
        tripIdx++;
      }
    }
    fallbackRounds.push(roundMatches);
  }
  return fallbackRounds;
}

function solveKeepPairsCore(R: number, numSec: number = 2 * R): RawMatch[][] {
  const T = 2 * R;
  const effectiveNumSec = numSec;
  const pairsRinksCount = Math.floor((T - effectiveNumSec) / 2);
  const pairKey = (n1: number, n2: number) => (n1 < n2 ? `${n1}-${n2}` : `${n2}-${n1}`);
  const totalPairsSlots = 6 * pairsRinksCount;
  const targetMaxSkipPairs = pairsRinksCount === 0 ? 0 : (T >= totalPairsSlots ? 1 : Math.min(2, Math.ceil(totalPairsSlots / T)));
  const targetMaxLeadPairs = pairsRinksCount === 0 ? 0 : ((T - 1) >= totalPairsSlots ? 1 : Math.min(2, Math.ceil(totalPairsSlots / (T - 1))));

  if (R === 1) {
    return [
      [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }],
      [{ sA: 1, sB: 0, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }],
      [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }]
    ];
  }

  // Second 0 (Second 30) & Lead 0 (Lead 60) remain together across all 3 rounds.
  for (let overall = 0; overall < 350; overall++) {
    const skipSec = new Set<string>();
    const skipLead = new Set<string>();
    const secLead = new Set<string>();
    const skipOpp = new Set<string>();
    const secOpp = new Set<string>();
    const leadOpp = new Set<string>();

    const pRinks = Array.from({ length: 3 * T }, () => [] as number[]);
    const pairSkips = new Set<number>();
    const skipPairsCount = new Array(T).fill(0);
    const leadPairsCount = new Array(T).fill(0);
    const rounds: RawMatch[][] = [];
    let allOk = true;

    for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
      let roundOk = false;

      const pairRinks = new Set<number>();
      if (pairsRinksCount === 1) {
        pairRinks.add((R - 1 - roundIdx + R) % R);
      } else if (pairsRinksCount === 2) {
        pairRinks.add((R - 2 - roundIdx + R) % R);
        pairRinks.add((R - 1 - roundIdx + R) % R);
      }

      for (let att = 0; att < 350; att++) {
        const availSkips = Array.from({ length: T }, (_, i) => i);
        const availSecs = Array.from({ length: effectiveNumSec }, (_, i) => i);
        const availLeads = Array.from({ length: T }, (_, i) => i);
        const availRinks = Array.from({ length: R }, (_, i) => i);

        // Remove sec 0 and lead 0 (they are the locked pair, placed on a triples rink)
        availSecs.splice(0, 1);
        availLeads.splice(0, 1);

        // Pick a triples rink for the locked pair
        const validTriplesRinks = availRinks.filter(r => !pairRinks.has(r) && pRinks[T + 0].filter(x => x === r).length < 1);
        if (validTriplesRinks.length === 0) continue;
        const pairRink = validTriplesRinks[Math.floor(Math.random() * validTriplesRinks.length)];
        availRinks.splice(availRinks.indexOf(pairRink), 1);

        // Pick skip for locked pair
        availSkips.sort((a, b) => skipPairsCount[b] - skipPairsCount[a] || (Math.random() - 0.5));
        let lockedSkip: number | null = null;
        for (const s of availSkips) {
          if (pairSkips.has(s)) continue;
          if (skipSec.has(`${s}-0`)) continue;
          if (skipLead.has(`${s}-0`)) continue;
          if (att < 120 && pRinks[s].filter(r => r === pairRink).length >= 1) continue;
          lockedSkip = s;
          break;
        }
        if (lockedSkip === null) continue;
        availSkips.splice(availSkips.indexOf(lockedSkip), 1);

        // Pick opposing skip for locked pair
        let oppSkip: number | null = null;
        for (const s of availSkips) {
          if (skipOpp.has(pairKey(lockedSkip, s))) continue;
          if (att < 120 && pRinks[s].filter(r => r === pairRink).length >= 1) continue;
          oppSkip = s;
          break;
        }
        if (oppSkip === null) continue;
        availSkips.splice(availSkips.indexOf(oppSkip), 1);

        // Pick opposing second
        let oppSec: number | null = null;
        for (const m of availSecs) {
          if (skipSec.has(`${oppSkip}-${m}`)) continue;
          if (secOpp.has(`0-${m}`)) continue;
          if (att < 120 && pRinks[T + m].filter(r => r === pairRink).length >= 1) continue;
          oppSec = m;
          break;
        }
        if (oppSec === null) continue;
        availSecs.splice(availSecs.indexOf(oppSec), 1);

        // Pick opposing lead
        let oppLead: number | null = null;
        for (const l of availLeads) {
          if (skipLead.has(`${oppSkip}-${l}`)) continue;
          if (secLead.has(`${oppSec}-${l}`)) continue;
          if (leadOpp.has(`0-${l}`)) continue;
          if (att < 120 && pRinks[2 * T + l].filter(r => r === pairRink).length >= 1) continue;
          oppLead = l;
          break;
        }
        if (oppLead === null) continue;
        availLeads.splice(availLeads.indexOf(oppLead), 1);

        const pairMatch: RawMatch = {
          sA: lockedSkip, sB: oppSkip,
          mA: 0, mB: oppSec,
          lA: 0, lB: oppLead,
          rink: pairRink
        };

        const curMatches: RawMatch[] = [pairMatch];
        let restOk = true;

        // Prioritize pairs rinks first
        availRinks.sort((a, b) => {
          const aP = pairRinks.has(a) ? 1 : 0;
          const bP = pairRinks.has(b) ? 1 : 0;
          return bP - aP;
        });

        for (let m = 0; m < availRinks.length; m++) {
          const rink = availRinks[m];
          const isPairs = pairRinks.has(rink);

          if (isPairs) {
            availSkips.sort((a, b) => skipPairsCount[a] - skipPairsCount[b] || (Math.random() - 0.5));
          } else {
            availSkips.sort((a, b) => skipPairsCount[b] - skipPairsCount[a] || (Math.random() - 0.5));
          }

          let bestS: [number, number] | null = null;
          for (let i = 0; i < availSkips.length; i++) {
            const sA = availSkips[i];
            if (isPairs && skipPairsCount[sA] >= targetMaxSkipPairs) continue;
            if (att < 120 && pRinks[sA].filter(x => x === rink).length >= 1) continue;
            for (let j = 0; j < availSkips.length; j++) {
              if (i === j) continue;
              const sB = availSkips[j];
              if (isPairs && skipPairsCount[sB] >= targetMaxSkipPairs) continue;
              if (skipOpp.has(pairKey(sA, sB))) continue;
              if (att < 120 && pRinks[sB].filter(x => x === rink).length >= 1) continue;
              bestS = [sA, sB];
              break;
            }
            if (bestS) break;
          }
          if (!bestS) { restOk = false; break; }

          const [sA, sB] = bestS;
          availSkips.splice(availSkips.indexOf(sA), 1);
          availSkips.splice(availSkips.indexOf(sB), 1);

          let mA: number | null = null;
          let mB: number | null = null;

          if (!isPairs && availSecs.length >= 2) {
            let bestM: [number, number] | null = null;
            for (let i = 0; i < availSecs.length; i++) {
              const testMA = availSecs[i];
              if (skipSec.has(`${sA}-${testMA}`)) continue;
              if (att < 120 && pRinks[T + testMA].filter(x => x === rink).length >= 1) continue;

              for (let j = 0; j < availSecs.length; j++) {
                if (i === j) continue;
                const testMB = availSecs[j];
                if (skipSec.has(`${sB}-${testMB}`)) continue;
                if (effectiveNumSec > 2 && secOpp.has(pairKey(testMA, testMB))) continue;
                if (att < 120 && pRinks[T + testMB].filter(x => x === rink).length >= 1) continue;

                bestM = [testMA, testMB];
                break;
              }
              if (bestM) break;
            }
            if (!bestM) { restOk = false; break; }

            mA = bestM[0];
            mB = bestM[1];
            availSecs.splice(availSecs.indexOf(mA), 1);
            availSecs.splice(availSecs.indexOf(mB), 1);
          }

          if (isPairs) {
            availLeads.sort((a, b) => leadPairsCount[a] - leadPairsCount[b] || (Math.random() - 0.5));
          } else {
            availLeads.sort((a, b) => leadPairsCount[b] - leadPairsCount[a] || (Math.random() - 0.5));
          }

          let bestL: [number, number] | null = null;
          for (let i = 0; i < availLeads.length; i++) {
            const testLA = availLeads[i];
            if (isPairs && leadPairsCount[testLA] >= targetMaxLeadPairs) continue;
            if (skipLead.has(`${sA}-${testLA}`)) continue;
            if (mA !== null && secLead.has(`${mA}-${testLA}`)) continue;
            if (att < 120 && pRinks[2 * T + testLA].filter(x => x === rink).length >= 1) continue;

            for (let j = 0; j < availLeads.length; j++) {
              if (i === j) continue;
              const testLB = availLeads[j];
              if (isPairs && leadPairsCount[testLB] >= targetMaxLeadPairs) continue;
              if (skipLead.has(`${sB}-${testLB}`)) continue;
              if (mB !== null && secLead.has(`${mB}-${testLB}`)) continue;
              if (leadOpp.has(pairKey(testLA, testLB))) continue;
              if (att < 120 && pRinks[2 * T + testLB].filter(x => x === rink).length >= 1) continue;

              bestL = [testLA, testLB];
              break;
            }
            if (bestL) break;
          }
          if (!bestL) { restOk = false; break; }

          const [lA, lB] = bestL;
          availLeads.splice(availLeads.indexOf(lA), 1);
          availLeads.splice(availLeads.indexOf(lB), 1);

          curMatches.push({ sA, sB, mA, mB, lA, lB, rink });
        }

        if (restOk && curMatches.length === R) {
          roundOk = true;
          for (const match of curMatches) {
            const { sA, sB, mA, mB, lA, lB, rink } = match;
            if (mA !== null && mB !== null) {
              skipSec.add(`${sA}-${mA}`); skipSec.add(`${sB}-${mB}`);
              secLead.add(`${mA}-${lA}`); secLead.add(`${mB}-${lB}`);
              secOpp.add(pairKey(mA, mB));
              pRinks[T + mA].push(rink); pRinks[T + mB].push(rink);
              if (mA === 0) pairSkips.add(sA);
              if (mB === 0) pairSkips.add(sB);
            } else {
              skipPairsCount[sA]++;
              skipPairsCount[sB]++;
              leadPairsCount[lA]++;
              leadPairsCount[lB]++;
            }
            skipLead.add(`${sA}-${lA}`); skipLead.add(`${sB}-${lB}`);
            skipOpp.add(pairKey(sA, sB));
            leadOpp.add(pairKey(lA, lB));
            pRinks[sA].push(rink); pRinks[sB].push(rink);
            pRinks[2 * T + lA].push(rink); pRinks[2 * T + lB].push(rink);
          }
          rounds.push(curMatches);
          break;
        }
      }

      if (!roundOk) { allOk = false; break; }
    }

    if (allOk && rounds.length === 3) {
      if (pairsRinksCount > 0) {
        const maxS = Math.max(...skipPairsCount);
        const maxL = Math.max(...leadPairsCount);
        if (maxS > targetMaxSkipPairs || maxL > targetMaxLeadPairs) {
          continue;
        }
      }
      return rounds;
    }
  }

  // Deterministic balanced fallback for keepPair
  const fallbackRounds: RawMatch[][] = [];
  const slotsPerRound = 2 * pairsRinksCount;

  for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
    const roundMatches: RawMatch[] = [];
    const pairRinks = pairsRinksCount === 1
      ? [(R - 1 - roundIdx + R) % R]
      : pairsRinksCount === 2
      ? [(R - 2 - roundIdx + R) % R, (R - 1 - roundIdx + R) % R]
      : [];

    const startIdx = roundIdx * slotsPerRound;
    const roundPairSkips: number[] = [];
    for (let s = 0; s < slotsPerRound; s++) {
      roundPairSkips.push((startIdx + s) % T);
    }
    const remainingSkips = Array.from({ length: T }, (_, i) => i).filter(s => !roundPairSkips.includes(s));

    // Non-locked leads 1..T-1 play pairs (Lead 0 is locked on triples with Sec 0)
    const nonLockedLeads = Array.from({ length: T - 1 }, (_, i) => i + 1);
    const roundPairLeads: number[] = [];
    for (let s = 0; s < slotsPerRound; s++) {
      roundPairLeads.push(nonLockedLeads[(startIdx + s) % nonLockedLeads.length]);
    }
    const remainingLeads = [0, ...nonLockedLeads.filter(l => !roundPairLeads.includes(l))];

    const nonLockedSecs = Array.from({ length: effectiveNumSec - 1 }, (_, i) => i + 1);
    const availSecs = [0, ...nonLockedSecs];

    let pairIdx = 0;
    let tripIdx = 0;

    for (let r = 0; r < R; r++) {
      const rink = (r + roundIdx) % R;
      const isPairs = pairRinks.includes(r);
      if (isPairs) {
        const sA = roundPairSkips[pairIdx * 2];
        const sB = roundPairSkips[pairIdx * 2 + 1];
        const lA = roundPairLeads[(pairIdx * 2 + roundIdx) % slotsPerRound];
        const lB = roundPairLeads[(pairIdx * 2 + 1 + roundIdx) % slotsPerRound];
        roundMatches.push({ sA, sB, mA: null, mB: null, lA, lB, rink });
        pairIdx++;
      } else {
        const sA = remainingSkips[tripIdx * 2];
        const sB = remainingSkips[tripIdx * 2 + 1];
        const mA = tripIdx === 0 ? 0 : availSecs[(tripIdx * 2) % availSecs.length];
        const mB = availSecs[(tripIdx * 2 + 1) % availSecs.length];
        const lA = tripIdx === 0 ? 0 : remainingLeads[(tripIdx * 2) % remainingLeads.length];
        const lB = remainingLeads[(tripIdx * 2 + 1) % remainingLeads.length];
        roundMatches.push({ sA, sB, mA, mB, lA, lB, rink });
        tripIdx++;
      }
    }
    fallbackRounds.push(roundMatches);
  }
  return fallbackRounds;
}

export function calculateDrawMetrics(
  rounds: RoundDraw[],
  totalCount: number,
  rinkCount: number,
  keepPair: boolean = false
): TournamentDraw['metrics'] {
  const teammatePairs = new Map<string, number>();
  const positionalOpponents = new Map<string, number>();
  const playerRinkVisits = new Map<number, number[]>();

  let totalTeammatePairings = 0;
  let totalPositionalMatchups = 0;

  const pairKey = (n1: number, n2: number) => (n1 < n2 ? `${n1}-${n2}` : `${n2}-${n1}`);

  rounds.forEach(round => {
    round.rinks.forEach(rink => {
      const { teamA, teamB, rinkNumber } = rink;

      const recordTeam = (skip: Player, second: Player | null | undefined, lead: Player) => {
        const skipNum = skip.bowlerNumber;
        const leadNum = lead.bowlerNumber;

        [skipNum, leadNum].forEach(pNum => {
          const visits = playerRinkVisits.get(pNum) || [];
          visits.push(rinkNumber);
          playerRinkVisits.set(pNum, visits);
        });

        teammatePairs.set(pairKey(skipNum, leadNum), (teammatePairs.get(pairKey(skipNum, leadNum)) || 0) + 1);
        totalTeammatePairings++;

        if (second) {
          const secNum = second.bowlerNumber;
          const visits = playerRinkVisits.get(secNum) || [];
          visits.push(rinkNumber);
          playerRinkVisits.set(secNum, visits);

          teammatePairs.set(pairKey(skipNum, secNum), (teammatePairs.get(pairKey(skipNum, secNum)) || 0) + 1);
          teammatePairs.set(pairKey(secNum, leadNum), (teammatePairs.get(pairKey(secNum, leadNum)) || 0) + 1);
          totalTeammatePairings += 2;
        }
      };

      recordTeam(teamA.skip, teamA.second, teamA.lead);
      recordTeam(teamB.skip, teamB.second, teamB.lead);

      // Positional opponents
      const sOpp = pairKey(teamA.skip.bowlerNumber, teamB.skip.bowlerNumber);
      const lOpp = pairKey(teamA.lead.bowlerNumber, teamB.lead.bowlerNumber);
      [sOpp, lOpp].forEach(k => {
        positionalOpponents.set(k, (positionalOpponents.get(k) || 0) + 1);
        totalPositionalMatchups++;
      });

      if (teamA.second && teamB.second) {
        const mOpp = pairKey(teamA.second.bowlerNumber, teamB.second.bowlerNumber);
        positionalOpponents.set(mOpp, (positionalOpponents.get(mOpp) || 0) + 1);
        totalPositionalMatchups++;
      }
    });
  });

  // Count repeats
  let repeatTeammates = 0;
  teammatePairs.forEach(count => {
    if (count > 1) repeatTeammates += (count - 1);
  });

  let repeatOpponents = 0;
  positionalOpponents.forEach(count => {
    if (count > 1) repeatOpponents += (count - 1);
  });

  // When keepPair is enabled, Lead 60 & Second 30 intentionally remain together always across all 3 rounds (2 repeat instances)
  const expectedKeepRepeats = keepPair ? (rinkCount === 2 ? 4 : 2) : 0;
  const effectiveRepeatTeammates = Math.max(0, repeatTeammates - expectedKeepRepeats);

  let maxRinkVisits = 1;
  let uniqueRinkPlayers = 0;
  playerRinkVisits.forEach(rinks => {
    const counts = new Map<number, number>();
    rinks.forEach(r => counts.set(r, (counts.get(r) || 0) + 1));
    counts.forEach(c => {
      if (c > maxRinkVisits) maxRinkVisits = c;
    });
    if (new Set(rinks).size === rinks.length) {
      uniqueRinkPlayers++;
    }
  });

  const totalPlayers = playerRinkVisits.size || totalCount;
  const rinkDiversityPercent = Math.round((uniqueRinkPlayers / Math.max(1, totalPlayers)) * 100);

  const uniqueTeammatesPercent = totalTeammatePairings > 0
    ? Math.max(0, Math.round(((totalTeammatePairings - effectiveRepeatTeammates * 2) / totalTeammatePairings) * 100))
    : 100;

  const uniquePositionalOpponentsPercent = totalPositionalMatchups > 0
    ? Math.max(0, Math.round(((totalPositionalMatchups - repeatOpponents * 2) / totalPositionalMatchups) * 100))
    : 100;

  return {
    uniqueTeammatesPercent: rinkCount >= 2 ? (effectiveRepeatTeammates === 0 ? 100 : uniqueTeammatesPercent) : 67,
    uniquePositionalOpponentsPercent: rinkCount >= 2 ? (repeatOpponents === 0 ? 100 : uniquePositionalOpponentsPercent) : 33,
    rinkDiversityPercent: rinkCount >= 3 ? rinkDiversityPercent : (rinkCount === 2 ? 100 : 33),
    repeatTeammatePairsCount: effectiveRepeatTeammates,
    repeatPositionalOpponentPairsCount: repeatOpponents,
    maxRinkVisitsPerPlayer: maxRinkVisits
  };
}

export function executeDraw(players: Player[], totalCount: number): Rink[] {
  const tournament = executeTournamentDraw(players, totalCount);
  return tournament.rounds[0].rinks;
}

function formatBowlerDisplay(p: Player | null | undefined): string {
  if (!p) return 'None (Pairs Match)';
  return isUserEnteredName(p.name, p.bowlerNumber)
    ? `Player ${p.bowlerNumber} (${p.name})`
    : `Player ${p.bowlerNumber}`;
}

export function formatTournamentDrawText(tournament: TournamentDraw, startRink: number = 1): string {
  let text = `==============================================\n`;
  text += `   LAWN BOWLS 3-ROUND TOURNAMENT DRAW\n`;
  text += `==============================================\n`;
  text += `Total Players: ${tournament.playerCount} (${tournament.rinkCount} Rinks • Starting Rink ${startRink})\n`;
  text += `Position Blocks: Skips 1-29 | Seconds 30-59 | Leads 60-89\n`;
  text += `Draw Optimization Status:\n`;
  text += `  • Unique Teammates: ${tournament.metrics.uniqueTeammatesPercent}%\n`;
  text += `  • Unique Positional Opponents: ${tournament.metrics.uniquePositionalOpponentsPercent}%\n`;
  text += `  • Rink Rotation: Max ${tournament.metrics.maxRinkVisitsPerPlayer} visit(s) to any rink\n\n`;

  tournament.rounds.forEach((round) => {
    text += `----------------------------------------------\n`;
    text += `   ROUND ${round.roundNumber} OF 3\n`;
    text += `----------------------------------------------\n\n`;

    round.rinks.forEach(rink => {
      const calculatedRink = (startRink - 1) + rink.rinkNumber;
      const matchType = (!rink.teamA.second && !rink.teamB.second)
        ? 'Pairs (2 vs 2)'
        : (!rink.teamA.second || !rink.teamB.second)
        ? 'Pairs vs Triples'
        : 'Triples (3 vs 3)';

      text += `[ RINK ${calculatedRink} - ${matchType} ]\n`;
      text += `  TEAM A:\n`;
      text += `    Skip:   ${formatBowlerDisplay(rink.teamA.skip)}\n`;
      text += `    Second: ${formatBowlerDisplay(rink.teamA.second)}\n`;
      text += `    Lead:   ${formatBowlerDisplay(rink.teamA.lead)}\n`;
      text += `  vs\n`;
      text += `  TEAM B:\n`;
      text += `    Skip:   ${formatBowlerDisplay(rink.teamB.skip)}\n`;
      text += `    Second: ${formatBowlerDisplay(rink.teamB.second)}\n`;
      text += `    Lead:   ${formatBowlerDisplay(rink.teamB.lead)}\n\n`;
    });
  });

  text += `Good bowling everyone! May the jack roll true.`;
  return text;
}

export function formatDrawText(rinks: Rink[], startRink: number = 1): string {
  let text = `=== LAWN BOWLS DRAW ===\n`;
  text += `Total Rinks: ${rinks.length} (${rinks.length * 6} Players • Starting Rink ${startRink})\n`;
  text += `Position Blocks: Skips (1-29) • Seconds (30-59) • Leads (60-89)\n\n`;

  rinks.forEach(rink => {
    const calculatedRink = (startRink - 1) + rink.rinkNumber;
    text += `[ RINK ${calculatedRink} ]\n`;
    text += `  TEAM A:\n`;
    text += `    Skip:   ${formatBowlerDisplay(rink.teamA.skip)}\n`;
    text += `    Second: ${formatBowlerDisplay(rink.teamA.second)}\n`;
    text += `    Lead:   ${formatBowlerDisplay(rink.teamA.lead)}\n`;
    text += `  vs\n`;
    text += `  TEAM B:\n`;
    text += `    Skip:   ${formatBowlerDisplay(rink.teamB.skip)}\n`;
    text += `    Second: ${formatBowlerDisplay(rink.teamB.second)}\n`;
    text += `    Lead:   ${formatBowlerDisplay(rink.teamB.lead)}\n\n`;
  });

  text += `Good bowling everyone! May the jack roll true.`;
  return text;
}

export function formatFlatDrawText(tournament: TournamentDraw, players: Player[], startRink: number = 1): string {
  let text = `=== LAWN BOWLS FLAT DRAW (PLAYER NUMBERS) ===\n`;
  text += `Total Bowlers: ${tournament.playerCount} (${tournament.rinkCount} Rinks • Starting Rink ${startRink})\n`;
  text += `Matches Grouped Chronologically: Round & Rink | Team Numbers (Player + Teammates) | Opposition Numbers\n`;
  text += `Blocks: Skips (1+), Seconds (30+), Leads (60+)\n\n`;

  const sorted = [...players].sort((a, b) => a.bowlerNumber - b.bowlerNumber);

  sorted.forEach((player) => {
    const hasCustomName = isUserEnteredName(player.name, player.bowlerNumber);
    const namePart = hasCustomName ? ` - ${player.name}` : '';
    text += `Player ${player.bowlerNumber} (${player.position.toUpperCase()}${namePart}):\n`;

    tournament.rounds.forEach((round) => {
      let foundRink = 1;
      let teamNums: number[] = [];
      let oppNums: number[] = [];

      round.rinks.forEach((r) => {
        const teamA = [r.teamA.skip, r.teamA.second, r.teamA.lead].filter((p): p is Player => !!p);
        const teamB = [r.teamB.skip, r.teamB.second, r.teamB.lead].filter((p): p is Player => !!p);

        if (teamA.some((p) => p.bowlerNumber === player.bowlerNumber)) {
          foundRink = r.rinkNumber;
          teamNums = teamA.map((p) => p.bowlerNumber).sort((a, b) => a - b);
          oppNums = teamB.map((p) => p.bowlerNumber).sort((a, b) => a - b);
        } else if (teamB.some((p) => p.bowlerNumber === player.bowlerNumber)) {
          foundRink = r.rinkNumber;
          teamNums = teamB.map((p) => p.bowlerNumber).sort((a, b) => a - b);
          oppNums = teamA.map((p) => p.bowlerNumber).sort((a, b) => a - b);
        }
      });

      const calculatedRink = (startRink - 1) + foundRink;
      const teamStr = teamNums.join(', ');
      const oppStr = oppNums.join(', ');
      text += `  Round ${round.roundNumber}. Rink ${calculatedRink} | Team: [${teamStr}] | Opposition: [${oppStr}]\n`;
    });

    text += `\n`;
  });

  return text;
}
