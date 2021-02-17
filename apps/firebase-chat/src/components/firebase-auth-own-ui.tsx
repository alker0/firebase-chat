import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { FormBasicBottom } from '@components/common/cirrus/domain/form-basic-bottom';
import { OnlyOptional } from '@components/types/component-utils';
import {
  CallableSubmit,
  inputRegex,
  inputRegexSource,
} from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  Component,
  createComputed,
  createMemo,
  createState,
  SetStateFunction,
  State,
  JSX,
} from 'solid-js';

const cn: Clsx<Cirrus> = clsx;

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

interface OuterBottomProps extends FormBasicBottom.BottomWholeProps {
  // eslint-disable-next-line react/no-unused-prop-types
  bottomComponent: Component<FormBasicBottom.BottomWholeProps>;
}

interface InnerBottomProps extends FormBasicBottom.BottomWholePropsOpts {
  bottomComponent: Component<FormBasicBottom.BottomWholeProps>;
  ofSubmit: JSX.InputHTMLAttributes<HTMLInputElement>;
}

// button.animated.btn-info.outline
const Bottom = FormBasicBottom.createComponent({
  whole: (props: OuterBottomProps) => (
    <props.bottomComponent submitButton={props.submitButton} />
  ),
});

interface ContainerProps {
  ofForm?: JSX.FormHTMLAttributes<HTMLFormElement>;
  ofInternalContainer?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalTitle?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalBody?: JSX.HTMLAttributes<HTMLDivElement>;
  children?: JSX.HTMLAttributes<HTMLElement>['children'];
}

interface InputProps extends FirebaseAuthOwnUI.FormStateAccessor {
  useFields: {
    email: boolean;
    password: boolean;
    passConfirm: boolean;
  };
}

export const defaultContext: Required<FirebaseAuthOwnUI.Context> = {
  passwordRegex: inputRegex.password(6),
  bottomWrapper: (props) => props.bottomContents,
};

const defaultProps: Required<OnlyOptional<FirebaseAuthOwnUI.Props<unknown>>> = {
  createFormState: () =>
    createState<FirebaseAuthOwnUI.FormState['scheme']>({
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
            {props.formState.infoMessage}
          </div>
          <div class={cn('u-text-center', 'text-danger')}>
            {props.formState.errorMessage}
          </div>
          <InputField
            labelText="Email:"
            ofInput={{
              name: 'email',
              id: 'input-email',
              type: 'text',
              required: true,
              pattern: inputRegexSource.email,
              value: props.formState.email,
              onChange: (e) => props.setFormState('email', e.target.value),
            }}
          />
          {props.useFields.password && (
            <InputField
              labelText="Password:"
              ofInput={{
                name: 'password',
                id: 'input-password',
                type: 'password',
                required: true,
                pattern: context.passwordRegex.source,
                value: props.formState.password,
                onChange: (e) => props.setFormState('password', e.target.value),
              }}
            />
          )}
          {props.useFields.passConfirm && (
            <InputField
              labelText="Confirm:"
              ofInput={{
                name: 'password-confirm',
                id: 'input-password-confirm',
                type: 'password',
                required: true,
                pattern: context.passwordRegex.source,
                value: props.formState.passConfirm,
                onChange: (e) =>
                  props.setFormState('passConfirm', e.target.value),
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

      const [formState, setFormState] = props.createFormState();

      const onSubmit: () => CallableSubmit = createMemo(() => {
        if (sessionState.isActuallyLoggedIn) {
          return (e) => {
            e.preventDefault();
            console.log('Already Logged In');
            props.redirectToSuccessUrl();
          };
        }

        return props.submitAction({
          inputMode: props.inputMode(),
          passwordRegex: context.passwordRegex,
          redirectToSuccessUrl: props.redirectToSuccessUrl,
        });
      });

      createComputed(() => {
        props.clearSignal();
        setFormState(['password', 'passConfirm', 'errorMessage'], '');
      });

      return (
        <FormComponent
          ofContainer={{
            containerProps: {
              ofForm: {
                get onSubmit() {
                  return onSubmit();
                },
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
            formState,
            setFormState,
            useFields: props.useFields,
          }}
          ofBottomContents={{
            bottomComponent: props.wholeOfBottom,
            ofSubmit: props.submitButtonProps({
              disabled: sessionState.isActuallyLoggedIn,
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
    passwordRegex?: RegExp;
    bottomWrapper?: Component<{
      bottomContents: JSX.FunctionElement;
    }>;
  }
  export interface Props<T> {
    createFormState?: () => FormStateAccessorTuple;
    redirectToSuccessUrl: () => void;
    useFields: UseFieldsInfo;
    inputMode: () => T;
    clearSignal: () => unknown;
    wholeOfBottom: Component<FormBasicBottom.BottomWholeProps>;
    submitButtonProps?: (disableWhenLoggedIn: {
      disabled: boolean;
    }) => JSX.InputHTMLAttributes<HTMLInputElement>;
    submitAction: (arg: {
      inputMode: T;
      passwordRegex: RegExp;
      redirectToSuccessUrl: () => void;
    }) => CallableSubmit;
  }

  export interface UseFieldsInfo {
    email: boolean;
    password: boolean;
    passConfirm: boolean;
  }

  export interface FormState {
    scheme: {
      email: string;
      password: string;
      passConfirm: string;
      infoMessage: string;
      errorMessage: string;
    };
    getter: State<FormState>['scheme'];
    setter: SetStateFunction<FormState['scheme']>;
  }

  export type FormStateScheme = FormState['scheme'];

  export type FormStateAccessorTuple = [
    FormState['getter'],
    FormState['setter'],
  ];

  export interface FormStateAccessor {
    formState: FormState['getter'];
    setFormState: FormState['setter'];
  }
}
