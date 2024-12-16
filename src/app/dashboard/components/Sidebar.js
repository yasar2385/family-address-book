"use client"
import { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX } from 'react-icons/fi'; // Icons for toggling
import styles from '../styles.module.css';
const links = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Address Book', href: '/dashboard/address-book' },
  { name: 'Location Map', href: '/dashboard/map' },
  { name: 'Family Tree', href: '/dashboard/treeview' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/dashboard');

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        className="sm:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg p-4 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 sm:translate-x-0 sm:relative sm:block`}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Family Dashboard</h2>
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block p-2 rounded-md ${
                  activeLink === link.href
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveLink(link.href)}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
