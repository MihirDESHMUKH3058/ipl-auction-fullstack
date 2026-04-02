import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import './AuctionAdminPanel.css';

export default function AuctionAdminPanel({ players, auctionRecords, setAuctionRecords }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [finalPrice, setFinalPrice] = useState('');

  const teams = ['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'LSG', 'GT'];

  const availablePlayers = useMemo(() => {
    return players.filter(p => !auctionRecords[p.id.toString()] && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [players, auctionRecords, searchTerm]);

  const handleSell = async (e) => {
    e.preventDefault();
    const finalPriceCr = parseFloat(finalPrice);
    const finalPriceLakhs = finalPriceCr * 100;
    const priceString = `₹${(finalPriceLakhs * 100000).toLocaleString('en-IN')}`;
    const PURSE_LIMIT_LAKHS = 12000; // 120 Cr

    // Calculate current spending for the selected team
    let currentSpentLakhs = 0;
    Object.values(auctionRecords).forEach(record => {
      if (record.team === selectedTeam) {
        const numStr = record.final_price.replace(/[^0-9]/g, '');
        currentSpentLakhs += (parseInt(numStr, 10) / 100000);
      }
    });

    if (currentSpentLakhs + finalPriceLakhs > PURSE_LIMIT_LAKHS) {
      alert(`❌ Purse limit reached! You cannot buy any more players. (₹120 Cr exhausted)`);
      return;
    }

    // Optimistic Update
    const newRecords = {
      ...auctionRecords,
      [selectedPlayerId]: {
        team: selectedTeam,
        final_price: priceString
      }
    };
    setAuctionRecords(newRecords);

    // Supabase Sync
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      const { error } = await supabase.from('auction_records').upsert({
        player_id: selectedPlayerId.toString(),
        team: selectedTeam,
        final_price: priceString
      });
      if (error) {
        console.error("Supabase insert error:", error);
        alert("⚠️ DATABASE UPDATE FAILED: Player not stored in Supabase. Check internet connection.");
      } else {
        console.log("Successfully stored in Supabase");
      }
    }
    
    // Clear form
    setSelectedPlayerId('');
    setSelectedTeam('');
    setFinalPrice('');
    setSearchTerm('');
  };
  
  const handleUnsold = async () => {
    if (!selectedPlayerId) {
      alert("Please select a player first!");
      return;
    }

    const priceString = "UNSOLD";
    const unsoldTeam = "UNSOLD";

    // Optimistic Update
    const newRecords = {
      ...auctionRecords,
      [selectedPlayerId]: {
        team: unsoldTeam,
        final_price: priceString
      }
    };
    setAuctionRecords(newRecords);

    // Supabase Sync
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      const { error } = await supabase.from('auction_records').upsert({
        player_id: selectedPlayerId.toString(),
        team: unsoldTeam,
        final_price: priceString
      });
      if (error) {
        console.error("Supabase unsold error:", error);
        alert("⚠️ DATABASE UPDATE FAILED: Check connection.");
      }
    }

    // Clear form
    setSelectedPlayerId('');
    setSearchTerm('');
  };

  const handleResetPlayer = async (id) => {
    const stringId = id.toString();
    console.log("Undoing sale for player:", stringId);
    
    // Optimistic Update
    const newRecords = { ...auctionRecords };
    delete newRecords[stringId];
    setAuctionRecords(newRecords);

    // Supabase Sync
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      const { error } = await supabase.from('auction_records').delete().eq('player_id', stringId);
      if (error) console.error("Supabase delete error:", error);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm("⚠️ DANGER: This will UN-SELL ALL players and clear the entire auction history. Are you absolutely sure?")) {
      return;
    }

    console.log("Resetting entire auction...");
    
    // Optimistic Update
    setAuctionRecords({});

    // Supabase Sync
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
      // Deleting all records where player_id is not null (effectively all rows)
      const { error } = await supabase.from('auction_records').delete().neq('player_id', '0');
      if (error) console.error("Supabase Reset All error:", error);
    }
  };

  const handleExport = () => {
    if (Object.keys(auctionRecords).length === 0) {
      alert("No players sold yet to export!");
      return;
    }

    const data = Object.entries(auctionRecords).map(([id, record]) => {
      const p = players.find(p => p.id.toString() === id);
      return {
        "Player Name": p?.name || 'Unknown',
        "Team": record.team,
        "Sold Price": record.final_price,
        "Rating": p?.rating || 0
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Auction Results");
    XLSX.writeFile(wb, "ipl_auction_results_manual.xlsx");
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-form-card">
        <h2 className="admin-title">Live Auction Control Panel</h2>
        
        <form onSubmit={handleSell} className="admin-form">
          <div className="form-group">
            <label>Search Player to Auction</label>
            <input 
              type="text" 
              placeholder="Type player name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Select Player</label>
            <select 
              value={selectedPlayerId} 
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              required
            >
              <option value="">-- Choose Player --</option>
              {availablePlayers.slice(0, 50).map(p => (
                <option key={p.id} value={p.id}>#{p.id} {p.name} ({p.role}) - Base: {p.basePrice}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Sold To Team</label>
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                required
              >
                <option value="">-- Choose Team --</option>
                {teams.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label>Final Price (in Crores)</label>
              <div className="price-input-wrapper">
                <span className="currency-symbol">₹</span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="e.g. 1.25 for 1.25Cr" 
                  value={finalPrice} 
                  onChange={(e) => setFinalPrice(e.target.value)}
                  required
                />
                <span className="crores-suffix">Cr</span>
              </div>
            </div>
          </div>


          <div className="admin-actions-row">
            <button type="submit" className="submit-btn sell-btn flex-1">Mark as SOLD</button>
            <button 
              type="button" 
              className="submit-btn unsold-btn flex-1" 
              onClick={handleUnsold}
              style={{ backgroundColor: '#4a5568', borderColor: '#4a5568' }}
            >
              Mark as UNSOLD
            </button>
          </div>
        </form>
      </div>

      <div className="admin-history-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="admin-history-card">
          <div className="history-header">
            <h2 className="admin-title">Recent Sales History</h2>
            <button 
              type="button" 
              className="export-btn" 
              onClick={handleExport}
              title="Download Excel matching current state"
            >
              📥 Export
            </button>
          </div>
          <div className="history-list">
            {Object.entries(auctionRecords).filter(([_, r]) => r.team !== 'UNSOLD').length === 0 ? (
              <p className="empty-state">No players sold yet.</p>
            ) : (
              [...Object.entries(auctionRecords)].filter(([_, r]) => r.team !== 'UNSOLD').reverse().map(([id, record]) => {
                const p = players.find(p => p.id.toString() === id);
                if (!p) return null;
                return (
                  <div key={id} className="history-item">
                    <div className="history-info">
                      <strong>{p.name}</strong> 
                      <span className="history-team badge" style={{backgroundColor: `var(--${record.team.toLowerCase()})`}}>{record.team}</span>
                    </div>
                    <div className="history-actions">
                      <span className="history-price">{record.final_price}</span>
                      <button type="button" onClick={() => handleResetPlayer(id)} className="undo-btn">Undo</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="admin-history-card unsold-history-card">
          <div className="history-header">
            <h2 className="admin-title">Unsold Players History</h2>
          </div>
          <div className="history-list">
            {Object.entries(auctionRecords).filter(([_, r]) => r.team === 'UNSOLD').length === 0 ? (
              <p className="empty-state">No unsold players yet.</p>
            ) : (
              [...Object.entries(auctionRecords)].filter(([_, r]) => r.team === 'UNSOLD').reverse().map(([id, record]) => {
                const p = players.find(p => p.id.toString() === id);
                if (!p) return null;
                return (
                  <div key={id} className="history-item unsold-item">
                    <div className="history-info">
                      <strong>{p.name}</strong> 
                      <span className="history-team badge" style={{backgroundColor: '#4a5568'}}>UNSOLD</span>
                    </div>
                    <div className="history-actions">
                      <button type="button" onClick={() => handleResetPlayer(id)} className="undo-btn">Undo</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          type="button" 
          className="reset-all-btn" 
          onClick={handleResetAll}
        >
          ⚠️ Reset All Players to Unsold/Available
        </button>
      </div>
    </div>
  );
}
