import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import './AnonymousAuction.css';

export default function AnonymousAuction({ players, auctionRecords, setAuctionRecords, isAdmin, userTeam }) {
  const teams = ['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'RR', 'PBKS', 'LSG', 'GT'];
  
  // Removed local userTeam state, using prop from App.jsx

  // State from Supabase
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [bidsRevealed, setBidsRevealed] = useState(false);
  const [endTime, setEndTime] = useState(null); // Date object
  const [dbBids, setDbBids] = useState([]); 
  const [myBid, setMyBid] = useState('');

  // Local Timer State
  const [timeLeft, setTimeLeft] = useState(0);

  const anonymousPlayers = useMemo(() => {
    return players.filter(p => p.isAnonymous === true);
  }, [players]);

  const userRemainingPurse = useMemo(() => {
    if (!userTeam) return 0;
    const totalPurseLakhs = 12000; // 120 Cr
    let totalSpentLakhs = 0;
    Object.keys(auctionRecords).forEach(id => {
      if (auctionRecords[id].team === userTeam) {
        const numStr = auctionRecords[id].final_price.replace(/[^0-9]/g, '');
        totalSpentLakhs += (parseInt(numStr, 10) / 100000);
      }
    });
    return totalPurseLakhs - totalSpentLakhs;
  }, [userTeam, auctionRecords]);

  const activePlayer = useMemo(() => {
    return players.find(p => p.id.toString() === activePlayerId);
  }, [players, activePlayerId]);

  // 1. Initial Fetch and Subscriptions
  useEffect(() => {
    const setupSubscriptions = async () => {
      // Fetch initial settings
      const { data: settings } = await supabase
        .from('anonymous_auction_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (settings) {
        const sid = settings.active_player_id ? settings.active_player_id.toString() : null;
        if (sid !== activePlayerId) setActivePlayerId(sid);
        setBidsRevealed(settings.bids_revealed);
        setEndTime(settings.end_time ? new Date(settings.end_time) : null);
      }

      // Subscribe to settings changes
      const settingsChannel = supabase.channel('settings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'anonymous_auction_settings' }, payload => {
          console.log('Realtime settings change:', payload.eventType, payload.new);
          if (payload.new) {
            const newId = payload.new.active_player_id ? payload.new.active_player_id.toString() : null;
            if (newId !== activePlayerId) setActivePlayerId(newId);
            setBidsRevealed(payload.new.bids_revealed);
            setEndTime(payload.new.end_time ? new Date(payload.new.end_time) : null);
          }
        })
        .subscribe(status => {
          console.log('Supabase Settings Subscription Status:', status);
        });

      // Subscribe to bids changes
      const bidsChannel = supabase.channel('bids_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'anonymous_bids' }, payload => {
          console.log('Realtime bids change:', payload.eventType, payload);
          fetchBids(activePlayerId);
        })
        .subscribe(status => {
          console.log('Supabase Bids Subscription Status:', status);
        });

      return () => {
        supabase.removeChannel(settingsChannel);
        supabase.removeChannel(bidsChannel);
      };
    };

    setupSubscriptions();
  }, [activePlayerId]);

  // Timer Ticking Logic
  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;
      const seconds = Math.max(0, Math.floor(distance / 1000));
      setTimeLeft(seconds);
      
      if (seconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Fetch bids for the active player
  const fetchBids = async (pid) => {
    if (!pid) {
      setDbBids([]);
      return;
    }
    const { data } = await supabase
      .from('anonymous_bids')
      .select('*')
      .eq('player_id', pid);
    
    if (data) setDbBids(data);
  };

  useEffect(() => {
    fetchBids(activePlayerId);
  }, [activePlayerId]);

  useEffect(() => {
    if (userTeam) {
      const existing = dbBids.find(b => b.team_name === userTeam);
      if (existing) {
        setMyBid((existing.amount / 100).toString());
      }
    }
  }, [dbBids, userTeam]);

  // Admin Actions
  const handleSelectPlayer = async (pid) => {
    const stringId = pid.toString();
    await supabase.from('anonymous_auction_settings').upsert({ 
      id: 1, 
      active_player_id: stringId, 
      bids_revealed: false,
      end_time: null 
    });
    await supabase.from('anonymous_bids').delete().eq('player_id', stringId);
    setActivePlayerId(stringId);
    setBidsRevealed(false);
    setEndTime(null);
  };

  const handleStartTimer = async () => {
    const threeMinutesFuture = new Date(new Date().getTime() + 3 * 60 * 1000);
    await supabase.from('anonymous_auction_settings').update({ 
      end_time: threeMinutesFuture.toISOString(),
      bids_revealed: false 
    }).eq('id', 1);
    setEndTime(threeMinutesFuture);
  };

  const handleToggleReveal = async () => {
    await supabase.from('anonymous_auction_settings').update({ bids_revealed: !bidsRevealed }).eq('id', 1);
  };

  const handleConfirmWinner = async (winningTeam, amount) => {
    if (!activePlayer) return;
    const priceString = `₹${amount},00,000`;
    const finalPriceLakhs = Math.round(amount);
    const PURSE_LIMIT_LAKHS = 12000; // 120 Cr

    // Calculate current spending for the selected team
    let currentSpentLakhs = 0;
    Object.values(auctionRecords).forEach(record => {
      if (record.team === winningTeam) {
        const numStr = record.final_price.replace(/[^0-9]/g, '');
        currentSpentLakhs += (parseInt(numStr, 10) / 100000);
      }
    });

    if (currentSpentLakhs + finalPriceLakhs > PURSE_LIMIT_LAKHS) {
      alert(`❌ Purse limit reached! You cannot buy any more players. (₹120 Cr exhausted)`);
      return;
    }
    
    console.log(`Confirming win: Player ${activePlayer.id} to ${winningTeam} for ${priceString}`);

    const { error } = await supabase.from('auction_records').upsert({
      player_id: activePlayer.id.toString(),
      team: winningTeam,
      final_price: priceString
    });

    if (error) {
      console.error("Error confirming winner in Supabase:", error);
      alert("Failed to confirm winner in database! Check console.");
      return;
    }

    await supabase.from('anonymous_auction_settings').update({ active_player_id: null, bids_revealed: false, end_time: null }).eq('id', 1);
    await supabase.from('anonymous_bids').delete().eq('player_id', activePlayer.id);
    
    // The real-time subscription in App.jsx will handle the local state update
  };

  const handleSubmitBid = async () => {
    if (!activePlayer || !userTeam || !myBid || timeLeft <= 0) return;
    const amountCr = parseFloat(myBid);
    if (isNaN(amountCr)) return;
    const amountLakhs = Math.round(amountCr * 100);

    if (amountLakhs > userRemainingPurse) {
      alert(`❌ Purse limit reached! You cannot buy any more players. (₹120 Cr exhausted)`);
      return;
    }

    const { error } = await supabase.from('anonymous_bids').insert({
      player_id: activePlayer.id,
      team_name: userTeam,
      amount: amountLakhs
    });

    if (error) {
      if (error.code === '23505') { // Postgres unique violation error code
        alert("Bid already submitted. You cannot modify it.");
      } else {
        alert("Error submitting bid: " + error.message);
      }
      return;
    }

    alert("Bid Submitted Successfully!");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine if identity should be hidden
  const isMystery = activePlayer && !bidsRevealed && timeLeft > 0;

  if (!isAdmin && !userTeam) {
    return (
      <div className="team-picker-container">
        <h1>Select Your Team</h1>
        <div className="team-grid">
          {teams.map(t => (
            <div key={t} className="team-card" onClick={() => handleSetTeam(t)}>
               <div className="team-badge" style={{ backgroundColor: `var(--${t.toLowerCase()})` }}></div>
               <h3>{t}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const winner = bidsRevealed ? dbBids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current, {team_name: 'None', amount: 0}) : null;

  return (
    <div className="anonymous-auction-container">
      <div className="anonymous-header">
        <h1 className="anonymous-title">Secret Bidding Arena</h1>
        <div style={{display:'flex', justifyContent:'center', gap:'1rem', alignItems:'center'}}>
          <p className="anonymous-subtitle">Strategic Mystery Auction</p>
          {userTeam && !isAdmin && (
            <div className="current-team-info">
              <span><strong>{userTeam}</strong></span>
              <span className="purse-info" style={{marginLeft: '1rem', color: '#68d391'}}>
                Purse: {userRemainingPurse >= 100 ? (userRemainingPurse / 100).toFixed(2) + ' Cr' : userRemainingPurse + ' L'}
              </span>
              <button className="change-team-btn" onClick={() => setUserTeam(null)}>Change</button>
            </div>
          )}
          {timeLeft > 0 && <div className="timer-badge">⏳ {formatTime(timeLeft)}</div>}
        </div>
      </div>

      <div className="auction-layout">
        <div className="player-selection-card">
          {isAdmin ? (
            <>
              <h3>Admin: Select Player</h3>
              <div className="player-list-scroll">
                <div className="player-list">
                  {anonymousPlayers.map(p => {
                    const isSold = !!auctionRecords[p.id];
                    return (
                      <div 
                        key={p.id} 
                        className={`player-item ${activePlayerId === p.id.toString() ? 'active' : ''} ${isSold ? 'sold' : ''}`}
                        onClick={() => !isSold && handleSelectPlayer(p.id)}
                      >
                        <img src={`${import.meta.env.BASE_URL}players/${p.image_file}`} alt={p.name} className="player-thumb" />
                        <div className="player-info">
                          <h4>{p.name}</h4>
                          <p>{p.role} • {p.basePrice}</p>
                        </div>
                        {isSold && <span className="sold-tag">SOLD</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Bidding Progress</h3>
              <div className="bid-status-grid">
                {teams.map(t => {
                  const hasBid = dbBids.some(b => b.team_name === t);
                  return (
                    <div key={t} className={`status-item ${hasBid ? 'has-bid' : ''}`}>
                      <span className="status-icon">{hasBid ? '✅' : '⏳'}</span>
                      <span className="status-team">{t}</span>
                    </div>
                  );
                })}
              </div>
              <p className="waiting-msg">{timeLeft > 0 ? "Bidding is OPEN! Submit your bid." : "Bidding is CLOSED. Waiting for Admin reveal."}</p>
            </>
          )}
        </div>

        <div className="bidding-console">
          {activePlayer ? (
            <>
              <div className="player-header-mini">
                <img 
                  src={isMystery ? `${import.meta.env.BASE_URL}mystery_player_placeholder.png` : `${import.meta.env.BASE_URL}players/${activePlayer.image_file}`} 
                  alt={isMystery ? "Mystery Player" : activePlayer.name} 
                  className={`mini-img ${isMystery ? 'mystery-blur' : ''}`} 
                />
                <div>
                  <h2 style={{margin:0}}>{isMystery ? "??? Mystery Marquee Player ???" : activePlayer.name}</h2>
                  <p style={{color: '#a0aec0', margin: '0.5rem 0'}}>{isMystery ? "Role: Hidden" : `${activePlayer.role} • ${activePlayer.nationality}`}</p>
                  <div className="base-price-badge">Base Price: {activePlayer.basePrice}</div>
                </div>
              </div>

              {isAdmin && (
                <div className="admin-only-info">
                  <h4>Admin Controls</h4>
                  {timeLeft <= 0 && !bidsRevealed && (
                    <button className="action-btn start-timer-btn" onClick={handleStartTimer}>Start 3-Minute Timer</button>
                  )}
                  
                  <table style={{width: '100%', marginTop: '1rem', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                        <th style={{padding: '0.5rem'}}>Team</th>
                        <th style={{padding: '0.5rem'}}>Bid Amount</th>
                        <th style={{padding: '0.5rem'}}>Submission Time</th>
                        <th style={{padding: '0.5rem'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbBids.map(b => (
                        <tr key={b.team_name}>
                          <td style={{padding: '0.5rem'}}>{b.team_name}</td>
                          <td style={{padding: '0.5rem'}}>₹{b.amount >= 100 ? (b.amount / 100).toFixed(2) + ' Cr' : b.amount + ' L'}</td>
                          <td style={{padding: '0.5rem', fontSize: '0.85rem', color: '#a0aec0'}}>
                            {(() => {
                              if (!b.created_at || !endTime) return "N/A";
                              const startMs = endTime.getTime() - (3 * 60 * 1000);
                              const bidMs = new Date(b.created_at).getTime();
                              let relSecs = Math.floor((bidMs - startMs) / 1000);
                              if (relSecs < 0) relSecs = 0;
                              if (relSecs > 180) relSecs = 180;
                              const m = Math.floor(relSecs / 60);
                              const s = relSecs % 60;
                              const relStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                              const absStr = new Date(b.created_at).toISOString();
                              return (
                                <div>
                                  <div style={{color: '#e2e8f0'}}>{relStr} / 03:00</div>
                                  <div style={{fontSize: '0.75rem'}}>{absStr}</div>
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{padding: '0.5rem'}}>
                            {bidsRevealed && (
                              <button className="sell-btn-anon" style={{padding: '4px 12px', fontSize: '0.8rem'}} onClick={() => handleConfirmWinner(b.team_name, b.amount)}>Confirm Win</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="action-btn reveal-btn" style={{marginTop: '1rem'}} onClick={handleToggleReveal}>
                    {bidsRevealed ? "Hide Identity" : "Reveal Identity & Bids"}
                  </button>
                </div>
              )}

              {!isAdmin && (
                <div className="bid-controls-card">
                  {bidsRevealed ? (
                    <div className="winner-announce">
                      <h3>🏆 RESULTS REVEALED</h3>
                      <div style={{marginTop: '1.5rem'}}>
                        {dbBids.sort((a,b) => b.amount - a.amount).map(b => (
                          <div key={b.team_name} style={{display:'flex', justifyContent:'space-between', padding:'0.5rem', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                            <span>{b.team_name} {b.team_name === winner.team_name ? '🏆' : ''}</span>
                            <strong>₹{b.amount} Lakhs</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (() => {
                    const submittedBid = userTeam ? dbBids.find(b => b.team_name === userTeam) : null;
                    if (submittedBid) {
                      const submitTime = submittedBid.created_at ? new Date(submittedBid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unknown Time';
                      return (
                        <div className="bid-submitted-banner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <h3 style={{ color: '#48bb78', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Bid Locked In
                          </h3>
                          <div className="locked-bid-amount" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                            <span className="currency" style={{ fontSize: '1.5rem', color: '#63b3ed', marginRight: '0.2rem' }}>₹</span>
                            {(submittedBid.amount / 100).toString()}
                            <span className="lakhs-suffix" style={{ fontSize: '1.2rem', marginLeft: '0.5rem', color: '#a0aec0' }}>Cr</span>
                          </div>
                          <div style={{ background: 'rgba(49, 151, 149, 0.1)', border: '1px solid rgba(49, 151, 149, 0.2)', padding: '0.8rem 1.2rem', borderRadius: '8px', width: '100%' }}>
                            <p className="timestamp-info" style={{ textAlign: 'center', margin: 0, color: '#81e6d9', fontSize: '0.95rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                Submitted directly to server at: <strong>{submitTime}</strong>
                              </span>
                            </p>
                            <p style={{ textAlign: 'center', margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#a0aec0' }}>
                              Bids are final and non-editable to ensure a fair auction process.
                            </p>
                          </div>
                          {timeLeft <= 0 && (
                            <div className="time-up-msg" style={{ marginTop: '1.5rem', width: '100%' }}>
                              <h3>⌛ TIME IS UP</h3>
                              <p>Bidding has closed for this player. Waiting for Admin reveal.</p>
                            </div>
                          )}
                        </div>
                      );
                    } else if (timeLeft > 0) {
                      return (
                        <>
                          <h3>Enter Your Bid (Confidential)</h3>
                          <div className="bid-input-wrapper large-bid-input">
                            <span className="currency" style={{fontSize: '1.5rem'}}>₹</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Price in Crore (e.g. 12.8)"
                              value={myBid}
                              onChange={(e) => setMyBid(e.target.value)}
                            />
                            <span className="lakhs-suffix" style={{fontSize: '1.2rem', marginLeft: '0.5rem', color: '#a0aec0'}}>Cr</span>
                          </div>
                          <button className="action-btn submit-bid-btn" onClick={handleSubmitBid}>Submit Bid</button>
                        </>
                      );
                    } else {
                      return (
                        <div className="time-up-msg">
                          <h3>⌛ TIME IS UP</h3>
                          <p>Bidding has closed for this player. Waiting for Admin reveal.</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>{isAdmin ? "Select a player to start" : "Waiting for next mystery player..."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
