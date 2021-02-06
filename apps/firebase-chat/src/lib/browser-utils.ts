export function isEnterKey(event: KeyboardEvent) {
  return event.key ? event.key === 'Enter' : event.keyCode === 13;
}

export const fullPath = () =>
  window.location.href.replace(window.location.origin, '');
