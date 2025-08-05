export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

export function formatDateToISO(date: Date): string {
  return date.toISOString()
}

export function formatTimestampFields<T extends Record<string, any>>(
  data: T,
  timestampFields: (keyof T)[] = ['createdAt', 'updatedAt', 'lastLoginAt']
): T {
  const formatted = { ...data }
  
  timestampFields.forEach(field => {
    if (formatted[field] instanceof Date) {
      formatted[field] = formatDateToISO(formatted[field] as Date)
    }
  })
  
  return formatted
}

export function formatArrayTimestamps<T extends Record<string, any>>(
  items: T[],
  timestampFields: (keyof T)[] = ['createdAt', 'updatedAt', 'lastLoginAt']
): T[] {
  return items.map(item => formatTimestampFields(item, timestampFields))
}