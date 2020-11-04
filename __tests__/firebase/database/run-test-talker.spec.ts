import { roomsEditTest } from './rooms-edit-test';
import { roomMembersTest } from './room-members-test';

describe('firebase database test', () => {
  roomsEditTest();
  roomMembersTest();
});
