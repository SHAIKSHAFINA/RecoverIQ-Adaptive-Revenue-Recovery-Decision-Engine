import React from 'react';
import { GuardrailStatus } from '../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  status: GuardrailStatus;
  size?: 'sm' | 'md';
}

export const GuardrailBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  if (status === 'PASS') {
    return (
      <span
        id={`guardrail-status-${status.toLowerCase()}`}
        className={`inline-flex items-center gap-1 font-medium font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 rounded ${
          size === 'sm' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <CheckCircle2 className={size === 'sm' ? 'w-2.5 h-2.5 text-emerald-600' : 'w-3 h-3 text-emerald-600'} />
        PASS
      </span>
    );
  }

  if (status === 'REVIEW') {
    return (
      <span
        id={`guardrail-status-${status.toLowerCase()}`}
        className={`inline-flex items-center gap-1 font-medium font-mono text-amber-800 bg-amber-50 border border-amber-200 rounded ${
          size === 'sm' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <AlertTriangle className={size === 'sm' ? 'w-2.5 h-2.5 text-amber-600' : 'w-3 h-3 text-amber-600'} />
        REVIEW
      </span>
    );
  }

  return (
    <span
      id={`guardrail-status-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-1 font-medium font-mono text-rose-800 bg-rose-50 border border-rose-200 rounded ${
        size === 'sm' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <XCircle className={size === 'sm' ? 'w-2.5 h-2.5 text-rose-600' : 'w-3 h-3 text-rose-600'} />
      BLOCK
    </span>
  );
};
