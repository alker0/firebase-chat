import {
  createSignal,
  createMemo,
  mergeProps,
  splitProps,
  JSX,
} from 'solid-js';
import { DO_NOTHING } from '../../util/component-utils';
import { EventArg } from '../../../types/component-utils';

export const defaultRemovableDebugButtonProps: RemovableDebugButtonProps = {
  innerContents: 'No Text',
  onClick: (_e, remove) => remove(),
  otherProps: {},
};

const defaultFixedButtonProps: FixedDebugButtonProps = {
  ...defaultRemovableDebugButtonProps,
  onClick: DO_NOTHING,
};

const onClickKey = 'onClick';
type OnClick = typeof onClickKey;

export function createDebugButtonFactory(
  defaultPropsArg: Partial<RemovableDebugButtonProps> = {},
) {
  const [getDebugButtonPropsArray, setDebugButtonPropsArray] = createSignal<
    FixedDebugButtonProps[]
  >([]);

  const defaultProps = mergeProps(
    defaultRemovableDebugButtonProps,
    defaultPropsArg,
  );

  return {
    createDebugButton(propsArg: Partial<RemovableDebugButtonProps>) {
      const props = mergeProps({}, defaultProps, propsArg);
      let fixedForSearch: FixedDebugButtonProps = defaultFixedButtonProps;

      const removeDebugButtonProp = () => {
        const prevArray = getDebugButtonPropsArray();
        const selfIndex = prevArray.indexOf(fixedForSearch);
        if (0 <= selfIndex) {
          const copied = prevArray.concat();
          copied.splice(selfIndex, 1);
          setDebugButtonPropsArray(copied);
        }
      };

      const onClickMemo = createMemo(() => props.onClick.bind(props));

      const fixed: FixedDebugButtonProps = mergeProps(
        splitProps(props, [onClickKey])[1],
        {
          get onClick(): FixedDebugButtonProps[OnClick] {
            const onClickFn = onClickMemo();
            return (event) => onClickFn(event, removeDebugButtonProp);
          },
        },
      );
      fixedForSearch = fixed;

      setDebugButtonPropsArray(getDebugButtonPropsArray().concat([fixed]));

      return removeDebugButtonProp;
    },
    getDebugButtonPropsArray,
    setDebugButtonPropsArray,
  };
}

interface ButtonAttributes
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {}

export interface DebugButtonClickHandler {
  (event: EventArg<HTMLButtonElement, MouseEvent>, remove: () => void): void;
}

export interface RemovableDebugButtonProps {
  innerContents: string;
  onClick: DebugButtonClickHandler;
  otherProps: ButtonAttributes;
}

export interface FixedDebugButtonProps
  extends Omit<RemovableDebugButtonProps, OnClick> {
  onClick: ButtonAttributes[OnClick];
}
