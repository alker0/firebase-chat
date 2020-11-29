import { Cirrus } from './cirrus-style';

export type SizedFormItem = Extract<
  | 'label-xsmall'
  | 'label-small'
  | 'label'
  | 'label-large'
  | 'label-xlarge'
  | 'input-xsmall'
  | 'input-small'
  | 'input'
  | 'input-large'
  | 'input-xlarge'
  | 'btn-xsmall'
  | 'btn-small'
  | 'btn'
  | 'btn-large'
  | 'btn-xlarge',
  Cirrus
>;
