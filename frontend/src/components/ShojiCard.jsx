import WoodPanel from './WoodPanel';

export default function ShojiCard({ children, className = '', hover = false, onClick, glow = false, ...props }) {
  return (
    <WoodPanel
      className={className}
      hover={hover}
      onClick={onClick}
      glow={glow}
      withBrackets={true}
      {...props}
    >
      {children}
    </WoodPanel>
  );
}
