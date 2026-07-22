import { DepartmentNode } from "../types/organization.types";

const MOCK_STRUCTURE: DepartmentNode[] = [
  {
    id: 1,
    name: "מחלקה התעצמות",
    commander_id: 101,
    commander_name: "רס\"ן אלון ישראלי",
    headcount: 10,
    sections: [
      {
        id: 11,
        name: "מדור תכנון",
        department_id: 1,
        commander_name: "סרן דן כהן",
        headcount: 5,
        teams: [
          { id: 111, name: "צוות א'", section_id: 11, headcount: 3 },
          { id: 112, name: "צוות ב'", section_id: 11, headcount: 2 },
        ],
      },
      {
        id: 12,
        name: "מדור פיתוח",
        department_id: 1,
        commander_name: "סרן רועי לוי",
        headcount: 5,
        teams: [
          { id: 121, name: "צוות ג'", section_id: 12, headcount: 5 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "מחלקה טכנולוגית",
    commander_id: 102,
    commander_name: "סא\"ל מיכאל אברהם",
    headcount: 8,
    sections: [
      {
        id: 21,
        name: "מדור תשתיות",
        department_id: 2,
        commander_name: "סרן עומר שדה",
        headcount: 4,
        teams: [
          { id: 211, name: "צוות עננים", section_id: 21, headcount: 4 },
        ],
      },
      {
        id: 22,
        name: "מדור אבטחת מידע",
        department_id: 2,
        commander_name: "סרן נועה שחר",
        headcount: 4,
        teams: [
          { id: 221, name: "צוות סייבר", section_id: 22, headcount: 4 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "מחלקה מענה מבצעי",
    commander_id: 103,
    commander_name: "סא\"ל יאיר דגן",
    headcount: 13,
    sections: [
      {
        id: 31,
        name: "מדור חמ\"ל",
        department_id: 3,
        commander_name: "סרן גיא חזן",
        headcount: 7,
        teams: [
          { id: 311, name: "צוות יום", section_id: 31, headcount: 4 },
          { id: 312, name: "צוות לילה", section_id: 31, headcount: 3 },
        ],
      },
      {
        id: 32,
        name: "מדור סיור",
        department_id: 3,
        commander_name: "סרן אורן שמעוני",
        headcount: 6,
        teams: [
          { id: 321, name: "צוות אלפא", section_id: 32, headcount: 6 },
        ],
      },
    ],
  },
];

export const organizationService = {
  async getStructure(): Promise<DepartmentNode[]> {
    await new Promise((res) => setTimeout(res, 300));
    return MOCK_STRUCTURE;
  },
};
