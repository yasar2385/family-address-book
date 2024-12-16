"use client"

import { useState } from 'react';

export default function SearchBar() {
    const [query, setQuery] = useState('');
  
    const handleSearch = () => {
      console.log('Searching for:', query);
      // Add search functionality here
    };
  
    return (
      <div className="flex items-center bg-white rounded-lg shadow p-2 w-full">
        <input
          type="text"
          className="flex-1 p-2 rounded-l-lg border border-gray-300 focus:outline-none"
          value={query}
          placeholder="Search family..."
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
        >
          Search
        </button>
      </div>
    );
  }
  