import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Egg Detection', icon: 'egg', end: true },
  { to: '/history', label: 'Batch History', icon: 'history', end: false },
];

export function Navbar() {
  return (
    <header className="flex flex-col gap-space-sm bg-white/60 backdrop-blur-2xl border border-white/80 rounded-2xl px-space-md py-space-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
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

      <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-body-sm text-body-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#424656] hover:bg-blue-50 hover:text-[#0050cb]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
