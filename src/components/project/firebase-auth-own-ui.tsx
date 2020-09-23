import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { LoginBasicBottom } from '@components/common/cirrus/domain/login-basic-bottom';
import { Cirrus } from '@components/common/typings/cirrus-style';
import { OnlyOptional } from '@components/common/typings/component-creater';
import { inputRegex } from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  Component,
  createEffect,
  createMemo,
  createState,
  SetStateFunction,
  State,
  untrack,
} from 'solid-js';

type BottomPadding = 'This is Bottom Margin';

const cn: Clsx<Cirrus | BottomPadding> = clsx;

const defaultContainerProps: Required<ContainerProps> = {
  ofForm: {},
  ofInternalContainer: {},
  ofInternalTitle: {},
  ofInternalBody: {},
  children: '',
};

const Container = FormContainer.createComponent({
  createContainer: () => (propsArg: ContainerProps = {}) => {
    const props = assignProps({}, defaultContainerProps, propsArg);
    return (
      <form {...(props.ofForm ?? {})}>
        <div {...props.ofInternalContainer}>
          <div {...props.ofInternalTitle} />
          <div {...props.ofInternalBody} children={props.children} />
        </div>
      </form>
    );
  },
});

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

interface OuterBottomProps extends LoginBasicBottom.BottomWholeProps {
  // eslint-disable-next-line react/no-unused-prop-types
  bottomComponent: Component<LoginBasicBottom.BottomWholeProps>;
}

interface InnerBottomProps extends LoginBasicBottom.BottomWholePropsOpts {
  // eslint-disable-next-line react/no-unused-prop-types
  bottomComponent: Component<LoginBasicBottom.BottomWholeProps>;
  // eslint-disable-next-line react/no-unused-prop-types
  ofSubmit: JSX.InputHTMLAttributes<HTMLInputElement>;
}

// button.animated.btn-info.outline
const Bottom = LoginBasicBottom.createComponent({
  whole: (props: OuterBottomProps) => (
    <props.bottomComponent submitButton={props.submitButton} />
  ),
});

type OnSubmit = NonNullable<
  JSX.FormHTMLAttributes<HTMLFormElement>['onSubmit']
>;

interface ContainerProps {
  ofForm?: JSX.FormHTMLAttributes<HTMLFormElement>;
  ofInternalContainer?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalTitle?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalBody?: JSX.HTMLAttributes<HTMLDivElement>;
  children?: JSX.HTMLAttributes<HTMLElement>['children'];
}

interface InputProps {
  getInputValue: FirebaseAuthOwnUI.InputValueState['getter'];
  setInputValue: FirebaseAuthOwnUI.InputValueState['setter'];
  useFields: {
    email: boolean;
    password: boolean;
    passConfirm: boolean;
  };
}

export const defaultContext: Required<FirebaseAuthOwnUI.Context> = {
  passwordLength: 6,
  bottomWrapper: (props) => props.bottomContents,
};

const defaultProps: Required<OnlyOptional<FirebaseAuthOwnUI.Props<unknown>>> = {
  getInputValueAccessor: () =>
    createState<FirebaseAuthOwnUI.InputValueState['scheme']>({
      email: '',
      password: '',
      passConfirm: '',
      infoMessage: '',
      errorMessage: '',
    }),
  submitButtonProps: (disableWhenLoggedIn) => disableWhenLoggedIn,
};

