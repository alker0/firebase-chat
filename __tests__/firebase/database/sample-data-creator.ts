import { database } from '@firebase/rules-unit-testing';

export type DateOffsetUnit =
  | 'milli'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week';

export function getDateWithOffset(
  offsetInfo: Partial<Record<DateOffsetUnit, number>>,
) {
  const offsetMap: Record<
    DateOffsetUnit,
    (value: number | undefined) => number
  > = {
    milli: (value: number = 0) => value,
    get second() {
      return (value: number = 0) => value * 1000;
    },
    get minute() {
      return (value: number = 0) => offsetMap.second(value * 60);
    },
    get hour() {
      return (value: number = 0) => offsetMap.minute(value * 60);
    },
    get day() {
      return (value: number = 0) => offsetMap.hour(value * 24);
    },
    get week() {
      return (value: number = 0) => offsetMap.day(value * 7);
    },
  };
  return (
    new Date().getTime() +
    Object.entries(offsetInfo).reduce(
      (accum, [unitName, unitValue]) =>
        accum + offsetMap[unitName as DateOffsetUnit](unitValue),
      0,
    )
  );
}

type TimeStamp = number | Object;

export type PropertyModifies<T extends Object> = Partial<Record<keyof T, any>>;

export interface ValidPropertiesFunction<T> {
  (userUid: string): T;
}

export interface SampleValueGetter<T> {
  (targetKey: keyof T): string;
}

export type RootKeyMap<T extends string> = Record<T, string>;

export interface RootKeyMapCreator<T extends Object, U extends string> {
  (getSampleValue: SampleValueGetter<T>): RootKeyMap<U>;
}

interface RootKeyObjectCreator<T extends string> {
  (targetKey: T, propertyValue: unknown): Object;
}

export interface RootKeyPropSwitcher<T, U extends string> {
  <R>(exsistsKey: keyof T, propertyKey: U, propertyValue: R):
    | { [propertyName: string]: R }
    | {};
}

export type DatabasePrimitive = string | number | boolean;

export type DatabaseValue =
  | DatabasePrimitive
  | DatabasePrimitive[]
  | {
      [key: string]: typeof key extends string ? DatabaseValue : never;
    };

export interface SampleDataCreateRunner<T, U extends string> {
  (
    getSampleValue: SampleValueGetter<T>,
    rootKeyPropSwitcher: RootKeyPropSwitcher<T, U>,
  ): Record<string, DatabaseValue>;
}

export interface CreateSampleDataOption<
  T extends Object,
  U extends string = string
> {
  userUid?: string;
  mode?: 'set' | 'update';
  modifies?: PropertyModifies<T>;
  validPropertiesFn: ValidPropertiesFunction<T>;
  rootKeyMapCreator: RootKeyMapCreator<T, U>;
  createRunner: SampleDataCreateRunner<T, U>;
  // startPoint?: string;
}

function getRootKeyPropSwitcher<T, U extends string>(
  createRootKeyObject: RootKeyObjectCreator<U>,
  getSampleValue: SampleValueGetter<T>,
): RootKeyPropSwitcher<T, U> {
  return (exsistsKey, propertyKey, propertyValue) => {
    if (getSampleValue(exsistsKey)) {
      return createRootKeyObject(propertyKey, propertyValue);
    } else {
      return {};
    }
  };
}

function getFixedCreator<T extends string>(
  sampleData: Record<string, DatabaseValue>,
  rootKeyMap: RootKeyMap<T>,
) {
  function createFixed(
    fixInfoListFn: (rootKeyMap: RootKeyMap<T>) => [string[], any][],
  ) {
    const fixInfoList = fixInfoListFn(rootKeyMap);
    return {
      ...sampleData,
      ...fixInfoList.reduce((prevResult, [propAddresses, propertyValue]) => {
        if (propAddresses.length < 1) return prevResult;
        function isLastAddress(index: number, addresses: unknown[]) {
          return addresses.length - 1 <= index;
        }

        return propAddresses.reduce(
          ({ srcRef, resultRefGetter, result }, address, index, addresses) => {
            const currentResultRef = resultRefGetter(address);
            let nextSrcRef = {};
            let nextResultRefGetter: typeof resultRefGetter = () => ({});
            /* eslint-disable no-param-reassign */
            if (isLastAddress(index, addresses)) {
              currentResultRef[address] = propertyValue;
            } else {
              const srcValue = srcRef[address];
              if (typeof srcValue === 'object') {
                nextSrcRef = srcValue;
                nextResultRefGetter = (nextAddress: string) => {
                  const nextResultRef = {
                    ...srcValue,
                    [nextAddress]: {},
                  };
                  currentResultRef[address] = nextResultRef;
                  return nextResultRef;
                };
              }
            }
            /* eslint-enable no-param-reassign */
            return {
              srcRef: nextSrcRef,
              resultRefGetter: nextResultRefGetter,
              result,
            };
          },
          {
            srcRef: sampleData,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            resultRefGetter: (nextAddress: string) => prevResult,
            result: prevResult,
          },
        ).result;
      }, {} as Record<string, any>),
    };
  }
  return createFixed;
}

