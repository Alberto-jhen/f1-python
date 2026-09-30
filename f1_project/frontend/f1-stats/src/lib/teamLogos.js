// Escuderías de la parrilla 2026 con colores de referencia tomados de la Landing.
const TEAMS = [
  { match: 'ferrari', file: 'ferrari.png', color: '#dc2626' }, // red-600
  { match: 'mclaren', file: 'mclaren.svg', color: '#f97316' }, // orange-500
  { match: 'red bull', file: 'redbull.svg', color: '#2563eb' }, // blue-600
  { match: 'mercedes', file: 'mercedes.png', color: '#14b8a6' }, // teal-500
  { match: 'aston martin', file: 'aston-martin.svg', color: '#16a34a' }, // green-600
  { match: 'williams', file: 'williams.png', color: '#60a5fa' }, // blue-400
  { match: 'alpine', file: 'alpine.png', color: '#ec4899' }, // pink-500
  { match: 'haas', file: 'haas.png', color: '#6b7280' }, // gray-500
  { match: 'racing bulls', file: 'vcarb.png', color: '#3b82f6' }, // blue-500
  { match: 'audi', file: 'audi.svg', color: '#94a3b8' }, // slate-400
  { match: 'cadillac', file: 'cadillac.png', color: '#eab308' }, // yellow-500
];

function findTeam(teamName) {
  if (!teamName) return null;
  const normalized = teamName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return TEAMS.find(({ match }) => normalized.includes(match)) || null;
}

/** Devuelve la ruta del logo de /logos para un nombre de equipo, o null. */
export function getTeamLogo(teamName) {
  const team = findTeam(teamName);
  return team ? `/logos/${team.file}` : null;
}

/** Devuelve el color hex de referencia (Landing) para un nombre de equipo, o null. */
export function getTeamColor(teamName) {
  const team = findTeam(teamName);
  return team ? team.color : null;
}
