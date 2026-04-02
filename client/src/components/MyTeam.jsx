import React, { useMemo } from 'react';
import PlayerGrid from './PlayerGrid';
import './TeamRosters.css'; // Reusing team roster styles

export default function MyTeam({ players, auctionRecords, userTeam }) {
  const teamData = useMemo(() => {
    if (!userTeam) return null;
    
    const boughtPlayerIds = Object.keys(auctionRecords).filter(
      id => auctionRecords[id.toString()].team === userTeam
    );
    
    const roster = boughtPlayerIds.map(id => {
      const p = players.find(player => player.id.toString() === id.toString());
      return {
        ...p,
        final_price: auctionRecords[id.toString()].final_price
      };
    }).filter(p => p.name);

    let totalSpentLakhs = 0;
    roster.forEach(p => {
      const numStr = p.final_price.replace(/[^0-9]/g, '');
      totalSpentLakhs += (parseInt(numStr, 10) / 100000);
    });

    const totalPurseLakhs = 12000; // 120 Cr
    const remainingPurseLakhs = totalPurseLakhs - totalSpentLakhs;

    return {
      name: userTeam,
      roster,
      totalSpentLakhs,
      totalPurseLakhs,
      remainingPurseLakhs
    };
  }, [players, auctionRecords, userTeam]);

  if (!teamData) {
    return (
      <div className="rosters-container">
        <div className="auth-required" style={{padding: '3rem', textAlign: 'center', color: '#fff'}}>
          <h2>No Team Selected</h2>
          <p>Please log in as a team to see your roster.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rosters-container">
      <h2 className="rosters-title">My Team Dashboard: {teamData.name}</h2>
      
      <div className="team-roster-card active-team-view" style={{'--team-color': `var(--${teamData.name.toLowerCase()})`, maxWidth: '800px', margin: '0 auto'}}>
        <div className="team-header">
          <h3>{teamData.name} Squad</h3>
          <div className="team-stats">
            <span className="stat-badge">{teamData.roster.length} Players</span>
            <span className="stat-badge purse">Total Budget: 120 Cr</span>
            <span className="stat-badge spent">Spent: {teamData.totalSpentLakhs >= 100 ? `${(teamData.totalSpentLakhs / 100).toFixed(2)} Cr` : `${teamData.totalSpentLakhs} L`}</span>
            <span className="stat-badge remaining">Remaining: {teamData.remainingPurseLakhs >= 100 ? `${(teamData.remainingPurseLakhs / 100).toFixed(2)} Cr` : `${teamData.remainingPurseLakhs} L`}</span>
          </div>
        </div>
        
        <div className="team-list" style={{ padding: '1rem', background: 'transparent' }}>
          {teamData.roster.length === 0 ? (
            <div className="empty-roster">You haven't bought any players yet. Go to the Catalog to see available players!</div>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <PlayerGrid players={teamData.roster} auctionRecords={auctionRecords} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