export function createSampleData<T extends Object, U extends string = string>({
  userUid = 'sampleUser',
  mode = 'update',
  modifies: modifyProperties = {},
  validPropertiesFn,
  rootKeyMapCreator,
  createRunner,
}: CreateSampleDataOption<T, U>) {
  type PropertyAddressKeys = keyof T;

  const modifyPropertyKeys = Object.keys(
    modifyProperties,
  ) as PropertyAddressKeys[];

  const validProperties = validPropertiesFn(userUid);

  function getSampleValue(targetKey: PropertyAddressKeys) {
    if (modifyPropertyKeys.includes(targetKey)) {
      return modifyProperties[targetKey];
    } else {
      return validProperties[targetKey];
    }
  }

  const rootKeyMap = rootKeyMapCreator(getSampleValue);

  let createRootKeyObject: RootKeyObjectCreator<U>;
  if (mode === 'set') {
    createRootKeyObject = (targetKey, propertyValue) => {
      const emptyObject: Record<string, unknown> = {};
      const [resultObject] = rootKeyMap[targetKey].split('/').reduce(
        (accum, key, index, splitted) => {
          const [resultAccum, currentRef] = accum;
          if (index < splitted.length - 1) {
            currentRef[key] = propertyValue;
            return [resultAccum, {}];
          } else {
            const nextRef = {};
            currentRef[key] = nextRef;
            return [resultAccum, nextRef];
          }
        },
        [emptyObject, emptyObject],
      );
      return resultObject;
    };
  } else {
    createRootKeyObject = (targetKey, propertyValue) => ({
      [rootKeyMap[targetKey]]: propertyValue,
    });
  }

  const rootKeyPropSwitcher = getRootKeyPropSwitcher(
    createRootKeyObject,
    getSampleValue,
  );

  const sampleData = createRunner(getSampleValue, rootKeyPropSwitcher);

  const createFixed = getFixedCreator(sampleData, rootKeyMap);

  return {
    sampleData,
    createFixed,
  };
}

export function createSampleDataCreator<
  T extends Object,
  U extends string = string
>({
  validPropertiesFn,
  rootKeyMapCreator,
  createRunner,
}: Pick<
  CreateSampleDataOption<T, U>,
  'validPropertiesFn' | 'rootKeyMapCreator' | 'createRunner'
>) {
  return (option: Partial<CreateSampleDataOption<T, U>> = {}) =>
    createSampleData({
      ...option,
      validPropertiesFn: option.validPropertiesFn ?? validPropertiesFn,
      rootKeyMapCreator: option.rootKeyMapCreator ?? rootKeyMapCreator,
      createRunner: option.createRunner ?? createRunner,
    });
}

