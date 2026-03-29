import React from 'react';
import PlayerCard from './PlayerCard';
import './PlayerGrid.css';

export default function PlayerGrid({ players, auctionRecords = {} }) {
  if (players.length === 0) {
    return (
      <div className="no-results">
        <h3>No players found matching your criteria</h3>
        <p>Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="player-grid">
      {players.map(player => (
        <PlayerCard key={player.id} player={player} auctionRecord={auctionRecords[player.id.toString()]} />
      ))}
    </div>
  );
}
