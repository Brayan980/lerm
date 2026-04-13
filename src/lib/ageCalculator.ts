
export function calculateDecimalAge(birthDateInput: Date | string, currentDate: Date = new Date()): number {
  let birthDate: Date;

  if (typeof birthDateInput === 'string') {
    birthDate = new Date(birthDateInput);
  } else {
    birthDate = birthDateInput;
  }

  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return 0; 
  }
  const diff = currentDate.getTime() - birthDate.getTime();
  if (diff < 0) return 0; // Birth date is in the future
  const ageInMilliseconds = diff;
  const millisecondsInYear = 365.25 * 24 * 60 * 60 * 1000;
  const decimalAge = ageInMilliseconds / millisecondsInYear;
  return parseFloat(decimalAge.toFixed(2));
}
