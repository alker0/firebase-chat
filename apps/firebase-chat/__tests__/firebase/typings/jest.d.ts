declare namespace jest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R> {
    toBePermissionDenied(): Promise<CustomeMatcherResult>;
  }
  interface Expect {
    toBePermissionDenied(dbAccess: Promise<unknown>): Promise<unknown>;
  }
  interface InverseAsymmetricMathcers {
    toBePermissionDenied(dbAccess: Promise<unknown>): Promise<unknown>;
  }
}
