import { HeaderMenu } from '@components/common/cirrus/common/header-dropdown';
import { buttonize } from '@components/common/util/component-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import { DO_NOTHING } from '@lib/common-utils';
import { Cirrus } from '@alker/cirrus-types';
import clsx from 'clsx';
import { createMemo } from 'solid-js';

const createMenuItems = () =>
  createMemo(() => [
    () => <a {...buttonize(DO_NOTHING)}>First Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Second Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Third Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Fourth Item</a>,
    () => (
      <div
        class={clsx<Cirrus>('u-center')}
        {...(sessionState.isActuallyLoggedIn ? buttonize(DO_NOTHING) : {})}
      >
        {sessionState.isActuallyLoggedIn &&
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
