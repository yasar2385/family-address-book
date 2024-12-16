"use client"
const filters = ['All', 'Location', 'Relation', 'Recent'];

export default function Filter() {
  const handleFilterChange = (filter) => {
    console.log('Filter selected:', filter);
    // Add filter functionality here
  };

  return (
    <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => handleFilterChange(filter)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
