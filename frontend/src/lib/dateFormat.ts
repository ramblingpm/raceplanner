/**
 * Format a date string or Date object to ISO format: YYYY-MM-DD HH:mm
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format a date string or Date object to ISO date format: YYYY-MM-DD
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
