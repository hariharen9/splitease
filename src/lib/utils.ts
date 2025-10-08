
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

let lastIdTimestamp = 0;
let lastIdCounter = 0;

export function generateId(): string {
  const now = Date.now();
  if (now === lastIdTimestamp) {
    lastIdCounter++;
  } else {
    lastIdTimestamp = now;
    lastIdCounter = 0;
  }
  return `${now.toString(36)}${lastIdCounter.toString(36)}`;
}

export function generatePin(length: number = 6): string {
  return Math.floor(Math.random() * (10 ** length)).toString().padStart(length, "0");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function getCurrencySymbol(currency: string = "INR") {
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };
  return symbols[currency] || currency;
}

export function calculatePercentage(amount: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((amount / total) * 100)}%`;
}
