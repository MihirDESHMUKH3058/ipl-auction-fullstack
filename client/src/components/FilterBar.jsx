import React from 'react';
import './FilterBar.css';

export default function FilterBar({ filters, setFilters }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={`filter-sidebar-container ${isOpen ? 'is-open' : ''}`}>
      <div className="filter-header-mobile" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="filter-title">Filters</h3>
        <span className="filter-toggle-icon">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      
      <div className="filter-content">
        <div className="filter-group search-group">
          <label>Search Player</label>
          <div className="search-input-wrapper">
            <input 
              type="text" 
              name="search" 
              placeholder="Enter name..." 
              value={filters.search || ''} 
              onChange={handleChange}
              autoComplete="off"
            />
            {filters.search && (
              <button 
                className="clear-search" 
                onClick={() => setFilters({...filters, search: ''})}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>Role</label>
          <select name="role" value={filters.role} onChange={handleChange}>
            <option value="All">All Roles</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Wicket-Keeper">Wicket-Keeper</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Origin</label>
          <select name="origin" value={filters.origin} onChange={handleChange}>
            <option value="All">All Origins</option>
            <option value="Indian">Indian</option>
            <option value="Overseas">Overseas</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Rating</label>
          <select name="rating" value={filters.rating} onChange={handleChange}>
            <option value="All">All Ratings</option>
            <option value="10">10 Stars</option>
            <option value="9">9+ Stars</option>
            <option value="8">8+ Stars</option>
            <option value="7">7+ Stars</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Max Base Price</label>
          <select name="price" value={filters.price} onChange={handleChange}>
            <option value="All">Any Price</option>
            <option value="50">₹ 50L & Below</option>
            <option value="100">₹ 1Cr & Below</option>
            <option value="150">₹ 1.5Cr & Below</option>
            <option value="200">₹ 2Cr & Below</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Availability</label>
          <select name="availability" value={filters.availability || 'All'} onChange={handleChange}>
            <option value="All">All Players</option>
            <option value="Available">Available Only</option>
            <option value="Sold">Sold Only</option>
            <option value="Unsold">Unsold Only</option>
          </select>
        </div>

        <button className="reset-btn" onClick={() => setFilters({ role: 'All', origin: 'All', rating: 'All', price: 'All', availability: 'All', search: '' })}>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
