export const leagues = [
  { id: "bronze", name: "Bronze Liga", minPoints: 0, icon: "🥉" },
  { id: "silver", name: "Silber Liga", minPoints: 50, icon: "🥈" },
  { id: "gold", name: "Gold Liga", minPoints: 150, icon: "🥇" },
  { id: "diamond", name: "Diamant Liga", minPoints: 300, icon: "💎" },
];

export function getLeague(points = 0) {
  return leagues.reduce((currentLeague, league) => {
    return points >= league.minPoints ? league : currentLeague;
  }, leagues[0]);
}

export function getNextLeague(points = 0) {
  return leagues.find((league) => league.minPoints > points) || null;
}
