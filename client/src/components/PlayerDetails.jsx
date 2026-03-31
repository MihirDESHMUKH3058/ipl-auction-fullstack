import React, { useState, useEffect } from 'react';
import './PlayerDetails.css';
import { getPlayerStats } from '../mockStats';

export default function PlayerDetails({ player, onBack, auctionRecord }) {
  const [imgError, setImgError] = useState(false);
  const stats = getPlayerStats(player.id);

  // Helper to determine team color variable
  const getTeamColor = (teamCode) => {
    const teams = ['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'LSG', 'GT'];
    if (teams.includes(teamCode)) {
      return `var(--${teamCode.toLowerCase()})`;
    }
    return 'var(--neon-blue)';
  };

  const teamColor = getTeamColor(player.team);

  const getTeamHex = (teamCode) => {
    const hexes = {
      CSK: 'fdb913', MI: '004ba0', RCB: 'ea1a2a', KKR: '3a225d', 
      DC: '174ebd', SRH: 'f26522', RR: 'ea1a85', PBKS: 'ed1b24', 
      LSG: '2b1f82', GT: '1b2133'
    };
    return hexes[teamCode] || '00e5ff';
  };

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=${getTeamHex(player.team)}&color=fff&size=500&font-size=0.33`;

  // Render stars
  const renderStars = (rating) => {
    return Array.from({ length: 10 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
    ));
  };

  return (
    <div className="player-details-overlay" style={{ '--player-accent': teamColor }}>
      <div className="player-details-container">
        <button className="back-button" onClick={onBack}>
          ← Back to Catalog
        </button>

        <div className="details-layout">
          {/* Left: Player Profile Card */}
          <div className="profile-section">
            <div className="profile-image-card">
              <div className={`status-badge ${auctionRecord ? 'sold' : 'available'}`}>
                {auctionRecord ? (auctionRecord.team === 'UNSOLD' ? 'UNSOLD' : `SOLD: ${auctionRecord.team}`) : 'AVAILABLE'}
              </div>
              
              <div className="profile-img-container">
                {!imgError ? (
                  <img 
                    src={player.image_file ? `${import.meta.env.BASE_URL}players/${player.image_file}` : `${import.meta.env.BASE_URL}players/${player.id}.png`} 
                    alt={player.name}
                    onError={() => setImgError(true)}
                    className="details-player-image"
                  />
                ) : (
                  <img 
                    src={fallbackUrl}
                    alt={player.name}
                    className="details-player-image"
                  />
                )}
              </div>
              
              <div className="profile-name-box">
                <h1 className="details-name">{player.name}</h1>
                <p className="details-role">{player.role} • {player.country}</p>
                <div className="details-rating">
                  <div className="stars">{renderStars(player.rating)}</div>
                  <span className="rating-text">{player.rating}/10</span>
                </div>
              </div>

              {auctionRecord && (
                <div className="auction-info-card">
                  <div className="info-row">
                    <span>Final Price</span>
                    <span className="price-value">{auctionRecord.final_price}</span>
                  </div>
                  <div className="info-row">
                    <span>Bought by</span>
                    <span className="team-badge" style={{ backgroundColor: teamColor }}>{auctionRecord.team}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats Section */}
          <div className="stats-section">
            <h2 className="section-title">IPL CAREER STATISTICS</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Runs</span>
                <span className="stat-value">{stats.totalRuns}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Wickets</span>
                <span className="stat-value">{stats.totalWickets}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Batting SR</span>
                <span className="stat-value">{stats.battingSR}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Bowling Econ</span>
                <span className="stat-value">{stats.bowlingEconomy}</span>
              </div>
              <div className="stat-card destac">
                <span className="stat-label">Best Batting</span>
                <span className="stat-value">{stats.bestScore}</span>
              </div>
              <div className="stat-card destac">
                <span className="stat-label">Best Bowling</span>
                <span className="stat-value">{stats.bestBowling}</span>
              </div>
            </div>

            <div className="player-meta">
              <div className="meta-item prof" style={{ flex: 1 }}>
                <span className="meta-label">Playing Style</span>
                <span className="meta-value" style={{ color: '#fff', fontSize: '1.1rem' }}>
                  {player.display_role || player.role}
                </span>
              </div>
            </div>

            <div className="player-meta" style={{ marginTop: '1rem' }}>
              <div className="meta-item">
                <span className="meta-label">Origin</span>
                <span className="meta-value">{player.overseas === 'Overseas' ? '✈️ Overseas' : '🇮🇳 Indian'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Base Price</span>
                <span className="meta-value">{player.basePrice}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Player ID</span>
                <span className="meta-value">#{player.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
