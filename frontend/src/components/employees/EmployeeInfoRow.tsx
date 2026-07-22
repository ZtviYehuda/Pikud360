interface EmployeeInfoRowProps {
  label: string;
  value?: string | number | null;
}

export default function EmployeeInfoRow({ label, value }: EmployeeInfoRowProps) {
  const isAvailable = value !== undefined && value !== null && String(value).trim() !== '';
  const displayValue = isAvailable ? value : 'לא זמין';
  
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/40 last:border-0 text-xs">
      <span className="text-muted-foreground font-medium">{label}:</span>
      <span className={`font-bold ${isAvailable ? 'text-foreground' : 'text-muted-foreground/60 font-normal italic'}`}>
        {displayValue}
      </span>
    </div>
  );
}
