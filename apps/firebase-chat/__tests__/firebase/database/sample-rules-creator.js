// @ts-check

// const { writeFile } = require('fs/promises');
// const { join: pathJoin } = require('path');
const { writeFile } = require('fs/promises');
const { join } = require('path');
const {
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
  join: ruleJoin,
  bracket,
  exp,
  indexOnChild,
  createRuleObject,
  ruleRef,
} = require('../../../scripts/dist/database-rules-build-core');

/**
 * @typedef { import("@scripts/dist/database-rules-build-core").RuleRef } RuleRef
 * @typedef { import("@scripts/dist/database-rules-build-core").RuleValue } RuleValue
 * @typedef { import("./sample-rules-creator-type").SampleRulesCreatorTypes } SampleRulesCreatorTypes
 *  */

const whenCreate = ruleValue(exp`!${data.exists()}`);
const whenDelete = ruleValue(exp`!${newData.exists()}`);
const whenNotCreate = data.exists();
const whenNotDelete = newData.exists();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const whenUpdate = ruleValue(exp`${data.exists()} && ${newData.exists()}`);

const newDataIsObject = ruleValue(
  exp`!(${newData.isBoolean()} || ${newData.isNumber()} || ${newData.isString()})`,
);

const $roomId = ruleValue('$room_id', { isCaptured: true });
const $ownerId = ruleValue('$owner_id', { isCaptured: true });
const $ownRoomId = ruleValue('$own_room_id', { isCaptured: true });
const $userId = ruleValue('$user_id', { isCaptured: true });

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
const entranceQueryLimit = ruleValue('10');
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

/** @typedef { keyof typeof newDataRoot } KeyOfNewDataRootRef  */
/** @typedef { keyof typeof roomIdMap } KeyOfRoomIdMap */
/** @typedef { keyof typeof roomOwnerInfoMap } KeyOfRoomOwnerInfoMap */
/** @typedef { 'old' | 'new' } Timing */

/**
 * @param { Timing } targetTiming
 * @param { Timing } keyTiming
 * @param {KeyOfNewDataRootRef & KeyOfRoomIdMap} fromPath
 * @param {RuleValue[]} restPath
 * @returns {RuleRef}
 * */
function getEntranceRef(targetTiming, keyTiming, fromPath, ...restPath) {
  return (targetTiming === 'old' ? root : newDataRoot[fromPath]).child(
    roomEntrances,
    roomIdMap[fromPath][keyTiming === 'old' ? 'oldData' : 'newData'],
    ...restPath,
  );
}

/**
 * @param { Timing } targetTiming
 * @param { Timing } keyTiming
 * @param {KeyOfNewDataRootRef & KeyOfRoomOwnerInfoMap } fromPath
 * @param {RuleValue[]} restPath
 * @returns {RuleRef}
 * */
function getRoomPublicRef(targetTiming, keyTiming, fromPath, ...restPath) {
  const roomOwnerInfo =
    roomOwnerInfoMap[fromPath][keyTiming === 'old' ? 'oldData' : 'newData'];
  return (targetTiming === 'old' ? root : newDataRoot[fromPath]).child(
    rooms,
    roomOwnerInfo.ownerId,
    roomOwnerInfo.ownRoomId,
    publicInfo,
    ...restPath,
  );
}

/**
 * @param { Timing } targetTiming
 * @param { Timing } keyTiming
 * @param {KeyOfNewDataRootRef & KeyOfRoomIdMap} fromPath
 * @returns {RuleRef}
 * */
function getMembersCountRef(targetTiming, keyTiming, fromPath) {
  return getEntranceRef(targetTiming, keyTiming, fromPath, membersCount);
}

/**
 * @param { Timing } targetTiming
 * @param { Timing } keyTiming
 * @param {KeyOfNewDataRootRef & KeyOfRoomIdMap} fromPath
 * @returns {RuleValue}
 * */
function getOwnerIdOfEntrance(targetTiming, keyTiming, fromPath) {
  return getEntranceRef(targetTiming, keyTiming, fromPath, ownerId).val();
}

/**
 * @param { Timing } timing
 * @param { 'requesting' | 'accepted' | 'denied' } toPath
 * @returns {RuleRef}
 * */
