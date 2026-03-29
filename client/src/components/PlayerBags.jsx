import React, { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import './PlayerBags.css';

export default function PlayerBags({ players, auctionRecords }) {
  const [activeBagIndex, setActiveBagIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const bags = useMemo(() => {
    const categories = [
      { 
        id: 'capped-bat-in', 
        title: 'Bag 1: Indian Capped Batsman', 
        filter: p => p.role === 'Batsman' && p.overseas === 'Indian' && p.rating >= 7 
      },
      { 
        id: 'bat-ovs', 
        title: 'Bag 2: Overseas Batsman', 
        filter: p => p.role === 'Batsman' && p.overseas === 'Overseas' 
      },
      { 
        id: 'uncapped-bat-in', 
        title: 'Bag 3: Uncapped Indian Batsman', 
        filter: p => p.role === 'Batsman' && p.overseas === 'Indian' && p.rating < 7 
      },
      { 
        id: 'capped-bowl-in', 
        title: 'Bag 4: Indian Capped Bowler', 
        filter: p => p.role === 'Bowler' && p.overseas === 'Indian' && p.rating >= 7 
      },
      { 
        id: 'bowl-ovs', 
        title: 'Bag 5: Overseas Bowler', 
        filter: p => p.role === 'Bowler' && p.overseas === 'Overseas' 
      },
      { 
        id: 'uncapped-bowl-in', 
        title: 'Bag 6: Uncapped Indian Bowler', 
        filter: p => p.role === 'Bowler' && p.overseas === 'Indian' && p.rating < 7 
      },
      { 
        id: 'wk', 
        title: 'Bag 7: Wicketkeepers', 
        filter: p => p.role === 'Wicket-Keeper' 
      },
      { 
        id: 'allrounder-in', 
        title: 'Bag 8: Indian All-rounders', 
        filter: p => p.role === 'All-Rounder' && p.overseas === 'Indian' 
      },
      { 
        id: 'allrounder-ovs', 
        title: 'Bag 9: Overseas All-rounders', 
        filter: p => p.role === 'All-Rounder' && p.overseas === 'Overseas' 
      }
    ];

    return categories.map(cat => ({
      ...cat,
      players: players.filter(cat.filter)
    }));
  }, [players]);

  const activeBag = bags[activeBagIndex];
  
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return activeBag.players;
    return activeBag.players.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeBag, searchTerm]);

  return (
    <div className="bags-view">
      <div className="bags-sticky-header">
        <div className="bags-nav-bar">
          {bags.map((bag, index) => (
            <button
              key={bag.id}
              className={`bag-nav-item ${activeBagIndex === index ? 'active' : ''}`}
              onClick={() => {
                setActiveBagIndex(index);
                setSearchTerm('');
              }}
            >
              <span className="bag-idx">{index + 1}</span>
              <span className="bag-label">{bag.title.split(': ')[1]}</span>
              <span className="bag-dot"></span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bags-controls-section">
        <div className="bag-info">
          <h2>{activeBag.title}</h2>
          <p>{activeBag.players.length} Total Players</p>
        </div>
        <div className="bag-search">
          <input 
            type="text" 
            placeholder="Search in this bag..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bags-content">
        {filteredPlayers.length === 0 ? (
          <div className="empty-bag">
            <h3>No results found</h3>
            <p>Try a different keyword or check another bag.</p>
          </div>
        ) : (
          <div className="bags-grid">
            {filteredPlayers.map(player => (
              <PlayerCard key={player.id} player={player} auctionRecord={auctionRecords[player.id.toString()]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
