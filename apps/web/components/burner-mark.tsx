type BurnerMarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function BurnerMark({
  size = 28,
  className,
  title = "Burner",
}: BurnerMarkProps) {
  return (
    <svg
      aria-label={title}
      className={className}
      height={size}
      role="img"
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        d="M22 27 C22 17 26 8 32 4 C38 8 42 17 42 27 C38 23 36 25 32 25 C28 25 26 23 22 27 Z"
        fill="currentColor"
      />
      <path
        d="M28 25 C28 18 30 12 32 9 C34 12 36 18 36 25 C34 23 33 24 32 24 C31 24 30 23 28 25 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <circle cx="32" cy="42" r="20" fill="#1f1f22" />
      <circle
        cx="32"
        cy="42"
        r="15"
        fill="none"
        stroke="#3a3a42"
        strokeWidth="0.6"
      />
      <circle
        cx="32"
        cy="42"
        r="11"
        fill="none"
        stroke="#3a3a42"
        strokeWidth="0.6"
      />
      <circle cx="32" cy="42" r="7" fill="#f4f2ec" />
      <circle cx="32" cy="42" r="2.5" fill="#1f1f22" />
      <path
        d="M16 37 Q21 33 26 32"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}
