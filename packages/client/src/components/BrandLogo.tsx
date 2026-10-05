export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
}

const SIZE_MAP = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

/**
 * BrandLogo: Concept C ("The Mastery Spark")
 *
 * Integrates:
 * 1. The Ascending Execution Checkmark (Daily momentum & habit check-offs).
 * 2. The Golden Mastery Spark (Cultivated skills & personal mastery).
 * 3. High-contrast Indigo-to-Violet squircle base for dark & light browser environments.
 */
export function BrandLogo({ className = '', size = 'md', showBackground = true }: BrandLogoProps) {
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      aria-label="Self Management Tool Logo"
      role="img"
      className={`shrink-0 ${sizeClasses} ${className}`}
    >
      <defs>
        {/* Background Squircle Gradient (Signature Indigo to Violet) */}
        <linearGradient id="smt-brand-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        {/* Golden Mastery Spark Radiant Gradient */}
        <linearGradient id="smt-brand-spark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Squircle Base (Optional) */}
      {showBackground && (
        <rect
          width="32"
          height="32"
          rx="7.5"
          fill="url(#smt-brand-bg)"
          className="transition-all"
        />
      )}

      {/* The Execution Checkmark */}
      <path
        d="M 7.5 17 L 12.5 22 L 20 14.5"
        fill="none"
        stroke={showBackground ? '#ffffff' : '#4f46e5'}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The Mastery Spark */}
      <path
        d="M 22.5 4 C 22.5 6.2 24.3 8 26.5 8.5 C 24.3 9 22.5 10.8 22.5 13 C 22.5 10.8 20.7 9 18.5 8.5 C 20.7 8 22.5 6.2 22.5 4 Z"
        fill="url(#smt-brand-spark)"
      />
    </svg>
  );
}
