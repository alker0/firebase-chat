import { createDebugButtonFactory } from '@components/common/case/debug-button-table/utils';

export const {
  createDebugButton,
  getDebugButtonPropsArray,
} = createDebugButtonFactory({
  otherProps: {
    class: 'btn-animated btn-primary',
  },
});
