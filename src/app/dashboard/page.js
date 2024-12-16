// src/app/dashboard/page.js

import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Filter from './components/Filter';
import AddFamilyModal from './components/AddFamilyModal';
import LinkFamilyModal from './components/LinkFamilyModal';

export default function Dashboard() {
    return (
        <div className="flex h-screen bg-gray-100 flex-col sm:flex-row">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 p-4 space-y-4">
                {/* Top Section: Search & Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                    <SearchBar />
                    <Filter />
                </div>

                {/* Dashboard Title & Description */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-700">
                        Family Address Book Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500">
                        Manage and explore your family relationships with ease.
                    </p>
                </div>

                {/* Modals Section */}
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                    <AddFamilyModal />
                    <LinkFamilyModal />
                </div>
            </div>
        </div>

    );
}
