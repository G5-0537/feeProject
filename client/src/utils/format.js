export function statusClass(status = '') {
  return status.toLowerCase().replaceAll(' ', '-');
}

export function shortTime(value) {
  if (!value) return '--';
  return String(value).slice(0, 5);
}

export function formatTime12h(timeStr) {
  if (!timeStr) return '--';
  const parts = String(timeStr).split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] || '00';
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export function isBusinessOpen(openingTime, closingTime) {
  if (!openingTime || !closingTime) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [oH, oM] = String(openingTime).split(':').map(Number);
  const [cH, cM] = String(closingTime).split(':').map(Number);
  const openMin = (oH || 0) * 60 + (oM || 0);
  const closeMin = (cH || 0) * 60 + (cM || 0);
  return currentMinutes >= openMin && currentMinutes < closeMin;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

