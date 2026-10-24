/** Data civil do dispositivo; UTC pode já estar no dia seguinte no Brasil. */
export function dataLocalISO(data = new Date()) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}