export interface PropertiesModifyMapOfTalker {
  'rooms-exsists': boolean;
  'rooms-key/owner_id': string;
  'rooms-key/own_room_id': string;
  'rooms/public_info/room_id': string;
  'rooms/public_info/allowed_users': Partial<Record<string, boolean>>;
  'rooms/public_info/allowed_users_count': number;
  'rooms/password': string;
  'rooms/created_at': TimeStamp;
  'room_entrances-exsists': boolean;
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

export type PropertyKeysOfTalker = keyof Pick<
  PropertiesModifyMapOfTalker,
  | 'rooms-key/owner_id'
  | 'rooms-key/own_room_id'
  | 'room_entrances-key/room_id'
  | 'entry_requests-key/room_id'
  | 'entry_requests-key/user_id'
  | 'delete_marks-key/room_id'
>;

export type ModifyPropertiesOfTalker = keyof PropertiesModifyMapOfTalker;

export interface SampleDataCreateOption {
  modifies?: Partial<Record<ModifyPropertiesOfTalker, any>>;
}

export const sampleValuesOfTalker = {
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

export const createSampleDataCreatorForTalker = createSampleDataCreator<
  PropertiesModifyMapOfTalker,
  PropertyKeysOfTalker
>({
  validPropertiesFn: (userUid: string) => ({
    'rooms-exsists': true,
    'rooms-key/owner_id': userUid,
    'rooms-key/own_room_id': sampleValuesOfTalker.ownRoomIdMin,
    'rooms/public_info/room_id': sampleValuesOfTalker.roomId,
    'rooms/public_info/allowed_users': sampleValuesOfTalker.allowedUsersEmpty,
    'rooms/public_info/allowed_users_count': 0,
    'rooms/password': sampleValuesOfTalker.password,
    'rooms/created_at': sampleValuesOfTalker.now,
    'room_entrances-exsists': true,
    'room_entrances-key/room_id': sampleValuesOfTalker.roomId,
    'room_entrances/owner_id': userUid,
    'room_entrances/own_room_id': sampleValuesOfTalker.ownRoomIdMin,
    'room_entrances/room_name': 'bar',
    'room_entrances/members_count': 1,
    'room_entrances/created_at': sampleValuesOfTalker.now,
    'entry_requests-exsists': false,
    'entry_requests-key/room_id': sampleValuesOfTalker.roomId,
    'entry_requests-key/user_id': userUid,
    'entry_requests/password': sampleValuesOfTalker.password,
    'delete_marks-exsists': false,
    'delete_marks-key/room_id': sampleValuesOfTalker.roomId,
    'delete_marks/value': false,
  }),
  rootKeyMapCreator: (getSampleValue) => {
    const gsv = getSampleValue;
    const roomsOwnerIdKey: PropertyKeysOfTalker = 'rooms-key/owner_id';
    const roomsOwnerIdValue = `rooms/${gsv(roomsOwnerIdKey)}`;
    const roomsOwnRoomIdKey: PropertyKeysOfTalker = 'rooms-key/own_room_id';
    const roomEntrancesRoomId: PropertyKeysOfTalker =
      'room_entrances-key/room_id';
    const entryRequestsRoomIdKey: PropertyKeysOfTalker =
      'entry_requests-key/room_id';
    const entryRequestsRoomIdValue = `entry_requests/${gsv(
      entryRequestsRoomIdKey,
    )}`;
    const entryRequestsUserIdKey: PropertyKeysOfTalker =
      'entry_requests-key/user_id';
    const deleteMarksRoomIdKey: PropertyKeysOfTalker =
      'delete_marks-key/room_id';
    const rootKeyMap: Record<PropertyKeysOfTalker, string> = {
      [roomsOwnerIdKey]: roomsOwnerIdValue,
      [roomsOwnRoomIdKey]: `${roomsOwnerIdValue}/${gsv(roomsOwnRoomIdKey)}`,
      [roomEntrancesRoomId]: `room_entrances/${gsv(roomEntrancesRoomId)}`,
      [entryRequestsRoomIdKey]: entryRequestsRoomIdValue,
      [entryRequestsUserIdKey]: `${entryRequestsRoomIdValue}/${gsv(
        entryRequestsUserIdKey,
      )}`,
      [deleteMarksRoomIdKey]: `delete_marks/${gsv(deleteMarksRoomIdKey)}`,
    };
    return rootKeyMap;
  },
  createRunner: (getSampleValue, rootKeyPropSwitcher) => {
    const gsv = getSampleValue;
    return {
      ...rootKeyPropSwitcher('rooms-exsists', 'rooms-key/own_room_id', {
        public_info: {
          room_id: gsv('rooms/public_info/room_id'),
          allowed_users: gsv('rooms/public_info/allowed_users'),
          allowed_users_count: gsv('rooms/public_info/allowed_users_count'),
        },
        password: gsv('rooms/password'),
        created_at: gsv('rooms/created_at'),
      }),
      ...rootKeyPropSwitcher(
        'room_entrances-exsists',
        'room_entrances-key/room_id',
        {
          owner_id: gsv('room_entrances/owner_id'),
          own_room_id: gsv('room_entrances/own_room_id'),
          room_name: gsv('room_entrances/room_name'),
          members_count: gsv('room_entrances/members_count'),
          created_at: gsv('room_entrances/created_at'),
        },
      ),
      ...rootKeyPropSwitcher(
        'entry_requests-exsists',
        'entry_requests-key/user_id',
        {
          password: gsv('entry_requests/password'),
        },
      ),
      ...rootKeyPropSwitcher(
        'delete_marks-exsists',
        'delete_marks-key/room_id',
        gsv('delete_marks/value'),
      ),
    };
  },
});
