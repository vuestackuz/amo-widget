function inHoursMinutesSeconds(value) {
  if (value >= 86400) return 'more_than_a_day'; // Optional: handle values >= 24h

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  const hh = hours > 0 ? String(hours).padStart(2, '0') : '';
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return hh ? `${hh} : ${mm} : ${ss}` : `${mm} : ${ss}`;
}

export {
  inHoursMinutesSeconds
}