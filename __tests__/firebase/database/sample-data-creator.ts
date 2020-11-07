import { database } from '@firebase/rules-unit-testing';

export type RootKeyMap<T extends string> = Record<T, string>;

export interface RootKeyMapCreator<T extends unknown, U extends string> {
  (creatorArg: T): RootKeyMap<U>;
}

export interface RootKeyMapModifier<T extends unknown, U extends string> {
  (modifierArg: T): Partial<RootKeyMap<U>>;
}

interface RootKeyObjectCreator<T extends string> {
  (targetKey: T, propertyValue: unknown): Object;
}

export interface RootKeyPropSwitcher<T extends string, U extends string> {
  <R>(exsistsKey: U, propertyKey: T, propertyValue: R):
    | { [propertyName: string]: R }
    | {};
}

export type DatabasePrimitive = string | number | boolean | null;

export type DatabaseValue =
  | DatabasePrimitive
  | DatabasePrimitive[]
  | Object
  | {
      [key: string]: typeof key extends string ? DatabaseValue : never;
    };

export interface SampleDataCreateRunner<
  T extends unknown,
  U extends string,
  V extends string
> {
  (rootKeyPropSwitcher: RootKeyPropSwitcher<U, V>, rootKeyMapArg: T): Record<
    string,
    DatabaseValue
  >;
}

export type RootKeyExsistsMap<T extends string> = Record<T, boolean>;

export interface CreateSampleDataOption<
  T extends unknown = unknown,
  U extends string = string,
  V extends string = string
> {
  rootKeyMapArg: T;
  mode?: 'set' | 'update';
  rootKeyExsistsMap: RootKeyExsistsMap<V>;
  rootKeyMapCreator: RootKeyMapCreator<T, U>;
  rootKeyMapModifier?: RootKeyMapModifier<T, U>;
  createRunner: SampleDataCreateRunner<T, U, V>;
  // startPoint?: string;
}

