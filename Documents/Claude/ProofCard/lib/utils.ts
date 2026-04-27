import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(): string {
  return Math.random().toString(36).slice(2, 6) +
         Math.random().toString(36).slice(2, 6)
}

export function calcDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

export function calcTotalLoss(startWeight: number, currentWeight: number): number {
  return Math.round((startWeight - currentWeight) * 10) / 10
}

export function calcAvgLoss(totalLoss: number, days: number): number {
  if (days === 0) return 0
  return Math.round((totalLoss / days * 7) * 10) / 10
}
