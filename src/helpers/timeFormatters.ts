export function formatRemainingTime(timeDelta: number): string[] {
  const days = Math.floor(timeDelta / 86400);
  const hours = Math.floor((timeDelta % 86400) / 3600);
  const minutes = Math.floor(((timeDelta % 86400) % 3600) / 60);
  const seconds = Math.floor(((timeDelta % 86400) % 3600) % 60);

  const daysStr = `${days} days`;
  const hoursStr = `${hours} hours`;
  const minutesStr = `${minutes} minutes`;
  const secondsStr = `${seconds} seconds`;

  if (days > 0) {
    return [daysStr, hoursStr, minutesStr, secondsStr];
  } else if (hours > 0) {
    return [hoursStr, minutesStr, secondsStr];
  } else if (minutes > 0) {
    return [minutesStr, secondsStr];
  } else {
    return [secondsStr];
  }
}

export type NaiveDateTime = `${number}-${number}-${number}T${number}:${number}:${number}.${number}`;

export function toNaiveDateTime(date: Date): NaiveDateTime {
  return date.toISOString().replace(/Z$/, '') as NaiveDateTime;
}
