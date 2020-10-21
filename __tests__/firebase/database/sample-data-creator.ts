import { database } from '@firebase/rules-unit-testing';

type TimeStamp = number | Object;

export interface PropertiesMap {
  'rooms-exsists': boolean;
  'rooms-key/owner_id': string;
  'rooms-key/own_room_id': string;
  'rooms/public_info/room_id': string;
  'rooms/public_info/allowed_users': Partial<Record<string, boolean>>;
  'rooms/public_info/allowed_users_count': number;
  'rooms/password': string;
  'rooms/created_at': TimeStamp;
  'room_entrancess-exsists': boolean;
  'room_entrances-key/room_id': string;
  'room_entrances/owner_id': string;
  'room_entrances/own_room_id': string;
  'room_entrances/room_name': string;
  'room_entrances/members_count': number;
  'room_entrances/created_at': TimeStamp;
  'entry_requests-exsists': boolean;
  'entry_requests-key/room_id': string;
  'entry_requests-key/user_id': string;
  'entry_requests/password': string;
  'delete_marks-exsists': boolean;
  'delete_marks-key/room_id': string;
  'delete_marks/value': false;
}

export type PropertyAddress = keyof PropertiesMap;

export interface SampleDataCreateOption {
  overrides?: Partial<Record<PropertyAddress, any>>;
}

const sampleValues = {
  roomId: '101',
  password: 'foo',
  createdAtMin: 0,
  createdAtMax: database.ServerValue.TIMESTAMP,
  now: database.ServerValue.TIMESTAMP,
  ownRoomIdMin: (1).toString(),
  ownRoomIdMax: (3).toString(),
  allowedUsersEmpty: {},
  allowedUsersOneTrue: { baz: true },
  allowedUsersOneFalse: { baz: true },
};

export function getSampleDataCreator(userUid: string) {
  const validProperties: PropertiesMap = {
    'rooms-exsists': true,
    'rooms-key/owner_id': userUid,
    'rooms-key/own_room_id': sampleValues.ownRoomIdMin,
    'rooms/public_info/room_id': sampleValues.roomId,
    'rooms/public_info/allowed_users': sampleValues.allowedUsersEmpty,
    'rooms/public_info/allowed_users_count': 0,
    'rooms/password': sampleValues.password,
    'rooms/created_at': sampleValues.now,
    'room_entrancess-exsists': true,
    'room_entrances-key/room_id': sampleValues.roomId,
    'room_entrances/owner_id': userUid,
    'room_entrances/own_room_id': sampleValues.ownRoomIdMin,
    'room_entrances/room_name': 'bar',
    'room_entrances/members_count': 1,
    'room_entrances/created_at': sampleValues.now,
    'entry_requests-exsists': false,
    'entry_requests-key/room_id': sampleValues.roomId,
    'entry_requests-key/user_id': userUid,
    'entry_requests/password': sampleValues.password,
    'delete_marks-exsists': false,
    'delete_marks-key/room_id': sampleValues.roomId,
    'delete_marks/value': false,
  };

  function createSampleData(option: SampleDataCreateOption = {}) {
    const { overrides: invalidProperties = {} } = option;
    const invalidKeys = Object.keys(invalidProperties) as PropertyAddress[];

    function getSampleValue(targetKey: PropertyAddress) {
      if (invalidKeys.includes(targetKey)) {
        return invalidProperties[targetKey];
      } else {
        return validProperties[targetKey];
      }
    }
    const gsv = getSampleValue;

    function getPropertiyIfExsists<T>(
      exsistsKey: PropertyAddress,
      propertyKey: string,
      propertyValue: T,
    ): { [propertyName: string]: T } | {} {
      if (gsv(exsistsKey)) {
        return {
          [propertyKey]: propertyValue,
        };
      } else {
        return {};
      }
    }

    return {
      ...getPropertiyIfExsists(
        'rooms-exsists',
        `rooms/${gsv('rooms-key/owner_id')}/${gsv('rooms-key/own_room_id')}`,
        {
          public_info: {
            room_id: gsv('rooms/public_info/room_id'),
            allowed_users: gsv('rooms/public_info/allowed_users'),
            allowed_users_count: gsv('rooms/public_info/allowed_users_count'),
          },
          password: gsv('rooms/password'),
          created_at: gsv('rooms/created_at'),
        },
      ),
      ...getPropertiyIfExsists(
        'room_entrancess-exsists',
        `room_entrances/${gsv('room_entrances-key/room_id')}`,
        {
          owner_id: gsv('room_entrances/owner_id'),
          own_room_id: gsv('room_entrances/own_room_id'),
          room_name: gsv('room_entrances/room_name'),
          members_count: gsv('room_entrances/members_count'),
          created_at: gsv('room_entrances/created_at'),
        },
      ),
      ...getPropertiyIfExsists(
        'entry_requests-exsists',
        `entry_requests/${gsv('entry_requests-key/room_id')}/${gsv(
          'entry_requests-key/user_id',
        )}`,
        {
          password: gsv('entry_requests/password'),
        },
      ),
      ...getPropertiyIfExsists(
        'delete_marks-exsists',
        `delete_marks/${gsv('delete_marks-key/room_id')}`,
        gsv('delete_marks/value'),
      ),
    };
  }

  return createSampleData;
}
