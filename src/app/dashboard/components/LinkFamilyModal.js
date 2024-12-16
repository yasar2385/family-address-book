"use client"
import { useState } from 'react';
import styles from '../styles.module.css';

export default function LinkFamilyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ member1: '', member2: '', relation: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Linking family members:', formData);
    setIsOpen(false);
    // Implement link functionality here
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Link Family Members</button>
      {isOpen && (
        <div className={styles.modal}>
          <form onSubmit={handleSubmit}>
            <h3>Link Family Members</h3>
            <input
              type="text"
              placeholder="Member 1"
              value={formData.member1}
              onChange={(e) => setFormData({ ...formData, member1: e.target.value })}
            />
            <input
              type="text"
              placeholder="Member 2"
              value={formData.member2}
              onChange={(e) => setFormData({ ...formData, member2: e.target.value })}
            />
            <input
              type="text"
              placeholder="Relation"
              value={formData.relation}
              onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
            />
            <button type="submit">Link</button>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
          </form>
        </div>
      )}
    </>
  );
}
