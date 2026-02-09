// src/app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Filter from './components/Filter';
import AddFamilyModal from './components/AddFamilyModal';
import LinkFamilyModal from './components/LinkFamilyModal';
import { Users, Baby, Heart, Skull, Calendar, Clock } from "lucide-react";

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalMembers: 0,
        recentMembers: [],
        upcomingMarriages: [],
        newBorns: [],
        deaths: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const membersSnapshot = await getDocs(collection(db, "familyMembers"));
                const members = membersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Calculate Statistics
                const totalMembers = members.length;

                // Recent Updates (sort by createdAt if available, else take last added)
                // Assuming createdAt is ISO string
                const sortedByDate = [...members].sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                });
                const recentMembers = sortedByDate.slice(0, 5);

                // Upcoming Marriages (Next 30 days)
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setDate(today.getDate() + 30);

                const upcomingMarriages = members.filter(m => {
                    if (!m.dateOfMarriage) return false;
                    const dom = new Date(m.dateOfMarriage);
                    // Set year to current year for comparison
                    const domThisYear = new Date(today.getFullYear(), dom.getMonth(), dom.getDate());
                    // Handle year wrap-around if needed, but simple check for now
                    return domThisYear >= today && domThisYear <= nextMonth;
                });

                // News: New Borns (Last 1 year)
                const oneYearAgo = new Date(today);
                oneYearAgo.setFullYear(today.getFullYear() - 1);

                const newBorns = members.filter(m => {
                    if (!m.dateOfBirth) return false;
                    const dob = new Date(m.dateOfBirth);
                    return dob >= oneYearAgo;
                });

                // News: Deaths (Last 1 year)
                const deaths = members.filter(m => {
                    if (m.isAlive !== false || !m.dateOfDeath) return false;
                    const dod = new Date(m.dateOfDeath);
                    return dod >= oneYearAgo;
                });

                setStats({
                    totalMembers,
                    recentMembers,
                    upcomingMarriages,
                    newBorns,
                    deaths
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 flex-col sm:flex-row overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                Dashboard
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Welcome to your family address book
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <AddFamilyModal />
                            <LinkFamilyModal />
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <SearchBar />
                        </div>
                        <Filter />
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Members"
                            value={stats.totalMembers}
                            icon={Users}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="New Borns (Year)"
                            value={stats.newBorns.length}
                            icon={Baby}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="Upcoming Marriages"
                            value={stats.upcomingMarriages.length}
                            icon={Heart}
                            color="bg-pink-500"
                        />
                        <StatCard
                            title="Departed (Year)"
                            value={stats.deaths.length}
                            icon={Skull}
                            color="bg-gray-500"
                        />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Recent Updates */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Recent Updates
                            </h3>
                            <div className="space-y-4">
                                {stats.recentMembers.length > 0 ? (
                                    stats.recentMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{member.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {member.city || member.district || "Location N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "N/A"}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No recent updates</p>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events & News */}
                        <div className="space-y-8">
                            {/* Upcoming Marriages */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-pink-500" />
                                    Upcoming Anniversaries
                                </h3>
                                <div className="space-y-3">
                                    {stats.upcomingMarriages.length > 0 ? (
                                        stats.upcomingMarriages.map(member => (
                                            <div key={member.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-100">
                                                <div>
                                                    <p className="font-medium text-gray-800">{member.name} & {member.spouseName}</p>
                                                    <p className="text-xs text-pink-600">
                                                        {new Date(member.dateOfMarriage).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No upcoming anniversaries in next 30 days</p>
                                    )}
                                </div>
                            </div>

                            {/* News (Births/Deaths) */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-500" />
                                    Family News
                                </h3>
                                <div className="space-y-3">
                                    {stats.newBorns.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                            <Baby className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="font-medium text-gray-800">New Baby: {member.name}</p>
                                                <p className="text-xs text-green-600">
                                                    Born on {new Date(member.dateOfBirth).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.deaths.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <Skull className="w-5 h-5 text-gray-600" />
                                            <div>
                                                <p className="font-medium text-gray-800">In Loving Memory: {member.name}</p>
                                                <p className="text-xs text-gray-600">
                                                    Departed on {new Date(member.dateOfDeath).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.newBorns.length === 0 && stats.deaths.length === 0 && (
                                        <p className="text-gray-500 text-sm">No recent news</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
