import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Header({ activeTab, setActiveTab, isAdmin, setIsAdmin, userTeam, setUserTeam, setIsAuthenticated, setShowLogin, refreshData, syncStatus, lastSynced }) {
  const handleLogout = async () => {
    // 1. Clear from Supabase DB session store if team login
    const savedSession = localStorage.getItem('ipl_auction_session');
    if (savedSession) {
      try {
        const { code, is_admin, session_id } = JSON.parse(savedSession);
        if (!is_admin && code) {
          await supabase
            .from('active_franchise_sessions')
            .delete()
            .eq('franchise_id', code)
            .eq('session_id', session_id);
        }
      } catch (e) {
        console.error("Logout DB cleanup failed:", e);
      }
    }

    // 2. Clear local state
    localStorage.removeItem('ipl_auction_session');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserTeam(null);
    setShowLogin(true);
    setActiveTab('catalog');
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      setActiveTab('admin');
    } else {
      alert("Admin access required. Please log in with an admin code.");
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="title-section">
          <h1 className="app-title">IPL 2026</h1>
          <div className="app-subtitle">College Auction Portal</div>
        </div>
        
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Player Catalog
          </button>
          {userTeam && (
            <button 
              className={`nav-tab ${activeTab === 'myteam' ? 'active' : ''}`}
              onClick={() => setActiveTab('myteam')}
            >
              My Team
            </button>
          )}
          {isAdmin && (
            <button 
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={handleAdminClick}
            >
              Auction Admin
            </button>
          )}
          <button 
            className={`nav-tab ${activeTab === 'anonymous' ? 'active' : ''}`}
            onClick={() => setActiveTab('anonymous')}
          >
            Anonymous Auction
          </button>
          <button 
            className={`nav-tab ${activeTab === 'bags' ? 'active' : ''}`}
            onClick={() => setActiveTab('bags')}
          >
            Player Bags
          </button>
          <button 
            className={`nav-tab ${activeTab === 'rosters' ? 'active' : ''}`}
            onClick={() => setActiveTab('rosters')}
          >
            Team Rosters
          </button>
        </div>
      </div>

      <div className="header-right" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
        <div className="status-container" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px'}}>
          <div className="sync-status" title={`Real-time Sync: ${syncStatus}`} style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            fontSize: '0.7rem',
            color: syncStatus === 'connected' ? '#48bb78' : '#e53e3e',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px 8px',
            borderRadius: '20px',
            border: `1px solid ${syncStatus === 'connected' ? '#48bb78' : '#e53e3e'}`
          }}>
            <span style={{
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: syncStatus === 'connected' ? '#48bb78' : '#e53e3e',
              display: 'inline-block',
              boxShadow: syncStatus === 'connected' ? '0 0 5px #48bb78' : 'none'
            }}></span>
            {syncStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
          </div>
          {lastSynced && (
            <div className="last-synced" style={{fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)'}}>
              Last Synced: {formatTime(lastSynced)}
            </div>
          )}
        </div>
        <button 
          className="nav-tab sync-btn" 
          onClick={refreshData} 
          style={{backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--neon-blue)', color: 'var(--neon-blue)', padding: '4px 12px'}}
          title="Force refresh auction data"
        >
          🔄 Sync Now
        </button>
        {userTeam && <div className="user-badge team" style={{backgroundColor: `var(--${userTeam.toLowerCase()})`, padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>{userTeam}</div>}
        {isAdmin && <div className="user-badge admin" style={{backgroundColor: '#e53e3e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>ADMIN</div>}
        <button className="nav-tab logout-btn" onClick={handleLogout} style={{color: '#ff4d4d'}}>Logout</button>
      </div>

      <div className="rules-tracker">
        <div className="rules-title">Mandatory Squad Rules</div>
        <div className="rules-list">
          <div className="rule-item">
            <span className="rule-icon">🛡️</span>
            Min 1 Wicket-Keeper
          </div>
          <div className="rule-item">
            <span className="rule-icon">🎯</span>
            Min 3 Bowlers
          </div>
          <div className="rule-item">
            <span className="rule-icon">✈️</span>
            Exactly 4 Overseas
          </div>
        </div>
      </div>
    </header>
  );
}
