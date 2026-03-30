export const PageContent = ({ children }) => (
  <main
    className="flex-1 overflow-y-auto scrollbar-thin"
    style={{ background: 'transparent', minWidth: 0 }}
  >
    {/* On mobile, add top padding to clear the hamburger button */}
    <div className="p-4 pt-16 md:p-6 max-w-7xl mx-auto">{children}</div>
  </main>
);

const DashboardLayout = ({ children }) => (
  <div
    className="flex h-screen overflow-hidden"
    style={{ background: 'var(--bg-base)', position: 'relative' }}
  >
    {/* Ambient background gradients */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: [
        'radial-gradient(ellipse 50% 40% at 10% 15%, rgba(255,107,53,0.06) 0%, transparent 55%)',
        'radial-gradient(ellipse 45% 35% at 88% 82%, rgba(0,217,192,0.06) 0%, transparent 55%)',
        'radial-gradient(ellipse 30% 25% at 65% 40%, rgba(244,63,94,0.04) 0%, transparent 50%)',
      ].join(','),
    }} />
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%' }}>
      {children}
    </div>
  </div>
);

export default DashboardLayout;
