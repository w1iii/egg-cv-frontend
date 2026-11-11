import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/inspect', label: 'Inspect Eggs', icon: 'egg', end: false },
  { to: '/history', label: 'Batch History', icon: 'history', end: false },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-space-sm bg-white/85 backdrop-blur-2xl border border-white/80 rounded-2xl px-space-md py-space-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <NavLink to="/" className="flex items-center gap-space-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0050cb] to-[#0066ff] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(0,102,255,0.28)]">
          <span className="material-symbols-outlined text-[24px] is-filled">
            egg
          </span>
        </div>
        <span className="font-headline-lg text-headline-lg text-[#181c1f] tracking-tight font-bold leading-none">
          Egg-CV
        </span>
      </NavLink>

      <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-40 flex justify-around gap-1 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-xl sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `inline-flex flex-col items-center gap-1 rounded-xl px-3 py-2 font-body-sm text-[11px] transition-colors ${link.to === '/inspect' ? 'hidden sm:inline-flex' : ''} sm:flex-row sm:rounded-full sm:text-body-sm ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#424656] hover:bg-blue-50 hover:text-[#0050cb]'
              }`
            }
          >
                <span className="material-symbols-outlined text-[20px] sm:text-[18px]">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
