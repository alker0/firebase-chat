import { RegisterOptions } from 'ts-node';

export interface RulesFactoryOptions {
  bridgeJsAbsPath: string;
  tsNodeOption: RegisterOptions & Required<Pick<RegisterOptions, 'project'>>;
  creatorTsAbsPath: string;
}
