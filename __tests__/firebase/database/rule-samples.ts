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
  join as RuleJoin,
  bracket,
  exp,
  indexOnChild,
  RuleRef,
  createRuleObject,
} from '@scripts/database-rules-build-core';

const whenCreate = ruleValue(exp`!${data.exists()}`);
const whenDelete = ruleValue(exp`!${newData.exists()}`);
const whenNotCreate = data.exists();
const whenNotDelete = newData.exists();

const $roomId = ruleValue('$room_id', { isCaptured: true });
const $ownerId = ruleValue('$owner_id', { isCaptured: true });
const $ownRoomId = ruleValue('$own_room_id', { isCaptured: true });
const $userId = ruleValue('$user_id', { isCaptured: true });

const createdAt = ruleValue('created_at', { isStringLiteral: true });
const rooms = ruleValue('rooms', { isStringLiteral: true });
const roomEntrances = ruleValue('room_entrances', { isStringLiteral: true });
const publicInfo = ruleValue('public_info', { isStringLiteral: true });
const password = ruleValue('password', { isStringLiteral: true });
const ownerId = ruleValue('owner_id', { isStringLiteral: true });
const ownRoomId = ruleValue('own_room_id', { isStringLiteral: true });
const roomId = ruleValue('room_id', { isStringLiteral: true });
const allowedUsers = ruleValue('allowed_users', { isStringLiteral: true });
const allowedUsersCount = ruleValue('allowed_users_count', {
  isStringLiteral: true,
});
const toAllowedCountFrom = (refPoint: RuleRef) =>
  refPoint.parent().child(allowedUsersCount).val();

export const sampleRule1 = {
  rules: createRuleObject({
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
              whenNotDelete,
              // relation
              // '||',
              // exp`!${newData
              //   .parent(4)
              //   .child(roomEntrances)
              //   .hasChild(newData.child(publicInfo, roomId).val())}`,
            ],
          ],
          [validate]: [
            $ownRoomId.matches('^[1-3]$'),
            '&&',
            newData.hasChildren([publicInfo, password]),
          ],
          public_info: {
            [read]: data.hasChild(allowedUsers, auth.uid),
            [validate]: newData.hasChildren([roomId, allowedUsersCount]),
            room_id: {
              [validate]: [
                newData.isString(),
                // relation
                // '&&',
                // newData.parent(4).hasChild(roomEntrances, newData.val()),
              ],
            },
            allowed_users: {
              $user_id: {
                [validate]: [
                  newData.isBoolean(),
                  // relation
                  '&&',
                  [
                    exp`(${whenNotCreate} && ${data.val({
                      isBool: true,
                    })}) === ${newData.val()}`,
                    '?',
                    exp`${toAllowedCountFrom(newData)} === ${toAllowedCountFrom(
                      data,
                    )}`,
                    ':',
                    exp`${toAllowedCountFrom(
                      newData,
                    )} === (${toAllowedCountFrom(data)} + (${newData.val({
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
                  whenNotCreate,
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
              [whenCreate, '||', exp`${newData.val()} === ${data.val()}`],
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
            whenDelete,
            // relation
            // '&&',
            // exp`!${newData
            //   .parent(2)
            //   .hasChild(
            //     rooms,
            //     data.child(ownerId).val(),
            //     data.child(ownerId, ownRoomId).val(),
            //   )}`,
          ],
        ],
        [validate]: [
          newData.hasChildren([
            ownerId,
            'room_name',
            'members_count',
            createdAt,
          ]),
          // relation
          // '&&',
          // exp`${$roomId} === ${newData
          //   .parent(2)
          //   .child(
          //     newData.child(ownerId).val(),
          //     newData.child(ownRoomId).val(),
          //     roomId,
          //   )
          //   .val()}`,
        ],
        owner_id: {
          [validate]: [
            exp`${newData.val()} === ${auth.uid}`,
            // relation
            // '&&',
            // newData.parent(3).hasChild(rooms, newData.val()),
          ],
        },
        own_room_id: {
          [validate]: [
            newData.isString(),
            // relation
            // '&&',
            // newData
            //   .parent(3)
            //   .hasChild(
            //     rooms,
            //     newData.parent().child(ownerId).val(),
            //     newData.val(),
            //   ),
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
                // relation
                // '&&',
                // exp`${newData.val()} <= ${newData
                //   .parent(3)
                //   .child(
                //     rooms,
                //     newData.parent().child(ownerId).val(),
                //     newData.parent().child(ownRoomId).val(),
                //     publicInfo,
                //     allowedUsersCount,
                //   )
                //   .val()} + 1`,
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
        [read]: exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
          auth.uid
        }`,
        [write]: [
          exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
            auth.uid
          }`,
          '&&',
          whenDelete,
        ],
        $user_id: {
          [write]: [
            whenCreate,
            '&&',
            root.child(roomEntrances).hasChild($roomId),
            '&&',
            exp`${$userId} === ${auth.uid}`,
          ],
          [validate]: newData.hasChild(password),
          password: {
            [validate]: [
              data.isString(),
              '&&',
              exp`${data.val()} === ${root
                .child(rooms, $roomId, password)
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
        [write]: exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
          auth.uid
        }`,
        [validate]: exp`${newData.val()} === false`,
      },
    },
    $other: { [validate]: false },
  }),
};

export const wholeRules = {
  rules: createRuleObject({
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
            [read]: data.hasChild(allowedUsers, auth.uid),
            [validate]: newData.hasChildren([roomId, allowedUsersCount]),
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
                    exp`${toAllowedCountFrom(newData)} === ${toAllowedCountFrom(
                      data,
                    )}`,
                    ':',
                    exp`${toAllowedCountFrom(
                      newData,
                    )} === (${toAllowedCountFrom(data)} + (${newData.val({
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
            'members_count',
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
                    allowedUsersCount,
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
        [read]: exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
          auth.uid
        }`,
        [write]: [
          exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
            auth.uid
          }`,
          '&&',
          exp`!${newData.exists()}`,
        ],
        $user_id: {
          [write]: [
            exp`!${data.exists()}`,
            '&&',
            root.child(roomEntrances).hasChild($roomId),
            '&&',
            exp`${$userId} === ${auth.uid}`,
          ],
          [validate]: newData.hasChild(password),
          password: {
            [validate]: [
              data.isString(),
              '&&',
              exp`${data.val()} === ${root
                .child(rooms, $roomId, password)
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
        [write]: exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
          auth.uid
        }`,
        [validate]: exp`${newData.val()} === false`,
      },
    },
    $other: { [validate]: false },
  }),
};
