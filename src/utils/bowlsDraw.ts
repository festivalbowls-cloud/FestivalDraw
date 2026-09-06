import { Player, Rink, Team } from '../types';

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

export function generateDefaultPlayers(count: number, useNames: boolean = true): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < count; i++) {
    const name = useNames && i < SAMPLE_BOWLER_NAMES.length
      ? SAMPLE_BOWLER_NAMES[i]
      : `Player ${i + 1}`;
    players.push({
      id: `p-${i + 1}`,
      name,
      rolePreference: 'any'
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

export function executeDraw(players: Player[], balanceRoles: boolean = false): Rink[] {
  const rinkCount = Math.floor(players.length / 6);
  if (rinkCount === 0) return [];

  let pool = [...players];

  if (balanceRoles) {
    const skips = shuffleArray(pool.filter(p => p.rolePreference === 'skip'));
    const seconds = shuffleArray(pool.filter(p => p.rolePreference === 'second'));
    const leads = shuffleArray(pool.filter(p => p.rolePreference === 'lead'));
    const any = shuffleArray(pool.filter(p => !p.rolePreference || p.rolePreference === 'any'));

    const requiredPerRole = rinkCount * 2;
    const finalSkips: Player[] = [];
    const finalSeconds: Player[] = [];
    const finalLeads: Player[] = [];

    // Fill skips
    while (finalSkips.length < requiredPerRole) {
      if (skips.length > 0) finalSkips.push(skips.pop()!);
      else if (any.length > 0) finalSkips.push(any.pop()!);
      else if (seconds.length > 0) finalSkips.push(seconds.pop()!);
      else if (leads.length > 0) finalSkips.push(leads.pop()!);
      else break;
    }

    // Fill seconds
    while (finalSeconds.length < requiredPerRole) {
      if (seconds.length > 0) finalSeconds.push(seconds.pop()!);
      else if (any.length > 0) finalSeconds.push(any.pop()!);
      else if (skips.length > 0) finalSeconds.push(skips.pop()!);
      else if (leads.length > 0) finalSeconds.push(leads.pop()!);
      else break;
    }

    // Fill leads
    while (finalLeads.length < requiredPerRole) {
      if (leads.length > 0) finalLeads.push(leads.pop()!);
      else if (any.length > 0) finalLeads.push(any.pop()!);
      else if (seconds.length > 0) finalLeads.push(seconds.pop()!);
      else if (skips.length > 0) finalLeads.push(skips.pop()!);
      else break;
    }

    const rinks: Rink[] = [];
    for (let r = 0; r < rinkCount; r++) {
      const skipA = finalSkips[r * 2] || { id: `auto-${r}-1`, name: `Player` };
      const skipB = finalSkips[r * 2 + 1] || { id: `auto-${r}-2`, name: `Player` };
      const secondA = finalSeconds[r * 2] || { id: `auto-${r}-3`, name: `Player` };
      const secondB = finalSeconds[r * 2 + 1] || { id: `auto-${r}-4`, name: `Player` };
      const leadA = finalLeads[r * 2] || { id: `auto-${r}-5`, name: `Player` };
      const leadB = finalLeads[r * 2 + 1] || { id: `auto-${r}-6`, name: `Player` };

      const teamA: Team = {
        id: `rink-${r + 1}-team-a`,
        name: 'Red Team',
        color: 'red',
        lead: leadA,
        second: secondA,
        skip: skipA
      };

      const teamB: Team = {
        id: `rink-${r + 1}-team-b`,
        name: 'Blue Team',
        color: 'blue',
        lead: leadB,
        second: secondB,
        skip: skipB
      };

      rinks.push({
        id: `rink-${r + 1}`,
        rinkNumber: r + 1,
        teamA,
        teamB
      });
    }

    return rinks;
  }

  // Complete random draw
  const shuffled = shuffleArray(pool);
  const rinks: Rink[] = [];

  for (let r = 0; r < rinkCount; r++) {
    const baseIdx = r * 6;
    const teamA: Team = {
      id: `rink-${r + 1}-team-a`,
      name: 'Red Team',
      color: 'red',
      lead: shuffled[baseIdx + 0],
      second: shuffled[baseIdx + 1],
      skip: shuffled[baseIdx + 2]
    };

    const teamB: Team = {
      id: `rink-${r + 1}-team-b`,
      name: 'Blue Team',
      color: 'blue',
      lead: shuffled[baseIdx + 3],
      second: shuffled[baseIdx + 4],
      skip: shuffled[baseIdx + 5]
    };

    rinks.push({
      id: `rink-${r + 1}`,
      rinkNumber: r + 1,
      teamA,
      teamB
    });
  }

  return rinks;
}

export function formatDrawText(rinks: Rink[]): string {
  let text = `=== LAWN BOWLS TRIPLES DRAW ===\n`;
  text += `Total Rinks: ${rinks.length} (${rinks.length * 6} Players)\n\n`;

  rinks.forEach(rink => {
    text += `[ RINK ${rink.rinkNumber} ]\n`;
    text += `  RED (Team A):\n`;
    text += `    Skip:   ${rink.teamA.skip.name}\n`;
    text += `    Second: ${rink.teamA.second.name}\n`;
    text += `    Lead:   ${rink.teamA.lead.name}\n`;
    text += `  vs\n`;
    text += `  BLUE (Team B):\n`;
    text += `    Skip:   ${rink.teamB.skip.name}\n`;
    text += `    Second: ${rink.teamB.second.name}\n`;
    text += `    Lead:   ${rink.teamB.lead.name}\n\n`;
  });

  text += `Good bowling everyone! May the jack roll true.`;
  return text;
}
