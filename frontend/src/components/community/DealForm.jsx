// frontend/src/components/community/DealForm.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,198,255,0.12)',
  borderRadius: '8px',
  color: '#F4F7FA',
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: '14px',
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function DealForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    address: '', arv: '', askPrice: '', beds: '', baths: '', sqft: '', description: '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address.trim()) return;
    onSubmit({
      address: form.address.trim(),
      arv: form.arv ? Number(form.arv) : null,
      askPrice: form.askPrice ? Number(form.askPrice) : null,
      beds: form.beds ? Number(form.beds) : null,
      baths: form.baths ? Number(form.baths) : null,
      sqft: form.sqft ? Number(form.sqft) : null,
      description: form.description.trim() || null,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        className="relative z-10 rounded-2xl p-6 w-full mx-4"
        style={{
          maxWidth: '440px',
          background: 'rgba(11,15,20,0.97)',
          border: '1px solid rgba(0,198,255,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <h2
          className="text-lg font-bold mb-4"
          style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
        >
          🏠 Share a Deal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            style={inputStyle}
            placeholder="Property address *"
            value={form.address}
            onChange={set('address')}
            required
          />

          <div className="grid grid-cols-3 gap-2">
            <input style={inputStyle} placeholder="ARV $" type="number" min="0" value={form.arv} onChange={set('arv')} />
            <input style={inputStyle} placeholder="Ask $" type="number" min="0" value={form.askPrice} onChange={set('askPrice')} />
            <input style={inputStyle} placeholder="Sqft" type="number" min="0" value={form.sqft} onChange={set('sqft')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input style={inputStyle} placeholder="Beds" type="number" min="0" value={form.beds} onChange={set('beds')} />
            <input style={inputStyle} placeholder="Baths" type="number" min="0" step="0.5" value={form.baths} onChange={set('baths')} />
          </div>

          <textarea
            style={{ ...inputStyle, resize: 'none', minHeight: '72px' }}
            placeholder="Notes / description (optional)"
            value={form.description}
            onChange={set('description')}
          />

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm transition-colors duration-150"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#8A9AAA',
                fontFamily: 'var(--font-body, sans-serif)',
                background: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
                fontFamily: 'var(--font-heading, sans-serif)',
              }}
            >
              Post Deal
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
