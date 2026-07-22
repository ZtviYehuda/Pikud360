import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Cake, Calendar, ChevronLeft } from "lucide-react";
import type { BirthdayInfo } from "@/types/attendance.types";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import type { Employee } from "@/types/employee.types";

interface BirthdayModuleProps {
  birthdays: BirthdayInfo[];
}

export const BirthdayModule = ({ birthdays }: BirthdayModuleProps) => {
  return (
    <Card className="border border-slate-100  bg-white dark:bg-card dark:border-border h-full flex flex-col">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800  transition-transform hover:rotate-6">
            <Cake className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-[#001e30] dark:text-white">
              לוח אירועים
            </CardTitle>
            <CardDescription className="font-bold text-[10px] text-orange-400 uppercase tracking-widest">
              Team Milestones
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {birthdays.map((b, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-transparent bg-slate-50/50 hover:bg-white hover:border-slate-100 hover: transition-all cursor-default dark:bg-slate-800/40 dark:border-transparent dark:hover:bg-slate-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-[#0074ff]  dark:bg-slate-700 dark:border-slate-600 transition-transform group-hover:scale-105">
                  {b.first_name[0]}
                  {b.last_name[0]}
                </div>
                <div className="flex flex-col">
                  <EmployeeLink
                    employee={b as any as Employee}
                    className="text-sm font-bold text-slate-800 dark:text-white leading-none mb-1 h-auto p-0 hover:no-underline"
                  />
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {b.day < 10 ? `0${b.day}` : b.day}.
                      {b.month < 10 ? `0${b.month}` : b.month}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform" />
            </div>
          ))}

          {birthdays.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 opacity-30 text-center grayscale">
              <Cake className="w-10 h-10 mb-4" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                No Data Recorded
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4 border-t border-slate-50 mt-auto dark:border-border/50">
        <button className="w-full py-2.5 rounded-lg text-[11px] font-black text-[#0074ff] bg-blue-50 border border-blue-100 hover:bg-[#0074ff] hover:text-white transition-all uppercase tracking-widest dark:bg-primary/10 dark:border-primary/20">
          Open Registry
        </button>
      </div>
    </Card>
  );
};
