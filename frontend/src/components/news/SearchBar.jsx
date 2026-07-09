import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search articles, updates...' }) {
  return (
    <div style={styles.searchBox}>
      <svg style={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.searchInput}
      />
      {value && (
        <button onClick={() => onChange('')} style={styles.clearBtn}>
          &times;
        </button>
      )}
    </div>
  );
}

const styles = {
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '0.6rem 1rem 0.6rem 2.5rem',
    width: '100%',
    maxWidth: '450px',
    transition: 'var(--transition-smooth)',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.9rem',
    width: '100%',
  },
  clearBtn: {
    fontSize: '1.25rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0 4px',
    background: 'none',
    border: 'none',
  }
};