function getOtherMembersInfo(timing, toPath) {
  return (timing === 'old' ? data : newData)
    .parent(2)
    .child(membersInfoChildMap[toPath], $userId);
}

/**
 * @param { string | RuleValue } condition
 * @param { RuleRef } thenRef
 * @param { RuleRef } elseRef
 * @returns { RuleRef }
 * */
function conditionalFrom(condition, thenRef, elseRef) {
  return ruleRef(
    `(${typeof condition === 'string' ? condition : condition()} ? ${
      thenRef.raw
    } : ${elseRef.raw})`,
  );
}

const dataOwnerIdFromRoomId = root.child(roomEntrances, $roomId, ownerId).val();

/**
 * @param { Timing } targetTiming
 * @returns {RuleRef}
 * */
function getAcceptedFromMembersCount(targetTiming) {
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

/**
 * @template {{}} T
 * @param {T} rulesObject
 * @returns {string}
 * */
function createRulesObjectText(rulesObject) {
  return JSON.stringify({ rules: rulesObject });
}

/** @type { SampleRulesCreatorTypes["SampleRulesStore"] } */
const sampleRulesStore = {
  sample1: null,
  whole: null,
};

/** @type { SampleRulesCreatorTypes["SampleRulesCreatorMap"] } */
const sampleRulesCreatorMap = {
  sample1: () =>
    createRulesObjectText(
      createRuleObject({
        rooms: {
          $owner_id: {
            [read]: [
              exp`${$ownerId} === ${auth.uid}`,
              '&&',
              query.orderByChild(createdAt),
            ],
            [indexOn]: indexOnChild(createdAt),
            $own_room_id: {
              [read]: exp`${$ownerId} === ${auth.uid}`,
              [validate]: [
                $ownRoomId.matches(`^[0-${ownRoomCountLimit - 1}]$`),
                '&&',
                newData.hasChild(publicInfo),
                '&&',
                [
                  whenNotCreate,
                  '||',
                  exp`${$ownerId} === ${auth.uid}`,
                  '&&',
                  auth.token.emailVerified,
                ],
              ],
              public_info: {
                [read]: [
                  exp`${auth.uid} === ${$ownerId}`,
                  '||',
                  exp`${root
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
                    exp`${$ownerId} === ${auth.uid}`,
                    '&&',
                    // relation
                    exp`!${getEntranceRef(
                      'new',
                      'old',
                      'roomPublic',
                    ).exists()}`,
                    '&&',
                    exp`!${newDataRoot.roomPublic.hasChild(
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
                    [
                      exp`${auth.uid} === ${$ownerId}`,
                      '&&',
                      auth.token.emailVerified,
                    ],
                  ],
                ],
                room_id: {
                  [validate]: [
                    newData.isString(),
                    '&&',
                    [whenCreate, '||', exp`${newData.val()} === ${data.val()}`],
                    // relation
                    '&&',
                    getEntranceRef('new', 'new', 'roomPublicChild').exists(),
                    '&&',
                    exp`${newDataRoot.roomPublicChild.hasChild(
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
                exp`${query.orderByKey} !== null`,
                '&&',
                exp`${query.equalTo} !== null`,
                '&&',
                exp`${query.limitToFirst} === 1`,
              ],
              '||',
              [
                exp`${query.orderByChild(ownerId)}`,
                '&&',
                exp`${query.equalTo} === ${auth.uid}`,
                '&&',
                exp`${query.limitToFirst} <= ${entranceQueryLimit}`,
              ],
              '||',
              [
                exp`${query.orderByChild(roomName)}`,
                '&&',
                exp`${query.startAt} !== null`,
                '&&',
                exp`${query.endAt} !== null`,
                '&&',
                exp`${query.limitToFirst} <= ${entranceQueryLimit}`,
              ],
              '||',
              [
                exp`${query.orderByChild(membersCount)}`,
                '&&',
                exp`${query.startAt} !== null`,
                '&&',
                exp`${query.endAt} !== null`,
                '&&',
                [
                  exp`${query.limitToFirst} === null`,
                  '?',
                  exp`${query.limitToLast} <= ${entranceQueryLimit}`,
                  ':',
                  exp`${query.limitToFirst} <= ${entranceQueryLimit}`,
                ],
              ],
              '||',
              [
                exp`${query.orderByChild(createdAt)}`,
                // '&&',
                // exp`${query.endAt} !== null`,
                '&&',
                [
                  exp`${query.limitToFirst} === null`,
                  '?',
                  exp`${query.limitToLast} <= ${entranceQueryLimit}`,
                  ':',
                  exp`${query.limitToFirst} <= ${entranceQueryLimit}`,
                ],
              ],
            ],
          ],
          [indexOn]: ['created_at'],
          $room_id: {
            [write]: [
              [
                whenCreate,
                '?',
                exp`${auth.uid} === ${newData.child(ownerId).val()}`,
                ':',
                [
                  exp`${auth.uid} === ${data.child(ownerId).val()}`,
                  '||',
                  exp`${root.hasChild(
                    roomMembersInfo,
                    $roomId,
                    accepted,
                    auth.uid,
                  )}`,
                ],
              ],
              '&&',
              exp`${newData.exists()} === ${newDataRoot.roomIdInEntrance.hasChild(
                rooms,
                conditionalFrom(exp`${newData.exists()}`, newData, data)
                  .child(ownerId)
                  .val(),
                conditionalFrom(exp`${newData.exists()}`, newData, data)
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
              exp`${$roomId} === ${getRoomPublicRef(
                'new',
                'new',
                'roomIdInEntrance',
                roomId,
              ).val()}`,
            ],
            owner_id: {
              [validate]: [
                exp`${newData.val()} === ${auth.uid}`,
                // relation
                '&&',
                newDataRoot.entranceChild.hasChild(rooms, newData.val()),
                '&&',
                [whenCreate, '||', exp`${newData.val()} === ${data.val()}`],
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
                [whenCreate, '||', exp`${newData.val()} === ${data.val()}`],
              ],
            },
            room_name: {
              [validate]: [
                newData.isString(),
                '&&',
                exp`0 < ${newData.val().length}`,
                '&&',
                exp`${newData.val().length} < ${roomNameMaxLength}`,
                '&&',
                exp`${auth.uid} === ${newData.parent().child(ownerId).val()}`,
              ],
            },
            members_count: {
              [validate]: [
                newData.isNumber(),
                '&&',
                exp`1 <= ${newData.val()}`,
                '&&',
                exp`${newData.val()} < ${maxMembersCount}`,
                '&&',
                [
                  whenCreate,
                  '?',
                  exp`${newData.val()} === 1`,
                  ':',
                  [
                    exp`${auth.uid} === ${data.parent().child(ownerId).val()}`,
                    '?',
                    [
                      exp`${newData.val()} === 1`,
                      '||',
                      exp`${newData.val()} === ${data.val()}`,
                    ],
                    ':',
                    [
                      exp`${getAcceptedFromMembersCount('old').exists()}`,
                      '&&',
                      [
                        [
                          exp`${newData.val()} === ${data.val()}`,
                          '&&',
                          exp`(${getAcceptedFromMembersCount(
                            'old',
                          ).val()} === true)`,
                          '===',
                          exp`(${getAcceptedFromMembersCount(
                            'new',
                          ).val()} === true)`,
                        ],
                        '||',
                        [
                          exp`${newData.val()} === ${data.val()} + 1`,
                          '&&',
                          exp`!${deniedFromMembersCount.exists()}`,
                          '&&',
                          exp`${getAcceptedFromMembersCount(
                            'old',
                          ).val()} === false`,
                          '&&',
                          exp`${getAcceptedFromMembersCount(
                            'new',
                          ).val()} === true`,
                        ],
                        '||',
                        [
                          exp`${newData.val()} === ${data.val()} - 1`,
                          '&&',
                          exp`${getAcceptedFromMembersCount(
                            'old',
                          ).val()} === true`,
                          '&&',
                          exp`${getAcceptedFromMembersCount(
                            'new',
                          ).val()} !== true`,
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            },
            created_at: {
              [validate]: [
                exp`${newData.isNumber()}`,
                '&&',
                exp`0 < ${newData.val()}`,
                '&&',
                exp`${newData.val()} <= ${now}`,
                '&&',
                [whenCreate, '||', exp`${newData.val()} === ${data.val()}`],
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
                exp`${auth.uid} === ${dataOwnerIdFromRoomId}`,
                '||',
                [
                  exp`${data.child(password).val().length} === 0`,
                  '&&',
                  query.orderByKey,
                  '&&',
                  exp`${query.equalTo} === ${password}`,
                ],
              ],
              [validate]: newData.hasChild(password),
              password: {
                [write]: [
                  exp`${auth.uid} === ${conditionalFrom(
                    data.exists(),
                    root,
                    newDataRoot.requesting,
                  )
                    .child(roomEntrances, $roomId, ownerId)
                    .val()}`,
                  '&&',
                  exp`${newData.exists()} === ${getEntranceRef(
                    'new',
                    'new',
                    'requesting',
                  ).exists()}`,
                ],
                [validate]: [
                  newData.isString(),
                  '&&',
                  exp`${newData.val().length} < ${passwordMaxLength}`,
                ],
              },
              $user_id: {
                [write]: [
                  [
                    whenDelete,
                    '&&',
                    [
                      exp`${auth.uid} === ${dataOwnerIdFromRoomId}`,
                      '||',
                      exp`${auth.uid} === ${$userId}`,
                    ],
                  ],
                  '||',
                  [
                    whenCreate,
                    '&&',
                    exp`${$userId} === ${auth.uid}`,
                    '&&',
                    getEntranceRef('old', 'new', 'requesting').exists(),
                    '&&',
                    exp`!${getOtherMembersInfo('old', 'accepted').exists()}`,
                    '&&',
                    exp`!${getOtherMembersInfo('old', 'denied').exists()}`,
                  ],
                ],
                [validate]: [
                  newData.hasChild(password),
                  '&&',
                  exp`${$userId} !== ${getOwnerIdOfEntrance(
                    'new',
                    'new',
                    'requesting',
                  )}`,
                ],
                password: {
                  [validate]: [
                    newData.isString(),
                    '&&',
                    exp`${newData.val()} === ${data
                      .parent(2)
                      .child(password)
                      .val()}`,
                  ],
                },
              },
            },
            accepted: {
              $user_id: {
                [write]: [
                  whenDelete,
                  '?',
                  [
                    [
                      exp`${auth.uid} === ${dataOwnerIdFromRoomId}`,
                      '&&',
                      exp`!${newData.parent().exists()}`,
                      // relation
                      '&&',
                      [
                        exp`!${getEntranceRef(
                          'new',
                          'new',
                          'accepted',
                        ).exists()}`,
                        '||',
                        exp`${getMembersCountRef(
                          'new',
                          'new',
                          'accepted',
                        ).val()} === 1`,
                      ],
                    ],
                    '||',
                    [
                      exp`${$userId} === ${auth.uid}`,
                      // relation
                      '&&',
                      [
                        exp`${data.val()} !== true`,
                        '||',
                        exp`${getMembersCountRef(
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
                    exp`${auth.uid} === ${dataOwnerIdFromRoomId}`,
                    '||',
                    exp`${auth.uid} === ${$userId}`,
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
                      exp`${auth.uid} === ${getOwnerIdOfEntrance(
                        'new',
                        'new',
                        'accepted',
                      )}`,
                      '&&',
                      exp`${$userId} !== ${getOwnerIdOfEntrance(
                        'new',
                        'new',
                        'accepted',
                      )}`,
                      '&&',
                      exp`${getOtherMembersInfo('old', 'requesting').exists()}`,
                      '&&',
                      exp`!${getOtherMembersInfo(
                        'new',
                        'requesting',
                      ).exists()}`,
                      '&&',
                      exp`${newData.val()} === false`,
                    ],
                    ':',
                    [
                      exp`${auth.uid} === ${$userId}`,
                      '&&',
                      [
                        exp`!${getOtherMembersInfo('old', 'denied').exists()}`,
                        '||',
                        exp`${newData.val()} === false`,
                      ],
                      '&&',
                      [
                        [
                          exp`${newData.val()} === ${data.val()}`,
                          '&&',
                          exp`${getMembersCountRef(
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
                          exp`${getMembersCountRef(
                            'new',
                            'new',
                            'accepted',
                          ).val()} === ${getMembersCountRef(
                            'old',
                            'old',
                            'accepted',
                          ).val()} +`,
                          bracket(exp`${newData.val()} === true ? 1 : -1`),
                        ],
                      ],
                    ],
                  ],
                ],
              },
            },
            denied: {
              [write]: exp`${auth.uid} === ${dataOwnerIdFromRoomId}`,
              [validate]: newDataIsObject,
              $user_id: {
                [validate]: [
                  exp`${newData.val()} === false`,
                  '&&',
                  exp`${auth.uid} !== ${$userId}`,
                  '&&',
                  exp`${$userId} !== ${dataOwnerIdFromRoomId}`,
                ],
              },
            },
            $other: { [validate]: false },
          },
        },
        $other: { [validate]: false },
      }),
    ),
  whole: () =>
    createRulesObjectText(
      createRuleObject({
        rooms: {
          $owner_id: {
            [read]: [
              exp`${$ownerId} === ${auth.uid}`,
              '&&',
              query.orderByChild(createdAt),
            ],
            [indexOn]: indexOnChild(createdAt),
            $own_room_id: {
              [read]: exp`${$ownerId} === ${auth.uid}`,
              [write]: [
                exp`${$ownerId} === ${auth.uid}`,
                '&&',
                auth.token.emailVerified,
                '&&',
                [
                  newData.exists(),
                  '||',
                  exp`!${newData
                    .parent(4)
                    .child(roomEntrances)
                    .hasChild(newData.child(publicInfo, roomId).val())}`,
                ],
              ],
              [validate]: [
                $ownRoomId.matches('^[1-3]$'),
                '&&',
                newData.hasChildren([publicInfo, password]),
              ],
              public_info: {
                [read]: data.hasChild(roomMembersInfo, auth.uid),
                [validate]: newData.hasChildren([roomId, $userId]),
                room_id: {
                  [validate]: newData
                    .parent(4)
                    .hasChild(roomEntrances, newData.val()),
                },
                allowed_users: {
                  $user_id: {
                    [validate]: [
                      newData.isBoolean(),
                      '&&',
                      [
                        exp`(${data.exists()} && ${data.val({
                          isBool: true,
                        })}) === ${newData.val()}`,
                        '?',
                        exp`${$roomId} === ${$roomId}`,
                        ':',
                        exp`${$roomId} === (${$roomId} + (${newData.val({
                          isBool: true,
                        })} ? 1 : -1))`,
                      ],
                    ],
                  },
                },
                allowed_users_count: {
                  [validate]: [
                    newData.isNumber(),
                    '&&',
                    [
                      data.exists(),
                      '?',
                      bracket(
                        exp`0 <= ${newData.val()}`,
                        '&&',
                        exp`${newData.val()} < 100000`,
                      ),
                      ':',
                      exp`${newData.val()} === 0`,
                    ],
                  ],
                },
                $other: {
                  [validate]: false,
                },
              },
              password: {
                [validate]: [
                  newData.isString(),
                  '&&',
                  exp`${newData.val().length} < 16`,
                ],
              },
              created_at: {
                [validate]: [
                  exp`${newData.val()} < ${now}`,
                  '&&',
                  [
                    exp`!${data.exists()}`,
                    '||',
                    exp`${newData.val()} === ${data.val()}`,
                  ],
                ],
              },
              $other: {
                [validate]: false,
              },
            },
          },
        },
        room_entrances: {
          [read]: auth.isNotNull,
          $room_id: {
            [write]: [
              exp`${newData.child(ownerId).val()} === ${auth.uid}`,
              '||',
              [
                exp`${data.child(ownerId).val()} === ${auth.uid}`,
                '&&',
                exp`!${newData.exists()}`,
                '&&',
                exp`!${newData
                  .parent(2)
                  .hasChild(
                    rooms,
                    data.child(ownerId).val(),
                    data.child(ownerId, ownRoomId).val(),
                  )}`,
              ],
            ],
            [validate]: [
              newData.hasChildren([
                ownerId,
                'room_name',
                membersCount,
                createdAt,
              ]),
              '&&',
              exp`${$roomId} === ${newData
                .parent(2)
                .child(
                  newData.child(ownerId).val(),
                  newData.child(ownRoomId).val(),
                  roomId,
                )
                .val()}`,
            ],
            owner_id: {
              [validate]: [
                exp`${newData.val()} === ${auth.uid}`,
                '&&',
                newData.parent(3).hasChild(rooms, newData.val()),
              ],
            },
            own_room_id: {
              [validate]: [
                newData
                  .parent(3)
                  .hasChild(
                    rooms,
                    newData.parent().child(ownerId).val(),
                    newData.val(),
                  ),
              ],
            },
            room_name: {
              [validate]: [
                newData.isString(),
                '&&',
                exp`0 < ${newData.val().length}`,
                '&&',
                exp`${newData.val().length} < 20`,
              ],
            },
            members_count: {
              [validate]: [
                newData.isNumber(),
                '&&',
                [
                  data.exists(),
                  '?',
                  [
                    exp`0 <= ${newData.val()}`,
                    '&&',
                    exp`${newData.val()} < 100000`,
                    '&&',
                    exp`${newData.val()} <= ${newData
                      .parent(3)
                      .child(
                        rooms,
                        newData.parent().child(ownerId).val(),
                        newData.parent().child(ownRoomId).val(),
                        publicInfo,
                        $userId,
                      )
                      .val()} + 1`,
                  ],
                  ':',
                  exp`${newData.val()} === 1`,
                ],
              ],
            },
            created_at: {
              [validate]: [
                exp`${newData.val()} < ${now}`,
                '&&',
                bracket(
                  exp`!${data.exists()} || ${newData.val()} === ${data.val()}`,
                ),
              ],
            },
            $other: {
              [validate]: false,
            },
          },
        },
        entry_requests: {
          $room_id: {
            [read]: exp`${root
              .child(roomEntrances, $roomId, ownerId)
              .val()} === ${auth.uid}`,
            $user_id: {
              [write]: [
                bracket(
                  whenDelete,
                  '&&',
                  exp`${root
                    .child(roomEntrances, $roomId, ownerId)
                    .val()} === ${auth.uid}`,
                ),
                '||',
                bracket(
                  whenCreate,
                  '&&',
                  root.hasChild(roomEntrances, $roomId),
                  '&&',
                  exp`!${root.hasChild(
                    rooms,
                    root.child(roomEntrances, $roomId, ownerId).val(),
                    root.child(roomEntrances, $roomId, ownRoomId).val(),
                    publicInfo,
                    roomMembersInfo,
                    $userId,
                  )}`,
                  '&&',
                  exp`${$userId} === ${auth.uid}`,
                ),
              ],
              [validate]: newData.hasChild(password),
              password: {
                [validate]: [
                  newData.isString(),
                  '&&',
                  exp`${newData.val()} === ${root
                    .child(
                      rooms,
                      root.child(roomEntrances, $roomId, ownerId).val(),
                      root.child(roomEntrances, $roomId, ownRoomId).val(),
                      password,
                    )
                    .val()}`,
                ],
              },
              $other: { [validate]: false },
            },
          },
        },
        delete_marks: {
          [read]: false,
          $room_id: {
            [write]: exp`${root
              .child(roomEntrances, $roomId, ownerId)
              .val()} === ${auth.uid}`,
            [validate]: exp`${newData.val()} === false`,
          },
        },
        $other: { [validate]: false },
      }),
    ),
};

/** @type {SampleRulesCreatorTypes["SampleRulesKeyCheck"]} */
const sampleRulesKeyCheck = (targetKey) => {
  if (typeof targetKey === 'string') {
    return Object.keys(sampleRulesStore).includes(targetKey);
  } else {
    return false;
  }
};

/**
 * @param {SampleRulesCreatorTypes["SampleRulesKeys"]} rulesKey
 * @param {string} rulesText
 * @returns {SampleRulesCreatorTypes["SampleRulesCreatorMessage"]}
 * */
function formatMessage(rulesKey, rulesText) {
  return {
    rulesKey,
    rulesText,
  };
}

process.on('message', (message) => {
  if (sampleRulesKeyCheck(message)) {
    const storeValue = sampleRulesStore[message];
    if (storeValue) {
      process.send?.(formatMessage(message, storeValue));
    } else {
      try {
        const stringified = sampleRulesCreatorMap[message]();
        sampleRulesStore[message] = stringified;
        writeFile(
          join(process.cwd(), 'rules-creator-result.gitskip.json'),
          stringified,
          'utf-8',
        );
        process.send?.(formatMessage(message, stringified));
      } catch (error) {
        writeFile(
          join(process.cwd(), 'rules-creator-error.gitskip.txt'),
          error.message,
          'utf-8',
        );
      }
    }
  }
});
