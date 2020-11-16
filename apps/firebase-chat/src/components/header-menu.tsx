import { HeaderMenu } from '@components/cirrus/common/header-dropdown';
import { createMemo } from 'solid-js';
import { sessionState } from '@lib/solid-firebase-auth';
import { buttonize, DO_NOTHING } from '@components/common/util/component-utils';
import clsx from 'clsx';
import { Cirrus } from '@components/common/typings/cirrus-style';

const createMenuItems = () =>
  createMemo(() => [
    () => <a {...buttonize(DO_NOTHING)}>First Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Second Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Third Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Fourth Item</a>,
    () => (
      <div
        class={clsx<Cirrus>('u-center')}
        {...(sessionState.loginState.isLoggedIn ? buttonize(DO_NOTHING) : {})}
      >
        {sessionState.loginState.isLoggedIn &&
          sessionState.currentUser?.email?.replace(/@.+$/, '')}
      </div>
    ),
  ]);

const Component = HeaderMenu.createComponent();

const HeaderMenuComponent = () => {
  const menuItems = createMenuItems();

  return <Component menuItems={menuItems()} />;
};

export { HeaderMenuComponent as HeaderMenu };
