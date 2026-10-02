import * as React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex -rotate-1 items-center rounded-lg border-2 border-ink px-2.5 py-0.5 text-xs font-bold', className)} {...props} />;
}

export function statusBadge(status: string) {
  switch (status) {
    case 'approved': return 'bg-[#D5F0DC] text-leaf-deep';
    case 'review': return 'bg-sun text-ink';
    case 'pending': return 'bg-paper-deep text-ink-soft';
    case 'reprocessing': return 'bg-sky text-ink';
    case 'error': return 'bg-[#FFD9CE] text-coral-deep';
    case 'queued': return 'bg-white text-ink-soft';
    case 'processing': return 'bg-[#DCD4FF] text-[#3D2FB5]';
    case 'failed': return 'bg-[#FFD9CE] text-coral-deep';
    default: return 'bg-white text-ink-soft';
  }
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente', review: 'Por revisar', approved: 'Aprobada',
    reprocessing: 'Reprocesando', error: 'Error', queued: 'En cola',
    processing: 'Procesando', failed: 'Fallida',
  };
  return map[status] ?? status;
}
