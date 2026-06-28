import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = '₪') {
  return `${currency}${amount.toFixed(2)}`
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'אושר',
  PREPARING: 'בהכנה',
  READY: 'מוכן',
  DELIVERED: 'נמסר',
  CANCELLED: 'בוטל',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  ASSIGNED: 'הוקצה שליח',
  PICKED_UP: 'נאסף',
  DELIVERED: 'נמסר',
  FAILED: 'נכשל',
}

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'אושר',
  CANCELLED: 'בוטל',
  COMPLETED: 'הושלם',
}

export const EMPLOYEE_ROLES: Record<string, string> = {
  MANAGER: 'מנהל',
  WAITER: 'מלצר',
  CHEF: 'טבח',
  CASHIER: 'קופאי',
  COURIER: 'שליח',
  CLEANER: 'מנקה',
}
