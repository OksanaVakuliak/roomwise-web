export function focusField(id: string): void {
  const field = document.getElementById(id);
  if (!field) {
    return;
  }
  field.focus({ preventScroll: true });
  field.scrollIntoView({ block: 'center' });
}
