import WoodPanel from './WoodPanel';

export default function GlassCard({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <WoodPanel
      className={className}
      hover={hover}
      onClick={onClick}
      withBrackets={true}
      {...props}
    >
      {children}
    </WoodPanel>
  );
}
