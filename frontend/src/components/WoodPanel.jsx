import { motion } from 'framer-motion';

export default function WoodPanel({
  children, className = '', hover = false, onClick, glow = false,
  variant = 'default', withBrackets = true, withRope = false, headerBar,
  ...rest
}) {
  const variantClasses = {
    default: 'wood-panel',
    elevated: 'wood-panel-light',
    parchment: 'parchment-texture',
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-sm border border-gold-dim/20 elevation-1 ${variantClasses[variant]} ${glow ? 'shadow-[0_0_20px_rgba(212,168,83,0.15)]' : ''} ${className}`}
      whileHover={hover ? { y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(212,168,83,0.15)' } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      onClick={onClick}
      {...rest}
    >
      {withRope && <div className="rope-top" />}
      {headerBar && (
        <div className="lacquer-bar px-4 py-2 font-heading text-gold text-sm tracking-widest uppercase">
          {headerBar}
        </div>
      )}
      {withBrackets && (
        <>
          <div className="metal-bracket top-left" />
          <div className="metal-bracket top-right" />
          <div className="metal-bracket bottom-left" />
          <div className="metal-bracket bottom-right" />
        </>
      )}
      <div className="relative z-10 p-5">
        {children}
      </div>
    </motion.div>
  );
}
