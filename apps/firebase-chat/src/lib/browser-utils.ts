export function isEnterKey(event: KeyboardEvent) {
  return event.key ? event.key === 'Enter' : event.keyCode === 13;
}

export function fullPath() {
  return window.location.href.replace(window.location.origin, '');
}

export function pathWithoutHash() {
  return window.location.pathname.replace(window.location.hash, '');
}
