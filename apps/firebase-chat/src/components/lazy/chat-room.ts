import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import type { ChatRoom } from '../chat-room';

export type { ChatRoom };

export const createLazyChatRoom = (context: ChatRoom.Context) => {
  return createLazyComponent(
    () => import('../chat-room'),
    (resolved) => resolved.ChatRoom.createComponent(context),
  );
};
