import {
  read,
  write,
  validate,
  indexOn,
  root,
  data,
  newData,
  auth,
  query,
  now,
  ruleValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ruleJoin,
  bracket,
  indexOnChild,
  createRuleObject,
  ruleRef,
  RuleValue,
  RuleRef,
} from '@alker/rtdb-rules-builder';

const whenCreate = ruleValue(`!${data.exists()}`);
const whenDelete = ruleValue(`!${newData.exists()}`);
const whenNotCreate = data.exists();
const whenNotDelete = newData.exists();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const whenUpdate = ruleValue(`${data.exists()} && ${newData.exists()}`);

const newDataIsObject = ruleValue(
  `!(${newData.isBoolean()} || ${newData.isNumber()} || ${newData.isString()})`,
);

const $roomId = ruleValue('$room_id');
const $ownerId = ruleValue('$owner_id');
const $ownRoomId = ruleValue('$own_room_id');
const $userId = ruleValue('$user_id');

const roomName = ruleValue('room_name', { isStringLiteral: true });
const createdAt = ruleValue('created_at', { isStringLiteral: true });
const rooms = ruleValue('rooms', { isStringLiteral: true });
const roomEntrances = ruleValue('room_entrances', { isStringLiteral: true });
const publicInfo = ruleValue('public_info', { isStringLiteral: true });
const password = ruleValue('password', { isStringLiteral: true });
const ownerId = ruleValue('owner_id', { isStringLiteral: true });
const ownRoomId = ruleValue('own_room_id', { isStringLiteral: true });
const roomId = ruleValue('room_id', { isStringLiteral: true });
const roomMembersInfo = ruleValue('room_members_info', {
  isStringLiteral: true,
});
const requesting = ruleValue('requesting', { isStringLiteral: true });
const accepted = ruleValue('accepted', { isStringLiteral: true });
const denied = ruleValue('denied', { isStringLiteral: true });
const membersCount = ruleValue('members_count', {
  isStringLiteral: true,
});
const maxMembersCount = ruleValue('100000');
const entrancesQueryLimit = ruleValue('10');
const passwordMaxLength = ruleValue('20');
const roomNameMaxLength = ruleValue('20');
const ownRoomCountLimit = 3;

const membersInfoChildMap = {
  requesting,
  accepted,
  denied,
};

const newDataRoot = {
  roomPublic: newData.parent(4),
  roomPublicChild: newData.parent(5),
  roomIdInEntrance: newData.parent(2),
  entranceChild: newData.parent(3),
  requesting: newData.parent(4),
  accepted: newData.parent(4),
  denied: newData.parent(4),
};

const roomOwnerInfoMap = {
  roomIdInEntrance: {
    oldData: {
      ownerId: data.child(ownerId).val(),
      ownRoomId: data.child(ownRoomId).val(),
    },
    newData: {
      ownerId: newData.child(ownerId).val(),
      ownRoomId: newData.child(ownRoomId).val(),
    },
  },
};

const roomIdMap = {
  roomPublic: {
    oldData: data.child(roomId).val(),
    newData: newData.child(roomId).val(),
  },
  roomPublicChild: {
    oldData: data.parent().child(roomId).val(),
    newData: newData.parent().child(roomId).val(),
  },
  requesting: {
    oldData: $roomId,
    newData: $roomId,
  },
  accepted: {
    oldData: $roomId,
    newData: $roomId,
  },
  denied: {
    oldData: $roomId,
    newData: $roomId,
  },
};

type KeyOfNewDataRootRef = keyof typeof newDataRoot;
type KeyOfRoomIdMap = keyof typeof roomIdMap;
type KeyOfRoomOwnerInfoMap = keyof typeof roomOwnerInfoMap;
type Timing = 'old' | 'new';

interface RefGetter<T> {
  (targetTiming: Timing, keyTiming: Timing, fromPath: T): RuleRef;
}

interface RefGetterWithRest<T> {
  (
    targetTiming: Timing,
    keyTiming: Timing,
    fromPath: T,
    ...restPath: RuleValue[]
  ): RuleRef;
}

