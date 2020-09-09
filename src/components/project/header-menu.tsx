import { HeaderMenu } from '@components/cirrus/common/header-dropdown';
import { createMemo } from 'solid-js';
import { sessionState } from '@lib/solid-firebase-auth';

/* eslint-disable jsx-a11y/anchor-is-valid */
const createMenuItems = () =>
  createMemo(() => [
    () => <a>First Item</a>,
    () => <a>Second Item</a>,
    () => <a>Third Item</a>,
    () => <a>Fourth Item</a>,
    () => <div>{sessionState.isLoggedIn}</div>,
  ]);
/* eslint-enable jsx-a11y/anchor-is-valid */

const Component = HeaderMenu.createComponent();

const HeaderMenuComponent = () => {
  const menuItems = createMenuItems();

  return <Component menuItems={menuItems()} />;
};

export { HeaderMenuComponent as HeaderMenu };
