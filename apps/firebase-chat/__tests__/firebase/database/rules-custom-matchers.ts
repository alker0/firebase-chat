import { isPermissionDeniedError, permDeniedCode } from './rules-test-utils';

expect.extend({
  async toBePermissionDenied(dbAccess: Promise<unknown>) {
    try {
      await dbAccess;
      return {
        pass: false,
        message: () => 'Expected request to fail, but it succeeded.',
      };
    } catch (error: unknown) {
      if (isPermissionDeniedError(error)) {
        return {
          pass: true,
          message: () => `Unexpected ${permDeniedCode}.`,
        };
      } else {
        const { isNot } = this;
        return {
          pass: isNot,
          message: () => {
            if (isNot) {
              return `Unexpected error: ${error}`;
            } else {
              return `Expected PERMISSION_DENIED but got unexpected error: ${error}`;
            }
          },
        };
      }
    }
  },
});
