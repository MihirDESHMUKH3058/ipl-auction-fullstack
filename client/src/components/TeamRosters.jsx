import React from 'react';
import './TeamRosters.css';

const TEAMS = ['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'LSG', 'GT'];

export default function TeamRosters({ players, auctionRecords }) {

  // Group players by the team that bought them
  const teamsData = TEAMS.map(teamName => {
    const boughtPlayerIds = Object.keys(auctionRecords).filter(
      id => auctionRecords[id].team === teamName
    );
    
    const roster = boughtPlayerIds.map(id => {
      const p = players.find(player => player.id.toString() === id.toString());
      return {
        ...p,
        final_price: auctionRecords[id.toString()].final_price
      };
    }).filter(p => p.name); // ensure we found them

    // Sum up total spent (rough estimate from string)
    let totalSpentLakhs = 0;
    roster.forEach(p => {
      const numStr = p.final_price.replace(/[^0-9]/g, '');
      totalSpentLakhs += (parseInt(numStr, 10) / 100000);
    });

    const totalPurseLakhs = 12000; // 120 Cr
    const remainingPurseLakhs = totalPurseLakhs - totalSpentLakhs;

    return {
      name: teamName,
      roster,
      totalSpentLakhs,
      totalPurseLakhs,
      remainingPurseLakhs
    };
  });

  return (
    <div className="rosters-container">
      <h2 className="rosters-title">Live Team Rosters</h2>
      <div className="teams-grid">
        {teamsData.map(team => (
          <div key={team.name} className="team-roster-card" style={{'--team-color': `var(--${team.name.toLowerCase()})`}}>
            <div className="team-header">
              <h3>{team.name}</h3>
              <div className="team-stats">
                <span className="stat-badge">{team.roster.length} Players</span>
                <span className="stat-badge purse">Purse: 120 Cr</span>
                <span className="stat-badge spent">Spent: {team.totalSpentLakhs >= 100 ? `${(team.totalSpentLakhs / 100).toFixed(2)} Cr` : `${team.totalSpentLakhs} L`}</span>
                <span className="stat-badge remaining">Left: {team.remainingPurseLakhs >= 100 ? `${(team.remainingPurseLakhs / 100).toFixed(2)} Cr` : `${team.remainingPurseLakhs} L`}</span>
              </div>
            </div>
            <div className="team-list">
              {team.roster.length === 0 ? (
                <div className="empty-roster">No players bought yet.</div>
              ) : (
                team.roster.map(player => (
                  <div key={player.id} className="roster-player">
                    <div className="roster-player-info">
                      <span className="roster-name">{player.name}</span>
                      <span className="roster-role">
                        {player.role} • {player.overseas === 'Overseas' ? '✈️' : '🇮🇳'} • ⭐ {player.rating || 'N/A'}
                      </span>
                    </div>
                    <span className="roster-price">{player.final_price}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