function getRootKeyPropSwitcher<T extends string, U extends string>(
  rootKeyExsistsMap: RootKeyExsistsMap<U>,
  createRootKeyObject: RootKeyObjectCreator<T>,
): RootKeyPropSwitcher<T, U> {
  return (exsistsKey, propertyKey, propertyValue) => {
    if (rootKeyExsistsMap[exsistsKey]) {
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
  return function createFixed(
    fixInfoListFn: (rootKeyMap: RootKeyMap<T>) => Array<[string[], any]>,
  ) {
    const fixInfoList = fixInfoListFn(rootKeyMap);
    function isLastAddress(index: number, addressesLength: number) {
      return addressesLength - 1 <= index;
    }
    return fixInfoList.reduce(
      (prevResult, [propAddresses, propertyValue]) => {
        const propAddressesLength = propAddresses.length;
        if (propAddressesLength < 1) return prevResult;

        // console.log(propAddresses, typeof propAddresses);
        return propAddresses.reduce(
          ({ currentRef, result }, address, index) => {
            let nextRef = {};
            /* eslint-disable no-param-reassign */
            if (isLastAddress(index, propAddressesLength)) {
              currentRef[address] = propertyValue;
            } else {
              const currentAddressValue = currentRef[address];
              if (typeof currentAddressValue === 'object') {
                nextRef = { ...currentAddressValue };
              }
              currentRef[address] = nextRef;
            }
            /* eslint-enable no-param-reassign */
            return {
              currentRef: nextRef,
              result,
            };
          },
          {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            currentRef: prevResult,
            result: prevResult,
          },
        ).result;
      },
      { ...sampleData } as Record<string, any>,
    );
  };
}

export function createSampleData<
  T extends unknown,
  U extends string,
  V extends string
>({
  rootKeyMapArg,
  mode = 'update',
  rootKeyExsistsMap,
  rootKeyMapCreator,
  rootKeyMapModifier = () => ({}),
  createRunner,
}: CreateSampleDataOption<T, U, V>) {
  const rootKeyMap = {
    ...rootKeyMapCreator(rootKeyMapArg),
    ...rootKeyMapModifier(rootKeyMapArg),
  };

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
    rootKeyExsistsMap,
    createRootKeyObject,
  );

  const sampleData = createRunner(rootKeyPropSwitcher, rootKeyMapArg);

  const createFixed = getFixedCreator(sampleData, rootKeyMap);

  return {
    sampleData,
    rootKeyMap,
    createFixed,
  };
}

export function createSampleDataCreator<
  T extends unknown,
  U extends string,
  V extends string,
  W extends CreateSampleDataOption<T, U, V> = CreateSampleDataOption<T, U, V>
>({
  rootKeyExsistsMap,
  rootKeyMapCreator,
  createRunner,
}: Pick<W, 'rootKeyExsistsMap' | 'rootKeyMapCreator' | 'createRunner'>) {
  return (
    option: Partial<Omit<W, 'rootKeyMapArg'>> & Pick<W, 'rootKeyMapArg'>,
  ) =>
    createSampleData({
      ...option,
      rootKeyMapArg: option.rootKeyMapArg,
      rootKeyExsistsMap: option.rootKeyExsistsMap ?? rootKeyExsistsMap,
      rootKeyMapCreator: option.rootKeyMapCreator ?? rootKeyMapCreator,
      createRunner: option.createRunner ?? createRunner,
    });
}

export type PropertyExsistsOfTalker =
  | 'exsists-rooms/public_info'
  | 'exsists-room_entrances'
  | 'exsists-room_members_info/password'
  | 'exsists-room_members_info/requesting';

export type PropertyKeysOfTalker =
  | 'key-rooms/owner_id'
  | 'key-rooms/own_room_id'
  | 'key-rooms/public_info'
  | 'key-room_entrances'
  | 'key-room_members/room_id'
  | 'key-room_members/password'
  | 'key-room_members/requesting/user_id'
  | 'key-room_members/accepted/user_id'
  | 'key-room_members/denied';

export const defaultSampleOfTalker = {
  ownRoomIdMin: (0).toString(),
  roomName: 'foo',
  membersCountMin: 1,
  password: 'bar',
  requestUser: 'baz',
  now: database.ServerValue.TIMESTAMP,
};

export const createSampleDataCreatorForTalker = createSampleDataCreator<
  { userUid: string; ownRoomId?: string | number; roomId: string | null },
  PropertyKeysOfTalker,
  PropertyExsistsOfTalker
>({
  rootKeyExsistsMap: {
    'exsists-rooms/public_info': true,
    'exsists-room_entrances': true,
    'exsists-room_members_info/password': true,
    'exsists-room_members_info/requesting': false,
  },
  rootKeyMapCreator: ({
    userUid,
    ownRoomId = defaultSampleOfTalker.ownRoomIdMin,
    roomId,
  }) => {
    const roomsOwnerIdValue = `rooms/${userUid}`;
    const roomsOwnRoomIdValue = `${roomsOwnerIdValue}/${ownRoomId}`;
    const roomsPublicInfoKey = `${roomsOwnRoomIdValue}/public_info`;
    const roomMembersRoomIdValue = `room_members_info/${roomId}`;
    const requestUserIdValue = defaultSampleOfTalker.requestUser;
    const rootKeyMap: Record<PropertyKeysOfTalker, string> = {
      'key-rooms/owner_id': roomsOwnerIdValue,
      'key-rooms/own_room_id': roomsOwnRoomIdValue,
      'key-rooms/public_info': roomsPublicInfoKey,
      'key-room_entrances': `room_entrances/${roomId}`,
      'key-room_members/room_id': roomMembersRoomIdValue,
      'key-room_members/password': `${roomMembersRoomIdValue}/requesting/password`,
      'key-room_members/requesting/user_id': `${roomMembersRoomIdValue}/requesting/${requestUserIdValue}`,
      'key-room_members/accepted/user_id': `${roomMembersRoomIdValue}/accepted/${requestUserIdValue}`,
      'key-room_members/denied': `${roomMembersRoomIdValue}/denied`,
    };
    return rootKeyMap;
  },
  createRunner: (
    rootKeyPropSwitcher,
    { userUid, ownRoomId = defaultSampleOfTalker.ownRoomIdMin, roomId },
  ) => {
    return {
      ...rootKeyPropSwitcher(
        'exsists-rooms/public_info',
        'key-rooms/public_info',
        { room_id: roomId },
      ),
      ...rootKeyPropSwitcher('exsists-room_entrances', 'key-room_entrances', {
        owner_id: userUid,
        own_room_id: ownRoomId,
        room_name: defaultSampleOfTalker.roomName,
        members_count: defaultSampleOfTalker.membersCountMin,
        created_at: defaultSampleOfTalker.now,
      }),
      ...rootKeyPropSwitcher(
        'exsists-room_members_info/password',
        'key-room_members/password',
        defaultSampleOfTalker.password,
      ),
      ...rootKeyPropSwitcher(
        'exsists-room_members_info/requesting',
        'key-room_members/requesting/user_id',
        {
          password: defaultSampleOfTalker.password,
        },
      ),
    };
  },
});
