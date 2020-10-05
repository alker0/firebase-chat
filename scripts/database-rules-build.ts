#!/usr/local/bin/yarn ts-node-script

import fsSync = require('fs');
import path = require('path');
import buildUtils = require('./database-rules-build-core');

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
  join,
  bracket,
  exp,
  indexOnChild,
} = buildUtils;

const fs = fsSync.promises;

const cwd = process.cwd();

const args = process.argv.slice(2);

// Console format
const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';

const writer = async (sourceObj: unknown) => {
  const firebaseSettingPath = path.join(cwd, 'firebase.json');

  try {
    await Promise.all(
      [
        { target: path.join(cwd, 'package.json'), msg: 'Not Project Root' },
        {
          target: firebaseSettingPath,
          msg: 'Not Found "firebase.json"',
        },
      ].map(({ target, msg }) => {
        return (async () => {
          try {
            await fs.access(target);
          } catch (err) {
            if (err.code === 'ENOENT') err.message = msg;

            throw err;
          }
        })();
      }),
    );

    const encoding = 'utf8';

    const outputFileName = await (async () => {
      if (args.length) return args[0];

      const firebaseSetting = await fs.readFile(firebaseSettingPath, {
        encoding,
      });

      return JSON.parse(firebaseSetting).database.rules;
    })();

    const outputPath = path.join(cwd, outputFileName);

    await fs.writeFile(outputPath, JSON.stringify(sourceObj), { encoding });

    console.log(green, 'Building Rules Is Completed');
  } catch (error) {
    console.error(red, error);
  }
};

(() => {
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
  const toAllowedCountFrom = (refPoint: buildUtils.RuleRef) =>
    refPoint.parent().child(allowedUsersCount).val();

  writer({
    rules: {
      [read]: false,
      [write]: false,
      rooms: {
        $owner_id: {
          [read]: join(
            exp`${$ownerId} === ${auth.uid}`,
            '&&',
            query.orderByChild(createdAt),
          ),
          [indexOn]: indexOnChild(createdAt),
          $own_room_id: {
            [read]: exp`${$ownerId} === ${auth.uid}`,
            [write]: join(
              exp`${$ownerId} === ${auth.uid}`,
              '&&',
              auth.token.emailVerified,
              '&&',
              bracket(
                newData.exists(),
                '||',
                exp`!${newData
                  .parent(4)
                  .child(roomEntrances)
                  .hasChild(newData.child(publicInfo, roomId).val())}`,
              ),
            ),
            [validate]: join(
              $ownRoomId.matches('^[1-3]$'),
              '&&',
              newData.hasChildren([publicInfo, password]),
            ),
            public_info: {
              [read]: data.hasChild(allowedUsers, auth.uid)(),
              [validate]: newData.hasChildren([
                roomId,
                allowedUsers,
                allowedUsersCount,
              ])(),
              room_id: {
                [validate]: newData
                  .parent(4)
                  .hasChild(roomEntrances, newData.val())(),
              },
              allowed_users: {
                $user_id: {
                  [validate]: join(
                    newData.isBoolean(),
                    '&&',
                    bracket(
                      exp`(${data.exists()} && ${data.val({
                        isBool: true,
                      })}) === ${newData.val()}`,
                      '?',
                      exp`${toAllowedCountFrom(
                        newData,
                      )} === ${toAllowedCountFrom(data)}`,
                      ':',
                      exp`${toAllowedCountFrom(
                        newData,
                      )} === (${toAllowedCountFrom(data)} + (${newData.val({
                        isBool: true,
                      })} ? 1 : -1))`,
                    ),
                  ),
                },
              },
              allowed_users_count: {
                [validate]: join(
                  newData.isNumber(),
                  '&&',
                  bracket(
                    data.exists(),
                    '?',
                    bracket(
                      exp`0 <= ${newData.val()}`,
                      '&&',
                      exp`${newData.val()} < 100000`,
                    ),
                    ':',
                    exp`${newData.val()} === 0`,
                  ),
                ),
              },
              $other: {
                [validate]: false,
              },
            },
            password: {
              [validate]: join(
                newData.isString(),
                '&&',
                exp`${newData.val().length} < 16`,
              ),
            },
            created_at: {
              [validate]: join(
                exp`${newData.val()} < ${now}`,
                '&&',
                bracket(
                  exp`!${data.exists()}`,
                  '||',
                  exp`${newData.val()} === ${data.val()}`,
                ),
              ),
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
          [write]: join(
            exp`${newData.child(ownerId).val()} === ${auth.uid}`,
            '||',
            bracket(
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
            ),
          ),
          [validate]: join(
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
          ),
          owner_id: {
            [validate]: join(
              exp`${newData.val()} === ${auth.uid}`,
              '&&',
              newData.parent(3).hasChild(rooms, newData.val()),
            ),
          },
          own_room_id: {
            [validate]: join(
              newData
                .parent(3)
                .hasChild(
                  rooms,
                  newData.parent().child(ownerId).val(),
                  newData.val(),
                ),
            ),
          },
          room_name: {
            [validate]: join(
              newData.isString(),
              '&&',
              exp`0 < ${newData.val().length}`,
              '&&',
              exp`${newData.val().length} < 20`,
            ),
          },
          members_count: {
            [validate]: join(
              newData.isNumber(),
              '&&',
              bracket(
                data.exists(),
                '?',
                bracket(
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
                ),
                ':',
                exp`${newData.val()} === 0`,
              ),
            ),
          },
          created_at: {
            [validate]: join(
              exp`${newData.val()} < ${now}`,
              '&&',
              bracket(
                exp`!${data.exists()} || ${newData.val()} === ${data.val()}`,
              ),
            ),
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
          [write]: join(
            exp`${root.child(roomEntrances, $roomId, ownerId).val()} === ${
              auth.uid
            }`,
            '&&',
            exp`!${newData.exists()}`,
          ),
          $user_id: {
            [write]: join(
              exp`!${data.exists()}`,
              '&&',
              root.child(roomEntrances).hasChild($roomId),
              '&&',
              exp`${$userId} === ${auth.uid}`,
            ),
            [validate]: newData.hasChild(password)(),
            password: {
              [validate]: join(
                data.isString(),
                '&&',
                exp`${data.val()} === ${root
                  .child(rooms, $roomId, password)
                  .val()}`,
              ),
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
    },
  });
})();
