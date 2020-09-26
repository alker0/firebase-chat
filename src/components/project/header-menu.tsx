import { HeaderMenu } from '@components/cirrus/common/header-dropdown';
import { createMemo } from 'solid-js';
import { sessionState } from '@lib/solid-firebase-auth';
import { buttonize, DO_NOTHING } from '@components/common/util/component-utils';

const createMenuItems = () =>
  createMemo(() => [
    () => <a {...buttonize(DO_NOTHING)}>First Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Second Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Third Item</a>,
    () => <a {...buttonize(DO_NOTHING)}>Fourth Item</a>,
    () => <div>{sessionState.isLoggedIn}</div>,
  ]);

const Component = HeaderMenu.createComponent();

const HeaderMenuComponent = () => {
  const menuItems = createMenuItems();

  return <Component menuItems={menuItems()} />;
};

export { HeaderMenuComponent as HeaderMenu };
