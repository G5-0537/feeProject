export function statusClass(status = '') {
  return status.toLowerCase().replaceAll(' ', '-');
}

export function shortTime(value) {
  if (!value) return '--';
  return String(value).slice(0, 5);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
