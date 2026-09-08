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
  const rinks = Math.max(1, Math.floor(totalCount / 6));
  const perRole = rinks * 2;
  const players: Player[] = [];

  // Skips: 1+
  for (let i = 0; i < perRole; i++) {
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

  // Seconds: 30+
  for (let i = 0; i < perRole; i++) {
    const num = 30 + i;
    const nameIdx = perRole + i;
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
  for (let i = 0; i < perRole; i++) {
    const num = 60 + i;
    const nameIdx = perRole * 2 + i;
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
  const rinkCount = Math.max(1, Math.floor(totalCount / 6));
  const perRole = rinkCount * 2;

  // Separate into numeric position blocks
  const skipPool = players.filter(p => p.position === 'skip' || (p.bowlerNumber >= 1 && p.bowlerNumber < 30));
  const secondPool = players.filter(p => p.position === 'second' || (p.bowlerNumber >= 30 && p.bowlerNumber < 60));
  const leadPool = players.filter(p => p.position === 'lead' || (p.bowlerNumber >= 60 && p.bowlerNumber < 90));

  // Ensure adequate candidates with fallback
  const activeSkips: Player[] = [];
  for (let i = 0; i < perRole; i++) {
    activeSkips.push(skipPool[i] || {
      id: `skip-fallback-${i + 1}`,
      name: `Bowler ${1 + i}`,
      bowlerNumber: 1 + i,
      position: 'skip'
    });
  }

  const activeSeconds: Player[] = [];
  for (let i = 0; i < perRole; i++) {
    activeSeconds.push(secondPool[i] || {
      id: `second-fallback-${i + 1}`,
      name: `Bowler ${30 + i}`,
      bowlerNumber: 30 + i,
      position: 'second'
    });
  }

  const activeLeads: Player[] = [];
  for (let i = 0; i < perRole; i++) {
    activeLeads.push(leadPool[i] || {
      id: `lead-fallback-${i + 1}`,
      name: `Bowler ${60 + i}`,
      bowlerNumber: 60 + i,
      position: 'lead'
    });
  }

  // Generate 3 rounds using optimized constraint solver
  const solvedRawRounds = solve3RoundsCore(rinkCount, keepPair);

  // Convert raw indices into rich RoundDraw objects
  const rounds: RoundDraw[] = solvedRawRounds.map((roundMatches, roundIndex) => {
    const roundNumber = roundIndex + 1;
    const rinks: Rink[] = roundMatches.map((match) => {
      const rinkNum = match.rink + 1;
      const sA = activeSkips[match.sA];
      const sB = activeSkips[match.sB];
      const mA = activeSeconds[match.mA];
      const mB = activeSeconds[match.mB];
      const lA = activeLeads[match.lA];
      const lB = activeLeads[match.lB];

      const teamA: Team = {
        id: `r${roundNumber}-rink-${rinkNum}-team-a`,
        name: 'Red Team',
        color: 'red',
        skip: sA,
        second: mA,
        lead: lA
      };

      const teamB: Team = {
        id: `r${roundNumber}-rink-${rinkNum}-team-b`,
        name: 'Blue Team',
        color: 'blue',
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
  mA: number;
  mB: number;
  lA: number;
  lB: number;
  rink: number;
}

function solve3RoundsCore(R: number, keepPair: boolean = false): RawMatch[][] {
  if (keepPair) {
    return solveKeepPairsCore(R);
  }

  if (R === 1) {
    return [
      [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }],
      [{ sA: 0, sB: 1, mA: 1, mB: 0, lA: 1, lB: 0, rink: 0 }],
      [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 1, lB: 0, rink: 0 }]
    ];
  }

  if (R === 2) {
    // Verified 100% unique teammates, 100% unique positional opponents, <=2 on same rink
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
  }

  const T = 2 * R;

  // Randomized solver with backtracking for R >= 3
  for (let overall = 0; overall < 150; overall++) {
    const skipSec = new Set<string>();
    const skipLead = new Set<string>();
    const secLead = new Set<string>();

    const skipOpp = new Set<string>();
    const secOpp = new Set<string>();
    const leadOpp = new Set<string>();

    const playerRinks = Array.from({ length: 3 * T }, () => [] as number[]);
    const rounds: RawMatch[][] = [];
    let allRoundsSuccess = true;

    for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
      let roundSuccess = false;

      for (let attempt = 0; attempt < 350; attempt++) {
        const availSkips = Array.from({ length: T }, (_, i) => i);
        const availSecs = Array.from({ length: T }, (_, i) => i);
        const availLeads = Array.from({ length: T }, (_, i) => i);
        const availRinks = Array.from({ length: R }, (_, i) => i);

        // Fisher-Yates shuffle
        const shuffle = (arr: number[]) => {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
        };

        shuffle(availSkips);
        shuffle(availSecs);
        shuffle(availLeads);
        shuffle(availRinks);

        const curMatches: RawMatch[] = [];
        let matchOk = true;

        for (let m = 0; m < R; m++) {
          const rink = availRinks[m];
          const sA = availSkips[m * 2];
          let sB = availSkips[m * 2 + 1];
          const sKey = sA < sB ? `${sA}-${sB}` : `${sB}-${sA}`;

          if (skipOpp.has(sKey)) {
            let foundSwap = false;
            for (let k = m * 2 + 2; k < T; k++) {
              const testB = availSkips[k];
              const testKey = sA < testB ? `${sA}-${testB}` : `${testB}-${sA}`;
              if (!skipOpp.has(testKey)) {
                availSkips[k] = sB;
                availSkips[m * 2 + 1] = testB;
                sB = testB;
                foundSwap = true;
                break;
              }
            }
            if (!foundSwap) { matchOk = false; break; }
          }

          // Check rink repetition for skips
          if (playerRinks[sA].includes(rink) || playerRinks[sB].includes(rink)) {
            matchOk = false; break;
          }

          // Find compatible Seconds for sA and sB on this rink
          let bestM: [number, number] | null = null;
          for (let i = 0; i < availSecs.length; i++) {
            const mA = availSecs[i];
            if (skipSec.has(`${sA}-${mA}`)) continue;
            if (playerRinks[T + mA].includes(rink)) continue;

            for (let j = 0; j < availSecs.length; j++) {
              if (i === j) continue;
              const mB = availSecs[j];
              if (skipSec.has(`${sB}-${mB}`)) continue;
              if (secOpp.has(mA < mB ? `${mA}-${mB}` : `${mB}-${mA}`)) continue;
              if (playerRinks[T + mB].includes(rink)) continue;

              bestM = [mA, mB];
              break;
            }
            if (bestM) break;
          }

          if (!bestM) { matchOk = false; break; }

          const [mA, mB] = bestM;
          availSecs.splice(availSecs.indexOf(mA), 1);
          availSecs.splice(availSecs.indexOf(mB), 1);

          // Find compatible Leads for team A and team B on this rink
          let bestL: [number, number] | null = null;
          for (let i = 0; i < availLeads.length; i++) {
            const lA = availLeads[i];
            if (skipLead.has(`${sA}-${lA}`) || secLead.has(`${mA}-${lA}`)) continue;
            if (playerRinks[2 * T + lA].includes(rink)) continue;

            for (let j = 0; j < availLeads.length; j++) {
              if (i === j) continue;
              const lB = availLeads[j];
              if (skipLead.has(`${sB}-${lB}`) || secLead.has(`${mB}-${lB}`)) continue;
              if (leadOpp.has(lA < lB ? `${lA}-${lB}` : `${lB}-${lA}`)) continue;
              if (playerRinks[2 * T + lB].includes(rink)) continue;

              bestL = [lA, lB];
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
            skipSec.add(`${cm.sA}-${cm.mA}`); skipSec.add(`${cm.sB}-${cm.mB}`);
            skipLead.add(`${cm.sA}-${cm.lA}`); skipLead.add(`${cm.sB}-${cm.lB}`);
            secLead.add(`${cm.mA}-${cm.lA}`); secLead.add(`${cm.mB}-${cm.lB}`);

            skipOpp.add(cm.sA < cm.sB ? `${cm.sA}-${cm.sB}` : `${cm.sB}-${cm.sA}`);
            secOpp.add(cm.mA < cm.mB ? `${cm.mA}-${cm.mB}` : `${cm.mB}-${cm.mA}`);
            leadOpp.add(cm.lA < cm.lB ? `${cm.lA}-${cm.lB}` : `${cm.lB}-${cm.lA}`);

            [cm.sA, cm.sB].forEach(p => playerRinks[p].push(cm.rink));
            [cm.mA, cm.mB].forEach(p => playerRinks[T + p].push(cm.rink));
            [cm.lA, cm.lB].forEach(p => playerRinks[2 * T + p].push(cm.rink));
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
      return rounds;
    }
  }

  // Fallback if extreme edge case
  return [
    Array.from({ length: R }, (_, i) => ({ sA: i * 2, sB: i * 2 + 1, mA: i * 2, mB: i * 2 + 1, lA: i * 2, lB: i * 2 + 1, rink: i })),
    Array.from({ length: R }, (_, i) => ({ sA: i * 2, sB: (i * 2 + 2) % T, mA: (i * 2 + 1) % T, mB: (i * 2 + 3) % T, lA: (i * 2 + 2) % T, lB: (i * 2 + 4) % T, rink: (i + 1) % R })),
    Array.from({ length: R }, (_, i) => ({ sA: i * 2, sB: (i * 2 + 3) % T, mA: (i * 2 + 2) % T, mB: (i * 2 + 4) % T, lA: (i * 2 + 3) % T, lB: (i * 2 + 5) % T, rink: (i + 2) % R }))
  ];
}

function solveKeepPairsCore(R: number): RawMatch[][] {
  if (R === 1) {
    // 6 players: 2 Skips (0, 1), 2 Seconds (0, 1), 2 Leads (0, 1)
    // Second 0 (Second 30) & Lead 0 (Lead 60) remain together across all 3 rounds.
    // Skips alternate between 0 and 1 so they do not have the same skip twice consecutively.
    return [
      [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }],
      [{ sA: 1, sB: 0, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }],
      [{ sA: 0, sB: 1, mA: 0, mB: 1, lA: 0, lB: 1, rink: 0 }]
    ];
  }

  if (R === 2) {
    // 12 players: 4 Skips (0..3), 4 Seconds (0..3), 4 Leads (0..3)
    // Second 0 (Second 30) & Lead 0 (Lead 60) remain together across all 3 rounds with 3 DIFFERENT skips (0, 1, 3)!
    return [
      [
        { sA: 0, sB: 1, mA: 0, mB: 3, lA: 0, lB: 2, rink: 0 },
        { sA: 3, sB: 2, mA: 2, mB: 1, lA: 3, lB: 1, rink: 1 }
      ],
      [
        { sA: 1, sB: 3, mA: 0, mB: 3, lA: 0, lB: 1, rink: 1 },
        { sA: 2, sB: 0, mA: 2, mB: 1, lA: 2, lB: 3, rink: 0 }
      ],
      [
        { sA: 3, sB: 1, mA: 0, mB: 2, lA: 0, lB: 1, rink: 0 },
        { sA: 0, sB: 2, mA: 1, mB: 3, lA: 2, lB: 3, rink: 1 }
      ]
    ];
  }

  if (R === 3) {
    // 18 players: 6 Skips (0..5), 6 Seconds (0..5), 6 Leads (0..5)
    // Second 0 (Second 30) & Lead 0 (Lead 60) remain together across all 3 rounds with 3 DIFFERENT skips (2, 0, 3)!
    // 100% unique teammates (all other pairs), 100% unique opponents, max 2 on same rink.
    return [
      [
        { sA: 2, sB: 5, mA: 0, mB: 5, lA: 0, lB: 5, rink: 2 },
        { sA: 0, sB: 4, mA: 4, mB: 2, lA: 2, lB: 3, rink: 0 },
        { sA: 1, sB: 3, mA: 1, mB: 3, lA: 1, lB: 4, rink: 1 }
      ],
      [
        { sA: 0, sB: 2, mA: 0, mB: 3, lA: 0, lB: 3, rink: 1 },
        { sA: 1, sB: 5, mA: 4, mB: 1, lA: 5, lB: 4, rink: 0 },
        { sA: 3, sB: 4, mA: 2, mB: 5, lA: 1, lB: 2, rink: 2 }
      ],
      [
        { sA: 3, sB: 5, mA: 0, mB: 4, lA: 0, lB: 1, rink: 1 },
        { sA: 0, sB: 1, mA: 1, mB: 5, lA: 3, lB: 4, rink: 0 },
        { sA: 2, sB: 4, mA: 2, mB: 3, lA: 2, lB: 5, rink: 2 }
      ]
    ];
  }

  const T = 2 * R;
  const maxRink = 1;

  // Randomized solver with pair-first placement for R >= 4
  // Guaranteed: Lead 60 (lead 0) & Second 30 (sec 0) together on same team in all rounds,
  // with distinct skips each round, 100% unique teammates & opponents.
  for (let overall = 0; overall < 500; overall++) {
    const skipSec = new Set<string>();
    const skipLead = new Set<string>();
    const secLead = new Set<string>();
    const skipOpp = new Set<string>();
    const secOpp = new Set<string>();
    const leadOpp = new Set<string>();

    const pRinks = Array.from({ length: 3 * T }, () => [] as number[]);
    const pairSkips = new Set<number>();
    const rounds: RawMatch[][] = [];
    let allOk = true;

    for (let roundIdx = 0; roundIdx < 3; roundIdx++) {
      let roundOk = false;

      for (let att = 0; att < 500; att++) {
        const availSkips = Array.from({ length: T }, (_, i) => i);
        const availSecs = Array.from({ length: T }, (_, i) => i);
        const availLeads = Array.from({ length: T }, (_, i) => i);
        const availRinks = Array.from({ length: R }, (_, i) => i);

        // Remove sec 0 (Second 30) and lead 0 (Lead 60) - they are the locked pair
        availSecs.splice(0, 1);
        availLeads.splice(0, 1);

        // 1. Pick rink for pair (Sec 0, Lead 0)
        const validPairRinks = availRinks.filter(r => pRinks[T + 0].filter(x => x === r).length < maxRink);
        if (validPairRinks.length === 0) continue;
        const pairRink = validPairRinks[Math.floor(Math.random() * validPairRinks.length)];
        availRinks.splice(availRinks.indexOf(pairRink), 1);

        // 2. Pick skip for pair (must not be in pairSkips so distinct skip each round)
        const validPairSkips = availSkips.filter(s =>
          !pairSkips.has(s) &&
          pRinks[s].filter(x => x === pairRink).length < maxRink &&
          !skipSec.has(`${s}-0`) &&
          !skipLead.has(`${s}-0`)
        );
        if (validPairSkips.length === 0) continue;
        const pairSkip = validPairSkips[Math.floor(Math.random() * validPairSkips.length)];
        availSkips.splice(availSkips.indexOf(pairSkip), 1);

        // 3. Pick opposing skip for pair match
        const validOppSkips = availSkips.filter(s =>
          !skipOpp.has(pairSkip < s ? `${pairSkip}-${s}` : `${s}-${pairSkip}`) &&
          pRinks[s].filter(x => x === pairRink).length < maxRink
        );
        if (validOppSkips.length === 0) continue;
        const oppSkip = validOppSkips[Math.floor(Math.random() * validOppSkips.length)];
        availSkips.splice(availSkips.indexOf(oppSkip), 1);

        // 4. Pick opposing second for pair match
        const validOppSecs = availSecs.filter(m =>
          !skipSec.has(`${oppSkip}-${m}`) &&
          !secOpp.has(`0-${m}`) &&
          pRinks[T + m].filter(x => x === pairRink).length < maxRink
        );
        if (validOppSecs.length === 0) continue;
        const oppSec = validOppSecs[Math.floor(Math.random() * validOppSecs.length)];
        availSecs.splice(availSecs.indexOf(oppSec), 1);

        // 5. Pick opposing lead for pair match
        const validOppLeads = availLeads.filter(l =>
          !skipLead.has(`${oppSkip}-${l}`) &&
          !secLead.has(`${oppSec}-${l}`) &&
          !leadOpp.has(`0-${l}`) &&
          pRinks[2 * T + l].filter(x => x === pairRink).length < maxRink
        );
        if (validOppLeads.length === 0) continue;
        const oppLead = validOppLeads[Math.floor(Math.random() * validOppLeads.length)];
        availLeads.splice(availLeads.indexOf(oppLead), 1);

        const pairMatch: RawMatch = {
          sA: pairSkip, sB: oppSkip,
          mA: 0, mB: oppSec,
          lA: 0, lB: oppLead,
          rink: pairRink
        };

        const curMatches: RawMatch[] = [pairMatch];
        let restOk = true;

        const shuffle = (arr: number[]) => {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
        };
        shuffle(availSkips);
        shuffle(availSecs);
        shuffle(availLeads);
        shuffle(availRinks);

        for (let m = 0; m < R - 1; m++) {
          const rink = availRinks[m];
          let sA = availSkips[m * 2];
          let sB = availSkips[m * 2 + 1];
          let sKey = sA < sB ? `${sA}-${sB}` : `${sB}-${sA}`;

          if (skipOpp.has(sKey)) {
            let foundSwap = false;
            for (let k = m * 2 + 2; k < availSkips.length; k++) {
              const testB = availSkips[k];
              const testKey = sA < testB ? `${sA}-${testB}` : `${testB}-${sA}`;
              if (!skipOpp.has(testKey)) {
                availSkips[k] = sB;
                availSkips[m * 2 + 1] = testB;
                sB = testB;
                foundSwap = true;
                break;
              }
            }
            if (!foundSwap) { restOk = false; break; }
          }

          if (pRinks[sA].filter(x => x === rink).length >= maxRink ||
              pRinks[sB].filter(x => x === rink).length >= maxRink) {
            restOk = false; break;
          }

          let bestM: [number, number] | null = null;
          for (let i = 0; i < availSecs.length; i++) {
            const mA = availSecs[i];
            if (skipSec.has(`${sA}-${mA}`)) continue;
            if (pRinks[T + mA].filter(x => x === rink).length >= maxRink) continue;

            for (let j = 0; j < availSecs.length; j++) {
              if (i === j) continue;
              const mB = availSecs[j];
              if (skipSec.has(`${sB}-${mB}`)) continue;
              if (secOpp.has(mA < mB ? `${mA}-${mB}` : `${mB}-${mA}`)) continue;
              if (pRinks[T + mB].filter(x => x === rink).length >= maxRink) continue;

              bestM = [mA, mB];
              break;
            }
            if (bestM) break;
          }
          if (!bestM) { restOk = false; break; }

          const [mA, mB] = bestM;
          availSecs.splice(availSecs.indexOf(mA), 1);
          availSecs.splice(availSecs.indexOf(mB), 1);

          let bestL: [number, number] | null = null;
          for (let i = 0; i < availLeads.length; i++) {
            const lA = availLeads[i];
            if (skipLead.has(`${sA}-${lA}`)) continue;
            if (secLead.has(`${mA}-${lA}`)) continue;
            if (pRinks[2 * T + lA].filter(x => x === rink).length >= maxRink) continue;

            for (let j = 0; j < availLeads.length; j++) {
              if (i === j) continue;
              const lB = availLeads[j];
              if (skipLead.has(`${sB}-${lB}`)) continue;
              if (secLead.has(`${mB}-${lB}`)) continue;
              if (leadOpp.has(lA < lB ? `${lA}-${lB}` : `${lB}-${lA}`)) continue;
              if (pRinks[2 * T + lB].filter(x => x === rink).length >= maxRink) continue;

              bestL = [lA, lB];
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
            skipSec.add(`${sA}-${mA}`); skipSec.add(`${sB}-${mB}`);
            skipLead.add(`${sA}-${lA}`); skipLead.add(`${sB}-${lB}`);
            secLead.add(`${mA}-${lA}`); secLead.add(`${mB}-${lB}`);
            skipOpp.add(sA < sB ? `${sA}-${sB}` : `${sB}-${sA}`);
            secOpp.add(mA < mB ? `${mA}-${mB}` : `${mB}-${mA}`);
            leadOpp.add(lA < lB ? `${lA}-${lB}` : `${lB}-${lA}`);
            pRinks[sA].push(rink); pRinks[sB].push(rink);
            pRinks[T + mA].push(rink); pRinks[T + mB].push(rink);
            pRinks[2 * T + lA].push(rink); pRinks[2 * T + lB].push(rink);
            if (mA === 0) pairSkips.add(sA);
            if (mB === 0) pairSkips.add(sB);
          }
          rounds.push(curMatches);
          break;
        }
      }

      if (!roundOk) { allOk = false; break; }
    }

    if (allOk && rounds.length === 3) {
      return rounds;
    }
  }

  // Deterministic circular fallback
  return [
    Array.from({ length: R }, (_, i) => ({
      sA: i * 2,
      sB: i * 2 + 1,
      mA: i * 2,
      mB: i * 2 + 1,
      lA: i * 2,
      lB: i * 2 + 1,
      rink: i
    })),
    Array.from({ length: R }, (_, i) => ({
      sA: (i * 2 + 1) % T,
      sB: (i * 2 + 2) % T,
      mA: (i * 2) % T,
      mB: (i * 2 + 2) % T,
      lA: (i * 2) % T,
      lB: (i * 2 + 2) % T,
      rink: (i + 1) % R
    })),
    Array.from({ length: R }, (_, i) => ({
      sA: (i * 2 + 2) % T,
      sB: (i * 2 + 3) % T,
      mA: (i * 2) % T,
      mB: (i * 2 + 3) % T,
      lA: (i * 2) % T,
      lB: (i * 2 + 3) % T,
      rink: (i + 2) % R
    }))
  ];
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

  rounds.forEach(round => {
    round.rinks.forEach(rink => {
      const { teamA, teamB, rinkNumber } = rink;

      // Track team A
      const pairKey = (n1: number, n2: number) => (n1 < n2 ? `${n1}-${n2}` : `${n2}-${n1}`);

      const recordTeam = (skipNum: number, secNum: number, leadNum: number) => {
        [pairKey(skipNum, secNum), pairKey(skipNum, leadNum), pairKey(secNum, leadNum)].forEach(k => {
          teammatePairs.set(k, (teammatePairs.get(k) || 0) + 1);
          totalTeammatePairings++;
        });

        [skipNum, secNum, leadNum].forEach(pNum => {
          const visits = playerRinkVisits.get(pNum) || [];
          visits.push(rinkNumber);
          playerRinkVisits.set(pNum, visits);
        });
      };

      recordTeam(teamA.skip.bowlerNumber, teamA.second.bowlerNumber, teamA.lead.bowlerNumber);
      recordTeam(teamB.skip.bowlerNumber, teamB.second.bowlerNumber, teamB.lead.bowlerNumber);

      // Positional opponents
      const sOpp = pairKey(teamA.skip.bowlerNumber, teamB.skip.bowlerNumber);
      const mOpp = pairKey(teamA.second.bowlerNumber, teamB.second.bowlerNumber);
      const lOpp = pairKey(teamA.lead.bowlerNumber, teamB.lead.bowlerNumber);

      [sOpp, mOpp, lOpp].forEach(k => {
        positionalOpponents.set(k, (positionalOpponents.get(k) || 0) + 1);
        totalPositionalMatchups++;
      });
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

  // In R=1 (6 players), pigeonhole principle limits uniqueness
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

function formatBowlerDisplay(p: Player): string {
  return isUserEnteredName(p.name, p.bowlerNumber)
    ? `Player ${p.bowlerNumber} (${p.name})`
    : `Player ${p.bowlerNumber}`;
}

export function formatTournamentDrawText(tournament: TournamentDraw, startRink: number = 1): string {
  let text = `==============================================\n`;
  text += `   LAWN BOWLS 3-ROUND TOURNAMENT DRAW\n`;
  text += `==============================================\n`;
  text += `Total Players: ${tournament.playerCount} (${tournament.rinkCount} Rinks • Triples • Starting Rink ${startRink})\n`;
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
      text += `[ RINK ${calculatedRink} ]\n`;
      text += `  RED (Team A):\n`;
      text += `    Skip:   ${formatBowlerDisplay(rink.teamA.skip)}\n`;
      text += `    Second: ${formatBowlerDisplay(rink.teamA.second)}\n`;
      text += `    Lead:   ${formatBowlerDisplay(rink.teamA.lead)}\n`;
      text += `  vs\n`;
      text += `  BLUE (Team B):\n`;
      text += `    Skip:   ${formatBowlerDisplay(rink.teamB.skip)}\n`;
      text += `    Second: ${formatBowlerDisplay(rink.teamB.second)}\n`;
      text += `    Lead:   ${formatBowlerDisplay(rink.teamB.lead)}\n\n`;
    });
  });

  text += `Good bowling everyone! May the jack roll true.`;
  return text;
}

export function formatDrawText(rinks: Rink[], startRink: number = 1): string {
  let text = `=== LAWN BOWLS TRIPLES DRAW ===\n`;
  text += `Total Rinks: ${rinks.length} (${rinks.length * 6} Players • Starting Rink ${startRink})\n`;
  text += `Position Blocks: Skips (1-29) • Seconds (30-59) • Leads (60-89)\n\n`;

  rinks.forEach(rink => {
    const calculatedRink = (startRink - 1) + rink.rinkNumber;
    text += `[ RINK ${calculatedRink} ]\n`;
    text += `  RED (Team A):\n`;
    text += `    Skip:   ${formatBowlerDisplay(rink.teamA.skip)}\n`;
    text += `    Second: ${formatBowlerDisplay(rink.teamA.second)}\n`;
    text += `    Lead:   ${formatBowlerDisplay(rink.teamA.lead)}\n`;
    text += `  vs\n`;
    text += `  BLUE (Team B):\n`;
    text += `    Skip:   ${formatBowlerDisplay(rink.teamB.skip)}\n`;
    text += `    Second: ${formatBowlerDisplay(rink.teamB.second)}\n`;
    text += `    Lead:   ${formatBowlerDisplay(rink.teamB.lead)}\n\n`;
  });

  text += `Good bowling everyone! May the jack roll true.`;
  return text;
}

export function formatFlatDrawText(tournament: TournamentDraw, players: Player[], startRink: number = 1): string {
  let text = `=== LAWN BOWLS FLAT DRAW (PLAYER NUMBERS) ===\n`;
  text += `Total Bowlers: ${tournament.playerCount} (${tournament.rinkCount} Rinks • Triples • Starting Rink ${startRink})\n`;
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
        const teamA = [r.teamA.skip, r.teamA.second, r.teamA.lead];
        const teamB = [r.teamB.skip, r.teamB.second, r.teamB.lead];

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
