export function formatWaitRange(minutes) {
  if (minutes <= 0) return '0-5 min';

  const lower = Math.max(0, Math.floor(minutes / 5) * 5);
  const upper = Math.max(5, Math.ceil((minutes + 8) / 5) * 5);

  if (upper >= 60) {
    const lowerHours = Math.floor(lower / 60);
    const lowerMinutes = lower % 60;
    const upperHours = Math.floor(upper / 60);
    const upperMinutes = upper % 60;
    const left = lowerHours ? `${lowerHours} hr ${lowerMinutes ? `${lowerMinutes} min` : ''}`.trim() : `${lowerMinutes} min`;
    const right = upperHours ? `${upperHours} hr ${upperMinutes ? `${upperMinutes} min` : ''}`.trim() : `${upperMinutes} min`;
    return `${left}-${right}`;
  }

  return `${lower}-${upper} min`;
}

export function queueMessage(peopleAhead) {
  if (peopleAhead <= 0) return "You're next!";
  if (peopleAhead <= 2) return 'Your turn is approaching';
  return 'Waiting';
}
