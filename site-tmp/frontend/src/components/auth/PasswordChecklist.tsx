import { Check, X } from 'lucide-react';
import { PASSWORD_RULE_LABELS, checkPassword } from '../../lib/password';
import { cn } from '../../lib/utils';

export function PasswordChecklist({ password }: { password: string }) {
  const checks = checkPassword(password);
  return (
    <ul className="grid gap-1 text-sm" aria-label="Requisitos de la contraseña">
      {PASSWORD_RULE_LABELS.map(({ key, label }) => {
        const ok = checks[key];
        return (
          <li key={key} className={cn('flex items-center gap-2 font-medium', ok ? 'text-leaf-deep' : 'text-ink-soft')}>
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink',
                ok ? 'bg-leaf text-white' : 'bg-white'
              )}
              aria-hidden
            >
              {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </span>
            <span>{label} {ok ? <span className="sr-only">(cumplido)</span> : null}</span>
          </li>
        );
      })}
    </ul>
  );
}
