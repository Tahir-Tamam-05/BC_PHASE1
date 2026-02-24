/**
 * Task 9.3: Compliance Disclaimer Component
 *
 * Displays the mandatory "not a government-recognized carbon registry" disclaimer
 * on all pages as required by the PRD. This ensures users are always aware of the
 * voluntary nature of the credits.
 */
import { AlertTriangle } from 'lucide-react';

interface ComplianceDisclaimerProps {
  /** 'banner' = full-width bar (for page footers/headers), 'inline' = compact card */
  variant?: 'banner' | 'inline';
  className?: string;
}

export function ComplianceDisclaimer({
  variant = 'banner',
  className = '',
}: ComplianceDisclaimerProps) {
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 ${className}`}
        role="note"
        aria-label="Compliance disclaimer"
        data-testid="compliance-disclaimer-inline"
      >
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          <strong>Voluntary Credits Only:</strong> BlueCarbon Ledger is not a government-recognized
          carbon registry. Credits are voluntary digital representations for ESG and sustainability
          reporting only and do not constitute compliance-market carbon credits.
        </span>
      </div>
    );
  }

  // Banner variant — full-width, suitable for page bottom
  return (
    <div
      className={`w-full bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800 px-4 py-2 ${className}`}
      role="note"
      aria-label="Compliance disclaimer"
      data-testid="compliance-disclaimer-banner"
    >
      <div className="container mx-auto flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <p>
          <strong>Disclaimer:</strong> BlueCarbon Ledger operates as a technology platform and is{' '}
          <strong>not a government-recognized carbon registry</strong>. All credits are voluntary
          digital representations for ESG and sustainability reporting purposes only. They do not
          constitute compliance-market carbon credits under any regulatory framework.
        </p>
      </div>
    </div>
  );
}
