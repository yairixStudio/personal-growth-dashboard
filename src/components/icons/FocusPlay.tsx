/** Lucide's `Focus` brackets with the center dot swapped for a play triangle —
 *  reads as "focus and play" rather than plain "focus", for the two spots
 *  (panel header, toolbar) that jump straight into a running focus mode. */
import type { SVGProps } from 'react';

export function FocusPlay(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <polygon points="10.3 9 10.3 15 15.3 12" fill="currentColor" stroke="none" />
    </svg>
  );
}