interface ValueGetter<T> {
  (targetTiming: Timing, keyTiming: Timing, fromPath: T): RuleValue;
}

const getEntranceRef: RefGetterWithRest<
  KeyOfNewDataRootRef & KeyOfRoomIdMap
> = (targetTiming, keyTiming, fromPath, ...restPath) => {
  return (targetTiming === 'old' ? root : newDataRoot[fromPath]).child(
    roomEntrances,
    roomIdMap[fromPath][keyTiming === 'old' ? 'oldData' : 'newData'],
    ...restPath,
  );
};

const getRoomPublicRef: RefGetterWithRest<
  KeyOfNewDataRootRef & KeyOfRoomOwnerInfoMap
> = (targetTiming, keyTiming, fromPath, ...restPath) => {
  const roomOwnerInfo =
    roomOwnerInfoMap[fromPath][keyTiming === 'old' ? 'oldData' : 'newData'];
  return (targetTiming === 'old' ? root : newDataRoot[fromPath]).child(
    rooms,
    roomOwnerInfo.ownerId,
    roomOwnerInfo.ownRoomId,
    publicInfo,
    ...restPath,
  );
};

const getMembersCountRef: RefGetter<KeyOfNewDataRootRef & KeyOfRoomIdMap> = (
  targetTiming,
  keyTiming,
  fromPath,
) => {
  return getEntranceRef(targetTiming, keyTiming, fromPath, membersCount);
};

const getOwnerIdOfEntrance: ValueGetter<
  KeyOfNewDataRootRef & KeyOfRoomIdMap
> = (targetTiming, keyTiming, fromPath) => {
  return getEntranceRef(targetTiming, keyTiming, fromPath, ownerId).val();
};

type MembersInfoKey = 'requesting' | 'accepted' | 'denied';
function getOtherMembersInfo(timing: Timing, toPath: MembersInfoKey): RuleRef {
  return (timing === 'old' ? data : newData)
    .parent(2)
    .child(membersInfoChildMap[toPath], $userId);
}

function conditionalFrom(
  condition: string | RuleValue,
  thenRef: RuleRef,
  elseRef: RuleRef,
): RuleRef {
  return ruleRef(`(${condition} ? ${thenRef.rawRef} : ${elseRef.rawRef})`);
}

const dataOwnerIdFromRoomId = root.child(roomEntrances, $roomId, ownerId).val();

function getAcceptedFromMembersCount(targetTiming: Timing): RuleRef {
  return (targetTiming === 'old' ? root : newDataRoot.entranceChild).child(
    roomMembersInfo,
    $roomId,
    accepted,
    auth.uid,
  );
}

const deniedFromMembersCount = root.child(
  roomMembersInfo,
  $roomId,
  denied,
  auth.uid,
);

