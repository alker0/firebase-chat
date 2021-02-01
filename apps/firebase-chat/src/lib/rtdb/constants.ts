export const RTDB_KEY_ROOM_ENTRANCES = 'room_entrances';
export const RTDB_KEY_OWNER_ID = 'owner_id';
export const RTDB_KEY_OWN_ROOM_ID = 'own_room_id';
export const RTDB_KEY_ROOM_NAME = 'room_name';
export const RTDB_KEY_ROOM_MEMBERS_COUNT = 'members_count';
export const RTDB_KEY_CREATED_AT = 'created_at';

export const RTDB_KEY_ROOM_MEMBERS_INFO = 'room_members_info';
export const RTDB_KEY_REQUESTING = 'requesting';
export const RTDB_KEY_ACCEPTED = 'accepted';
export const RTDB_KEY_DENIED = 'denied';
export const RTDB_KEY_PASSWORD = 'password';

export const RTDB_DATA_LIMIT_OWN_ROOMS_MAX_COUNT = 3;
export const RTDB_DATA_LIMIT_PASSWORD_MAX_LENGTH = 20;
export const RTDB_DATA_LIMIT_ROOM_NAME_MAX_LENGTH = 20;

export const RTDB_DATA_LIMIT_ROOM_MEMBERS_MAX_COUNT = 100000;

export const RTDB_QUERY_COUNT_LIMIT_OWN_ROOMS = RTDB_DATA_LIMIT_OWN_ROOMS_MAX_COUNT;
export const RTDB_QUERY_COUNT_LIMIT_ENTRANCES = 10;

export const RTDB_QUERY_MAX_LIMIT_ROOM_MEMBERS_COUNT = RTDB_DATA_LIMIT_ROOM_MEMBERS_MAX_COUNT;

export interface RequestingDataSchema extends Record<string, string> {
  password: string;
}

export type RoomMembersInfoKey =
  | typeof RTDB_KEY_REQUESTING
  | typeof RTDB_KEY_ACCEPTED
  | typeof RTDB_KEY_DENIED;

export interface RoomMembersInfoSchema {
  [RTDB_KEY_REQUESTING]: Record<string, string>;
  [RTDB_KEY_ACCEPTED]: Record<string, boolean>;
  [RTDB_KEY_DENIED]: Record<string, boolean>;
}
