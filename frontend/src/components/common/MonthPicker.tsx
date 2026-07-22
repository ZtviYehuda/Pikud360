import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, setMonth, setYear, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
    current: Date;
    onSelect: (d: Date) => void;
    className?: string; // Add className prop for flexibility
}

export const MonthPicker = ({ current, onSelect, className }: MonthPickerProps) => {
    const [viewDate, setViewDate] = useState(current);

    const nextYear = () => setViewDate(addMonths(viewDate, 12));
    const prevYear = () => setViewDate(subMonths(viewDate, 12));

    const months = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
    ];

    return (
        <div className={cn("p-3 w-[280px]", className)}>
            <div className="flex items-center justify-between mb-4">
                <Button onClick={prevYear} variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="font-bold text-sm">{format(viewDate, "yyyy")}</span>
                <Button onClick={nextYear} variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {months.map((m, i) => {
                    const isSelected =
                        i === current.getMonth() &&
                        viewDate.getFullYear() === current.getFullYear();
                    return (
                        <Button
                            key={i}
                            variant={isSelected ? "default" : "ghost"}
                            className={cn(
                                "h-9 text-xs font-normal",
                                isSelected && "font-bold"
                            )}
                            onClick={() => {
                                const d = endOfMonth(
                                    setYear(setMonth(new Date(), i), viewDate.getFullYear())
                                );
                                onSelect(d);
                            }}
                        >
                            {m}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};
