import React from 'react';

interface Props {
  score: number; // 0 to 1
  label?: string;
  showBar?: boolean;
}

export const RiskIndicator: React.FC<Props> = ({ score, label, showBar = false }) => {
  const percentage = Math.round(score * 100);

  let colorClasses = 'text-emerald-800 bg-emerald-50 border-emerald-200';
  let barColor = 'bg-emerald-600';
  let tier = 'Low';

  if (score >= 0.70) {
    colorClasses = 'text-rose-800 bg-rose-50 border-rose-200';
    barColor = 'bg-rose-600';
    tier = 'High';
  } else if (score >= 0.35) {
    colorClasses = 'text-amber-800 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-600';
    tier = 'Medium';
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-mono font-medium border ${colorClasses}`}
        >
          {label ? `${label}: ` : ''}{score.toFixed(2)} ({tier})
        </span>
      </div>
      {showBar && (
        <div className="w-full bg-slate-100 rounded h-1 overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
};
