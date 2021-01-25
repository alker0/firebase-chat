import type firebase from 'firebase';

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
      error.code.replace('-', '_').toUpperCase() === permDeniedCode ||
      error.message.toUpperCase().indexOf(permDeniedCode) >= 0
    );
  } else {
    return false;
  }
}

export function logNonPermissionDeniedError(error: Error | null) {
  if (error) {
    if ((error as ErrorWithCode).code !== permDeniedCode) {
      console.error(error);
    }
  }
}

interface Snapshot extends firebase.database.DataSnapshot {}

export interface ArrayFromSnapshotOption {
  descending?: boolean;
  onNoChild?: () => void;
}

export function arrayFromSnapshot<T>(
  snapshot: Snapshot,
  pickElementFn: (childSnapshot: Snapshot) => T,
  options: ArrayFromSnapshotOption = {},
) {
  const resultList: T[] = [];
  if (snapshot.hasChildren()) {
    snapshot.forEach((data) => {
      resultList[options.descending ? 'unshift' : 'push'](pickElementFn(data));
    });
  } else {
    options.onNoChild?.();
  }
  return resultList;
}
