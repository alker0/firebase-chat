import { roomsEditTest } from './rooms-edit-test';
import { roomMembersTest } from './room-members-test';
import { roomsQueryTest } from './rooms-query-test';

describe('firebase database test', () => {
  roomsEditTest();
  roomMembersTest();
  roomsQueryTest();
});
