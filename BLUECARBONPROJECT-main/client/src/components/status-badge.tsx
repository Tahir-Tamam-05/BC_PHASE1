import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'verified' | 'rejected';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = {
    pending: {
      icon: Clock,
      label: 'Pending',
      variant: 'secondary' as const,
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
    verified: {
      icon: CheckCircle2,
      label: 'Verified',
      variant: 'secondary' as const,
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      variant: 'secondary' as const,
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  const { icon: Icon, label, className: statusClassName } = config[status];

  return (
    <Badge variant="secondary" className={`gap-1 ${statusClassName} ${className}`} data-testid={`badge-status-${status}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
