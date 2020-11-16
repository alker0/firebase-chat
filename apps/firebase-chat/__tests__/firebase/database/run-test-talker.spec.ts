import { roomsEditTest } from './rooms-edit-test';
import { roomMembersTest } from './room-members-test';
import { roomsQueryTest } from './rooms-query-test';
import { cleanup } from './test-setup-talker';

describe('firebase database test', () => {
  afterAll(cleanup);
  roomsEditTest();
  roomMembersTest();
  roomsQueryTest();
});