export const getTalkerRules = () =>
  createRuleObject({
    rooms: {
      $owner_id: {
        [read]: [
          `${$ownerId} === ${auth.uid}`,
          '&&',
          query.orderByChild(createdAt),
        ],
        [indexOn]: indexOnChild(createdAt),
        $own_room_id: {
          [read]: `${$ownerId} === ${auth.uid}`,
          [validate]: [
            $ownRoomId.matches(`^[0-${ownRoomCountLimit - 1}]$`),
            '&&',
            newData.hasChild(publicInfo),
            '&&',
            [
              whenNotCreate,
              '||',
              `${$ownerId} === ${auth.uid}`,
              '&&',
              auth.token.emailVerified,
            ],
          ],
          public_info: {
            [read]: [
              `${auth.uid} === ${$ownerId}`,
              '||',
              `${root
                .child(
                  roomMembersInfo,
                  data.child(roomId).val(),
                  accepted,
                  auth.uid,
                )
                .val()} === true`,
            ],
            [write]: [
              whenNotDelete,
              '||',
              [
                `${$ownerId} === ${auth.uid}`,
                '&&',
                // relation
                `!${getEntranceRef('new', 'old', 'roomPublic').exists()}`,
                '&&',
                `!${newDataRoot.roomPublic.hasChild(
                  roomMembersInfo,
                  data.child(roomId).val(),
                )}`,
              ],
            ],
            [validate]: [
              newData.hasChildren([roomId]),
              '&&',
              [
                whenNotCreate,
                '||',
                [`${auth.uid} === ${$ownerId}`, '&&', auth.token.emailVerified],
              ],
            ],
            room_id: {
              [validate]: [
                newData.isString(),
                '&&',
                [whenCreate, '||', `${newData.val()} === ${data.val()}`],
                // relation
                '&&',
                getEntranceRef('new', 'new', 'roomPublicChild').exists(),
                '&&',
                `${newDataRoot.roomPublicChild.hasChild(
                  roomMembersInfo,
                  newData.val(),
                  requesting,
                  password,
                )}`,
              ],
            },
            $other: {
              [validate]: false,
            },
          },
          $other: {
            [validate]: false,
          },
        },
      },
    },
    room_entrances: {
      [read]: [
        auth.isNotNull,
        '&&',
        [
          [
            `${query.orderByKey} !== null`,
            '&&',
            `${query.equalTo} !== null`,
            '&&',
            `${query.limitToFirst} === 1`,
          ],
          '||',
          [
            `${query.orderByChild(ownerId)}`,
            '&&',
            `${query.equalTo} === ${auth.uid}`,
            '&&',
            `${query.limitToFirst} <= ${entrancesQueryLimit}`,
          ],
          '||',
          [
            `${query.orderByChild(roomName)}`,
            '&&',
            `${query.startAt} !== null`,
            '&&',
            `${query.endAt} !== null`,
            '&&',
            `${query.limitToFirst} <= ${entrancesQueryLimit}`,
          ],
          '||',
          [
            `${query.orderByChild(membersCount)}`,
            '&&',
            `${query.startAt} !== null`,
            '&&',
            `${query.endAt} !== null`,
            '&&',
            [
              `${query.limitToFirst} === null`,
              '?',
              `${query.limitToLast} <= ${entrancesQueryLimit}`,
              ':',
              `${query.limitToFirst} <= ${entrancesQueryLimit}`,
            ],
          ],
          '||',
          [
            `${query.orderByChild(createdAt)}`,
            // '&&',
            // `${query.endAt} !== null`,
            '&&',
            [
              `${query.limitToFirst} === null`,
              '?',
              `${query.limitToLast} <= ${entrancesQueryLimit}`,
              ':',
              `${query.limitToFirst} <= ${entrancesQueryLimit}`,
            ],
          ],
        ],
      ],
      [indexOn]: ['owner_id', 'room_name', 'members_count', 'created_at'],
      $room_id: {
        [write]: [
          [
            whenCreate,
            '?',
            `${auth.uid} === ${newData.child(ownerId).val()}`,
            ':',
            [
              `${auth.uid} === ${data.child(ownerId).val()}`,
              '||',
              `${root.hasChild(roomMembersInfo, $roomId, accepted, auth.uid)}`,
            ],
          ],
          '&&',
          `${newData.exists()} === ${newDataRoot.roomIdInEntrance.hasChild(
            rooms,
            conditionalFrom(`${newData.exists()}`, newData, data)
              .child(ownerId)
              .val(),
            conditionalFrom(`${newData.exists()}`, newData, data)
              .child(ownRoomId)
              .val(),
          )}`,
        ],
        [validate]: [
          newData.hasChildren([
            ownerId,
            ownRoomId,
            'room_name',
            'members_count',
            createdAt,
          ]),
          // relation
          '&&',
          `${$roomId} === ${getRoomPublicRef(
            'new',
            'new',
            'roomIdInEntrance',
            roomId,
          ).val()}`,
        ],
        owner_id: {
          [validate]: [
            `${newData.val()} === ${auth.uid}`,
            // relation
            '&&',
            newDataRoot.entranceChild.hasChild(rooms, newData.val()),
            '&&',
            [whenCreate, '||', `${newData.val()} === ${data.val()}`],
          ],
        },
        own_room_id: {
          [validate]: [
            newData.isString(),
            // relation
            '&&',
            newDataRoot.entranceChild.hasChild(
              rooms,
              newData.parent().child(ownerId).val(),
              newData.val(),
            ),
            '&&',
            [whenCreate, '||', `${newData.val()} === ${data.val()}`],
          ],
        },
        room_name: {
          [validate]: [
            newData.isString(),
            '&&',
            `0 < ${newData.val().length}`,
            '&&',
            `${newData.val().length} < ${roomNameMaxLength}`,
            '&&',
            `${auth.uid} === ${newData.parent().child(ownerId).val()}`,
          ],
        },
        members_count: {
          [validate]: [
            newData.isNumber(),
            '&&',
            `1 <= ${newData.val()}`,
            '&&',
            `${newData.val()} < ${maxMembersCount}`,
            '&&',
            [
              whenCreate,
              '?',
              `${newData.val()} === 1`,
              ':',
              [
                `${auth.uid} === ${data.parent().child(ownerId).val()}`,
                '?',
                [
                  `${newData.val()} === 1`,
                  '||',
                  `${newData.val()} === ${data.val()}`,
                ],
                ':',
                [
                  `${getAcceptedFromMembersCount('old').exists()}`,
                  '&&',
                  [
                    [
                      `${newData.val()} === ${data.val()}`,
                      '&&',
                      `(${getAcceptedFromMembersCount('old').val()} === true)`,
                      '===',
                      `(${getAcceptedFromMembersCount('new').val()} === true)`,
                    ],
                    '||',
                    [
                      `${newData.val()} === ${data.val()} + 1`,
                      '&&',
                      `!${deniedFromMembersCount.exists()}`,
                      '&&',
                      `${getAcceptedFromMembersCount('old').val()} === false`,
                      '&&',
                      `${getAcceptedFromMembersCount('new').val()} === true`,
                    ],
                    '||',
                    [
                      `${newData.val()} === ${data.val()} - 1`,
                      '&&',
                      `${getAcceptedFromMembersCount('old').val()} === true`,
                      '&&',
                      `${getAcceptedFromMembersCount('new').val()} !== true`,
                    ],
                  ],
                ],
              ],
            ],
          ],
        },
        created_at: {
          [validate]: [
            `${newData.isNumber()}`,
            '&&',
            `0 < ${newData.val()}`,
            '&&',
            `${newData.val()} <= ${now}`,
            '&&',
            [whenCreate, '||', `${newData.val()} === ${data.val()}`],
          ],
        },
        $other: {
          [validate]: false,
        },
      },
    },
    room_members_info: {
      $room_id: {
        requesting: {
          [read]: [
            `${auth.uid} === ${dataOwnerIdFromRoomId}`,
            '||',
            [
              `${data.child(password).val().length} === 0`,
              '&&',
              query.orderByKey,
              '&&',
              `${query.equalTo} === ${password}`,
            ],
          ],
          [validate]: newData.hasChild(password),
          password: {
            [write]: [
              `${auth.uid} === ${conditionalFrom(
                data.exists(),
                root,
                newDataRoot.requesting,
              )
                .child(roomEntrances, $roomId, ownerId)
                .val()}`,
              '&&',
              `${newData.exists()} === ${getEntranceRef(
                'new',
                'new',
                'requesting',
              ).exists()}`,
            ],
            [validate]: [
              newData.isString(),
              '&&',
              `${newData.val().length} < ${passwordMaxLength}`,
            ],
          },
          $user_id: {
            [write]: [
              whenDelete,
              '?',
              [
                `${auth.uid} === ${dataOwnerIdFromRoomId}`,
                '||',
                `${auth.uid} === ${$userId}`,
              ],
              ':',
              [
                `${auth.uid} !== ${dataOwnerIdFromRoomId}`,
                '&&',
                `${$userId} === ${auth.uid}`,
                '&&',
                getEntranceRef('old', 'new', 'requesting').exists(),
                '&&',
                `!${getOtherMembersInfo('old', 'accepted').exists()}`,
                '&&',
                `!${getOtherMembersInfo('old', 'denied').exists()}`,
              ],
            ],
            [validate]: [
              newData.hasChild(password),
              '&&',
              `${$userId} !== ${getOwnerIdOfEntrance(
                'new',
                'new',
                'requesting',
              )}`,
            ],
            password: {
              [validate]: [
                newData.isString(),
                '&&',
                `${newData.val()} === ${data.parent(2).child(password).val()}`,
              ],
            },
          },
        },
        accepted: {
          [read]: [
            `${auth.uid} === ${dataOwnerIdFromRoomId}`,
            '||',
            [query.orderByKey, '&&', `${query.equalTo} === ${auth.uid}`],
          ],
          $user_id: {
            [write]: [
              whenDelete,
              '?',
              [
                [
                  `${auth.uid} === ${dataOwnerIdFromRoomId}`,
                  '&&',
                  `!${newData.parent().exists()}`,
                  // relation
                  '&&',
                  [
                    `!${getEntranceRef('new', 'new', 'accepted').exists()}`,
                    '||',
                    `${getMembersCountRef(
                      'new',
                      'new',
                      'accepted',
                    ).val()} === 1`,
                  ],
                ],
                '||',
                [
                  `${$userId} === ${auth.uid}`,
                  // relation
                  '&&',
                  [
                    `${data.val()} !== true`,
                    '||',
                    `${getMembersCountRef(
                      'new',
                      'new',
                      'accepted',
                    ).val()} === ${getMembersCountRef(
                      'old',
                      'old',
                      'accepted',
                    ).val()} - 1`,
                  ],
                ],
              ],
              ':',
              [
                `${auth.uid} === ${dataOwnerIdFromRoomId}`,
                '||',
                `${auth.uid} === ${$userId}`,
              ],
            ],
            [validate]: [
              newData.isBoolean(),
              // relation
              '&&',
              [
                whenCreate,
                '?',
                [
                  `${auth.uid} === ${getOwnerIdOfEntrance(
                    'new',
                    'new',
                    'accepted',
                  )}`,
                  '&&',
                  `${$userId} !== ${getOwnerIdOfEntrance(
                    'new',
                    'new',
                    'accepted',
                  )}`,
                  '&&',
                  `${getOtherMembersInfo('old', 'requesting').exists()}`,
                  '&&',
                  `!${getOtherMembersInfo('new', 'requesting').exists()}`,
                  '&&',
                  `${newData.val()} === false`,
                ],
                ':',
                [
                  `${auth.uid} === ${$userId}`,
                  '&&',
                  [
                    `!${getOtherMembersInfo('old', 'denied').exists()}`,
                    '||',
                    `${newData.val()} === false`,
                  ],
                  '&&',
                  [
                    [
                      `${newData.val()} === ${data.val()}`,
                      '&&',
                      `${getMembersCountRef(
                        'new',
                        'new',
                        'accepted',
                      ).val()} === ${getMembersCountRef(
                        'old',
                        'old',
                        'accepted',
                      ).val()}`,
                    ],
                    '||',
                    [
                      `${getMembersCountRef(
                        'new',
                        'new',
                        'accepted',
                      ).val()} === ${getMembersCountRef(
                        'old',
                        'old',
                        'accepted',
                      ).val()} +`,
                      bracket(`${newData.val()} === true ? 1 : -1`),
                    ],
                  ],
                ],
              ],
            ],
          },
        },
        denied: {
          [read]: [
            `${auth.uid} === ${dataOwnerIdFromRoomId}`,
            '||',
            [query.orderByKey, '&&', `${query.equalTo} === ${auth.uid}`],
          ],
          [write]: `${auth.uid} === ${dataOwnerIdFromRoomId}`,
          [validate]: newDataIsObject,
          $user_id: {
            [validate]: [
              `${newData.val()} === false`,
              '&&',
              `${auth.uid} !== ${$userId}`,
              '&&',
              `${$userId} !== ${dataOwnerIdFromRoomId}`,
            ],
          },
        },
        $other: { [validate]: false },
      },
    },
    $other: { [validate]: false },
  });
