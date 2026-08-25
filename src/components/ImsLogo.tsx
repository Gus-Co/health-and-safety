interface ImsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const heights = { sm: 'h-10', md: 'h-14', lg: 'h-20' };

export default function ImsLogo({ className = '', size = 'md' }: ImsLogoProps) {
  return (
    <img
      src="/IMG-20260804-WA00272.svg"
      alt="IMS College SA"
      className={`${heights[size]} w-auto object-contain ${className}`}
    />
  );
}
