import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanUnitName(name?: string | null): string {
  if (!name) return "—";
  return (
    name
      .replace(/מחלקת|מחלקה/g, "")
      .replace(/מדור/g, "")
      .replace(/חוליית|חולייה/g, "")
      .replace(/צוות/g, "")
      .trim() || "—"
  );
}

export function getHexColor(color: string) {
  switch (color) {
    case "blue":
      return "#0074ff";
    case "indigo":
      return "#6366f1";
    case "emerald":
      return "#10b981";
    case "rose":
      return "#f43f5e";
    case "amber":
      return "#f59e0b";
    default:
      return "#0074ff";
  }
}

export function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function isValidIsraeliPhone(phone: string | null | undefined): boolean {
  if (!phone || !phone.trim()) return true;
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  let normalized = cleaned;
  if (normalized.startsWith("+972")) {
    normalized = "0" + normalized.slice(4);
  } else if (normalized.startsWith("972")) {
    normalized = "0" + normalized.slice(3);
  }
  // Mobile: 05X-XXXXXXX (10 digits) | Landline/VoIP: 02/03/04/08/09/07X (9-10 digits)
  return /^0(5\d{8}|[23489]\d{7}|7[2346789]\d{7})$/.test(normalized);
}

export function formatIsraeliPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  let normalized = cleaned;
  if (normalized.startsWith("+972")) {
    normalized = "0" + normalized.slice(4);
  } else if (normalized.startsWith("972")) {
    normalized = "0" + normalized.slice(3);
  }
  if (/^05\d{8}$/.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }
  if (/^0[23489]\d{7}$/.test(normalized)) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2)}`;
  }
  if (/^07[2346789]\d{7}$/.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }
  return phone;
}

/**
 * Normalizes phone numbers to International format for WhatsApp API / wa.me links
 * e.g., "0501234567" -> "972501234567"
 * e.g., "+972 50-123-4567" -> "972501234567"
 */
export function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone || !phone.trim()) return "";
  let cleaned = phone.trim().replace(/\D/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("972")) {
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    return "972" + cleaned.substring(1);
  }

  if (cleaned.length === 9) {
    return "972" + cleaned;
  }

  return cleaned;
}

/**
 * Builds direct WhatsApp URL with recipient phone and pre-filled text
 */
export function getWhatsAppUrl(phone: string | null | undefined, text: string = ""): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