export const FirebaseAuthOwnUI = {
  createComponent: (contextArg: FirebaseAuthOwnUI.Context = {}) => {
    const context = assignProps({}, defaultContext, contextArg);

    const FormComponent = Form.createComponent({
      container: Container,
      inputFields: (props: InputProps) => (
        <>
          <div class={cn('u-text-center', 'text-info')}>
            {props.getInputValue.infoMessage}
          </div>
          <div class={cn('u-text-center', 'text-danger')}>
            {props.getInputValue.errorMessage}
          </div>
          <InputField
            labelText="Email:"
            ofInput={{
              name: 'email',
              type: 'text',
              required: true,
              pattern: inputRegex.email,
              value: props.getInputValue.email,
              onChange: (e) => props.setInputValue('email', e.target.value),
            }}
          />
          {props.useFields.password && (
            <InputField
              labelText="Password:"
              ofInput={{
                name: 'password',
                type: 'password',
                required: true,
                pattern: inputRegex.password(context.passwordLength),
                value: props.getInputValue.password,
                onChange: (e) =>
                  props.setInputValue('password', e.target.value),
              }}
            />
          )}
          {props.useFields.passConfirm && (
            <InputField
              labelText="Confirm:"
              ofInput={{
                name: 'password-confirm',
                type: 'password',
                required: true,
                pattern: inputRegex.password(context.passwordLength),
                value: props.getInputValue.passConfirm,
                onChange: (e) =>
                  props.setInputValue('passConfirm', e.target.value),
              }}
            />
          )}
        </>
      ),
      bottomContents: (props: InnerBottomProps) => (
        <context.bottomWrapper
          bottomContents={() => (
            <Bottom
              ofWhole={{
                bottomComponent: props.bottomComponent,
              }}
              ofSubmit={props.ofSubmit}
            />
          )}
        />
      ),
    });

    function resultComponent<T>(propsArg: FirebaseAuthOwnUI.Props<T>) {
      const props = assignProps({}, defaultProps, propsArg);

      const [getInputValue, setInputValue] = props.getInputValueAccessor();

      const onSubmit: () => OnSubmit = createMemo(() => {
        if (untrack(() => sessionState.isLoggedIn)) {
          return (e) => {
            e.preventDefault();
            console.log('Already Logged In');
            props.redirectToSuccessUrl();
          };
        }

        return props.submitAction({
          inputMode: props.inputMode(),
          passwordLength: context.passwordLength,
          redirectToSuccessUrl: props.redirectToSuccessUrl,
        });
      });

      createEffect(() => {
        props.clearSignal();
        setInputValue(
          ['password', 'passConfirm', 'infoMessage', 'errorMessage'],
          '',
        );
      });

      return (
        <FormComponent
          ofContainer={{
            containerProps: {
              ofForm: {
                onSubmit: onSubmit(),
                class: cn('content', 'frame'),
              },
              ofInternalContainer: {
                class: cn('content'),
              },
              ofInternalTitle: {
                class: cn('frame__header'),
              },
              ofInternalBody: {
                class: cn('frame__body'),
              },
            },
          }}
          ofInputFields={{
            getInputValue,
            setInputValue,
            useFields: props.useFields,
          }}
          ofBottomContents={{
            bottomComponent: props.wholeOfBottom,
            ofSubmit: props.submitButtonProps({
              disabled: sessionState.isLoggedIn,
            }),
          }}
        />
      );
    }

    return resultComponent;
  },
};

export declare module FirebaseAuthOwnUI {
  export interface Context {
    passwordLength?: number;
    bottomWrapper?: Component<{
      bottomContents: JSX.FunctionElement;
    }>;
  }
  export interface Props<T> {
    getInputValueAccessor?: () => InputValueAccessor;
    redirectToSuccessUrl: () => void;
    useFields: UseFieldsInfo;
    inputMode: () => T;
    clearSignal: () => unknown;
    wholeOfBottom: Component<LoginBasicBottom.BottomWholeProps>;
    submitButtonProps?: (disableWhenLoggedIn: {
      disabled: boolean;
    }) => JSX.InputHTMLAttributes<HTMLInputElement>;
    submitAction: (arg: {
      inputMode: T;
      passwordLength: number;
      redirectToSuccessUrl: () => void;
    }) => OnSubmit;
  }

  export interface UseFieldsInfo {
    email: boolean;
    password: boolean;
    passConfirm: boolean;
  }

  export interface InputValueState {
    scheme: {
      email: string;
      password: string;
      passConfirm: string;
      infoMessage: string;
      errorMessage: string;
    };
    getter: State<InputValueState>['scheme'];
    setter: SetStateFunction<InputValueState['scheme']>;
  }

  export type InputValueScheme = InputValueState['scheme'];

  export type InputValueAccessor = [
    InputValueState['getter'],
    InputValueState['setter'],
  ];
}
