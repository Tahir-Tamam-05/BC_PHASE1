import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react';

// Task 2.1: Added 'needs_clarification' status
export type ProjectStatus = 'pending' | 'verified' | 'rejected' | 'needs_clarification';

interface StatusBadgeProps {
  status: ProjectStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config: Record<string, {
    icon: React.ElementType;
    label: string;
    className: string;
  }> = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
    verified: {
      icon: CheckCircle2,
      label: 'Verified',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    // Task 2.1: Distinct visual treatment for clarification-needed projects
    needs_clarification: {
      icon: MessageSquare,
      label: 'Needs Clarification',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
  };

  // Fallback for unknown statuses
  const statusConfig = config[status] ?? {
    icon: Clock,
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const { icon: Icon, label, className: statusClassName } = statusConfig;

  return (
    <Badge
      variant="secondary"
      className={`gap-1 ${statusClassName} ${className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
