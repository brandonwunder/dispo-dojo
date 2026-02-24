// frontend/src/components/community/DealCard.jsx

function DealStat({ label, value, color, borderX }) {
  const formatted = value != null ? `$${Math.round(value / 1000)}K` : '—';
  return (
    <div
      className="flex flex-col items-center py-2"
      style={borderX ? {
        borderLeft: '1px solid rgba(0,198,255,0.08)',
        borderRight: '1px solid rgba(0,198,255,0.08)',
      } : {}}
    >
      <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading, sans-serif)', color }}>
        {formatted}
      </span>
      <span className="text-[10px] text-[#8A9AAA] uppercase tracking-wide" style={{ fontFamily: 'var(--font-heading, sans-serif)' }}>
        {label}
      </span>
    </div>
  );
}

export default function DealCard({ dealData }) {
  const { address, arv, askPrice, beds, baths, sqft, description } = dealData || {};
  const spread = arv != null && askPrice != null ? arv - askPrice : null;

  const propertyDetails = [
    beds && `${beds}bd`,
    baths && `${baths}ba`,
    sqft && `${Number(sqft).toLocaleString()} sqft`,
  ].filter(Boolean).join(' · ');

  return (
    <div
      className="rounded-xl overflow-hidden mt-2 inline-block"
      style={{
        width: '340px',
        background: 'rgba(11,15,20,0.80)',
        border: '1px solid rgba(0,198,255,0.20)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,198,255,0.06)',
      }}
    >
      {/* Thumbnail header */}
      <div
        className="relative overflow-hidden"
        style={{
          height: '120px',
          background: 'linear-gradient(135deg, #0E1820 0%, #111B24 100%)',
        }}
      >
        {/* House emoji placeholder */}
        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-[0.12]">🏠</div>
        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to top, rgba(11,15,20,0.95), transparent)' }}
        />
        {/* Address overlay */}
        <div className="absolute bottom-2 left-3 right-3">
          <div
            className="text-sm font-semibold truncate"
            style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
          >
            {address || 'No address'}
          </div>
          {propertyDetails && (
            <div
              className="text-[11px] mt-0.5"
              style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#8A9AAA' }}
            >
              {propertyDetails}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3"
        style={{ borderBottom: '1px solid rgba(0,198,255,0.08)' }}
      >
        <DealStat label="ARV" value={arv} color="#F6C445" />
        <DealStat label="Ask" value={askPrice} color="#00C6FF" borderX />
        <DealStat label="Spread" value={spread} color="#22C55E" />
      </div>

      {/* Description */}
      {description && (
        <div className="px-3 py-2">
          <p
            className="text-xs line-clamp-2"
            style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#8A9AAA', lineHeight: 1.5 }}
          >
            {description}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3 pt-2">
        <button
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
            fontFamily: 'var(--font-heading, sans-serif)',
            letterSpacing: '0.03em',
          }}
        >
          View Deal →
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150"
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,198,255,0.25)',
            color: '#00C6FF',
            fontFamily: 'var(--font-heading, sans-serif)',
          }}
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}
