export const permDeniedCode = 'PERMISSION_DENIED';
export const permDeniedMsg = 'PERMISSION_DENIED: Permission denied';

interface ErrorWithCode extends Error {
  code: string;
}

export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    Boolean(error) &&
    typeof error === 'object' &&
    Object.prototype.hasOwnProperty.call(error, 'message') &&
    Object.prototype.hasOwnProperty.call(error, 'code')
  );
}

export function isPermissionDeniedError(
  error: unknown,
): error is ErrorWithCode {
  if (isErrorWithCode(error)) {
    return (
      error.message.toUpperCase().indexOf(permDeniedCode) >= 0 ||
      error.code.replace('-', '_').toUpperCase() === permDeniedCode
    );
  } else {
    return false;
  }
}
