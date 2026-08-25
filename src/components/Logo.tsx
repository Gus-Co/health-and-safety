interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const heights = { sm: 'h-9', md: 'h-12', lg: 'h-16' };

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center justify-center bg-slate-900 rounded-xl shrink-0"
        style={{ width: '2.25rem', height: '2.25rem' }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <div className="leading-none">
        <span className={`font-bold text-slate-900 tracking-tight ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'}`}>
          Cert Verify
        </span>
      </div>
    </div>
  );
}
