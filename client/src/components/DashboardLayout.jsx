/**
 * DashboardLayout — the main application shell.
 * Two-column grid on desktop (sidebar | main). 
 * Mobile: full-width main with floating sidebar drawer.
 */

export const PageContent = ({ children }) => (
  <main className="flex-1 overflow-y-auto min-w-0">
    {/* pt-16 on mobile clears the hamburger button */}
    <div className="p-5 pt-16 md:p-8 max-w-7xl mx-auto">
      {children}
    </div>
  </main>
);

const DashboardLayout = ({ children }) => (
  <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
    {children}
  </div>
);

export default DashboardLayout;
