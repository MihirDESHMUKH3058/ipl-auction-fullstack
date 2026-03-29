import React, { useState } from 'react';
import './PlayerCard.css';

export default function PlayerCard({ player, auctionRecord }) {
  const [imgError, setImgError] = useState(false);

  // Helper to determine team color variable
  const getTeamColor = (teamCode) => {
    const teams = ['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'LSG', 'GT'];
    if (teams.includes(teamCode)) {
      return `var(--${teamCode.toLowerCase()})`;
    }
    return 'var(--neon-blue)';
  };

  const teamColor = getTeamColor(player.team);

  // Render stars
  const renderStars = (rating) => {
    return Array.from({ length: 10 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
    ));
  };

  const getTeamHex = (teamCode) => {
    const hexes = {
      CSK: 'fdb913', MI: '004ba0', RCB: 'ea1a2a', KKR: '3a225d', 
      DC: '174ebd', SRH: 'f26522', RR: 'ea1a85', PBKS: 'ed1b24', 
      LSG: '2b1f82', GT: '1b2133'
    };
    return hexes[teamCode] || '00e5ff';
  };

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=${getTeamHex(player.team)}&color=fff&size=250&font-size=0.33`;

  return (
    <div className="player-card" style={{ '--card-accent': teamColor }}>
      <div className="card-header" style={{ justifyContent: 'flex-end' }}>
        <div className={`origin-badge ${player.overseas === 'Overseas' ? 'overseas' : 'indian'}`}>
          {player.overseas === 'Overseas' ? '✈️ OVS' : (
             <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
               <img src={`${import.meta.env.BASE_URL}india_flag.png`} alt="India" style={{width: '14px', height: 'auto', borderRadius: '2px'}} />
               INDIA
             </span>
          )}
        </div>
      </div>
      
      <div className={`card-image-container ${auctionRecord ? 'sold-image' : ''}`}>
        {!imgError ? (
          <img 
            src={player.image_file ? `${import.meta.env.BASE_URL}players/${player.image_file}` : `${import.meta.env.BASE_URL}players/${player.id}.png`} 
            alt={player.name}
            onError={() => setImgError(true)}
            className="player-image"
          />
        ) : (
          <img 
            src={fallbackUrl}
            alt={player.name}
            className="player-image"
          />
        )}
        
        {auctionRecord && (
          <div className={`sold-overlay ${auctionRecord.team === 'UNSOLD' ? 'unsold-overlay' : ''}`}>
            <span className="sold-text">
              {auctionRecord.team === 'UNSOLD' ? 'UNSOLD' : `SOLD TO ${auctionRecord.team}`}
            </span>
          </div>
        )}
      </div>

      <div className="card-body">
        <h2 className="player-name">{player.name}</h2>
        <div className="player-role">{player.role} • {player.country}</div>
        
        <div className="player-rating">
          <div className="stars">{renderStars(player.rating)}</div>
          <span className="rating-text">{player.rating}/10</span>
        </div>

        {auctionRecord && (
          <div className="sold-status-badge" style={{ backgroundColor: auctionRecord.team === 'UNSOLD' ? '#4a5568' : `var(--${auctionRecord.team.toLowerCase()})` }}>
            {auctionRecord.team === 'UNSOLD' ? 'UNSOLD' : `SOLD TO ${auctionRecord.team}`}
          </div>
        )}

        <div className="card-footer">
          {auctionRecord ? (
            <>
              <div className="base-price-label">{auctionRecord.team === 'UNSOLD' ? 'Status' : 'Final Price'}</div>
              <div className="base-price-value final-price" style={{ color: auctionRecord.team === 'UNSOLD' ? '#a0aec0' : `var(--${auctionRecord.team.toLowerCase()})` }}>
                {auctionRecord.final_price}
              </div>
            </>
          ) : (
            <>
              <div className="base-price-label">Base Price</div>
              <div className="base-price-value">{player.basePrice}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
