
interface EmployeeInfoRowProps {
  label: string;
  value?: string | number | null;
}

export default function EmployeeInfoRow({ label, value }: EmployeeInfoRowProps) {
  const isAvailable = value !== undefined && value !== null && String(value).trim() !== '';
  const displayValue = isAvailable ? value : 'לא זמין';
  
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
      <span className="text-slate-450 dark:text-slate-400 font-medium">{label}:</span>
      <span className={`font-bold ${isAvailable ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 font-normal italic'}`}>
        {displayValue}
      </span>
    </div>
  );
}
