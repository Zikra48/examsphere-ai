import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-[#101827] border border-white/[0.08] rounded-xl">
      <div className="w-12 h-12 rounded-xl bg-[#151F30] border border-white/[0.08] flex items-center justify-center text-[#9AA8BD] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#F1F5FC]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[#9AA8BD] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
