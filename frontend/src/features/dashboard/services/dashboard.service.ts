import { DashboardData } from "../types/dashboard.types";

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    await new Promise((res) => setTimeout(res, 300));

    return {
      totalEmployees: 31,
      availableEmployees: 13,
      unavailableEmployees: 15,
      unknownEmployees: 3,
      departmentProgress: [
        { department: "מחלקה התעצמות", percentage: 50, current: 5, total: 10 },
        { department: "מחלקה טכנולוגית", percentage: 38, current: 3, total: 8 },
        { department: "מחלקה מענה מבצעי", percentage: 38, current: 5, total: 13 },
      ],
      availabilityTrend: [
        { date: "18/06", value: 8 },
        { date: "20/06", value: 8 },
        { date: "22/06", value: 8 },
        { date: "24/06", value: 8 },
        { date: "26/06", value: 8 },
        { date: "28/06", value: 8 },
        { date: "30/06", value: 8 },
        { date: "02/07", value: 8 },
        { date: "04/07", value: 8 },
        { date: "06/07", value: 8 },
        { date: "08/07", value: 14 },
        { date: "10/07", value: 13 },
        { date: "12/07", value: 13 },
        { date: "14/07", value: 13 },
        { date: "16/07", value: 13 },
      ],
      ageDistribution: [
        { group: "18-21", count: 5 },
        { group: "22-25", count: 5 },
        { group: "26-30", count: 4 },
        { group: "31-35", count: 4 },
        { group: "36-40", count: 5 },
        { group: "41-50", count: 4 },
        { group: "+50", count: 4 },
      ],
      averageAge: 34.0,
      birthdays: [
        {
          id: 1,
          name: "נעם רז",
          initials: "נר",
          dateStr: "25 ביולי",
          phone: "0501234567",
        },
      ],
      statusDistribution: [
        { name: "דיווח בדיקה ידני", value: 19, color: "#3B82F6", percent: "19%" },
        { name: "תפקוד", value: 16, color: "#F97316", percent: "16%" },
        { name: "חופשה", value: 16, color: "#EF4444", percent: "16%" },
        { name: "מחלה", value: 16, color: "#A855F7", percent: "16%" },
        { name: "קורס", value: 13, color: "#EAB308", percent: "13%" },
        { name: "משרד", value: 13, color: "#10B981", percent: "13%" },
        { name: "חו\"ל", value: 12, color: "#06B6D4", percent: "12%" },
        { name: "לא ידוע", value: 10, color: "#64748B", percent: "10%" },
      ],
    };
  },
};
