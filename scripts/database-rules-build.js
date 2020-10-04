#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const cwd = process.cwd();

const args = process.argv.slice(2);

// Console format
const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';

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
  joinTexts,
  join,
  bracket,
  exp,
  indexOnChild,
} = require('./database-rules-build-core');

const writer = async (sourceObj) => {
  const firebaseSettingPath = path.join((cwd, 'firebase.json'));

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
  const roomId = ruleValue('$room_id', { isCaptured: true });
  const ownerId = ruleValue('$owner_id', { isCaptured: true });
  const ownRoomId = ruleValue('$own_room_id', { isCaptured: true });
  const userId = ruleValue('$user_id', { isCaptured: true });

  const createdAt = ruleValue('created_at', { isStringLiteral: true });
  const rooms = ruleValue('rooms', { isStringLiteral: true });
  const publicInfo = ruleValue('public_info', { isStringLiteral: true });

  writer({
    rules: {
      [read]: false,
      [write]: false,
      rooms: {
        $owner_id: {
          [read]: join(
            exp`${ownerId} === ${auth.uid}`,
            '&&',
            query.orderByChild(createdAt),
          ),
          [indexOn]: indexOnChild(createdAt),
          $own_room_id: {
            [read]: exp`${ownerId} === ${auth.uid}`,
            [write]: join(
              exp`${ownerId} === ${auth.uid}`,
              '&&',
              auth.token.emailVerified,
              '&&',
              bracket(
                newData.exists(),
                '||',
                exp`!${newData
                  .child('room_entrances')
                  .hasChild(joinTexts`${ownerId}-${ownRoomId}`)}`,
              ),
            ),
            [validate]: join(
              ownRoomId.matches('^[1-3]$'),
              '&&',
              newData.hasChildren(['public_info', 'password']),
            ),
            public_info: {
              // [read]: "data.child('allowed_users').hasChild(auth.uid)",
              [read]: data.child('allowed_users').hasChild(auth.uid)(),
              [validate]:
                // "newData.hasChildren(['allowed_users', 'room_name', 'members_count'])",
                newData.hasChildren([
                  'room_name',
                  'allowed_users',
                  'allowed_users_count',
                  'members_count',
                ])(),
              room_name: {
                [validate]: join(
                  newData.isString(),
                  '&&',
                  exp`0 < ${newData.val().length}`,
                  '&&',
                  exp`${newData.val().length} < 20`,
                ),
              },
              allowed_users: {
                $user_id: {
                  [validate]: newData.isBoolean()(),
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
                        .parent()
                        .child('allowed_users_count')
                        .val()} + 1`,
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
          [write]: exp`${newData.child('owner_id').val()} === ${auth.uid}`,
          [validate]: join(
            exp`${roomId} === ${joinTexts`${auth.uid}-${newData
              .child('own_room_id')
              .val()}`}`,
            // "$room_id === auth.uid + '-' + newData.child('own_room_id').val()",
            '&&',
            newData.hasChildren([
              'owner_id',
              'room_name',
              'members_count',
              'created_at',
            ]),
            '&&',
            newData
              .parent(2)
              .hasChild(
                newData.child('owner_id').val(),
                newData.child('own_room_id').val(),
              ),
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
                  newData.parent().child('owner_id').val(),
                  newData.val(),
                ),
            ),
          },
          room_name: {
            [validate]: join(
              exp`${newData.val()} === ${newData
                .parent(3)
                .child(
                  rooms,
                  newData.parent().child('owner_id').val(),
                  newData.parent().child('own_room_id').val(),
                  publicInfo,
                  'room_name',
                )
                .val()}`,
            ),
          },
          members_count: {
            [validate]: join(
              exp`${newData.val()} === ${newData
                .parent(3)
                .child(
                  rooms,
                  newData.parent().child('owner_id').val(),
                  newData.parent().child('own_room_id').val(),
                  publicInfo,
                  'members_count',
                )
                .val()}`,
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
          [read]: join(
            exp`${joinTexts`${auth.uid}-1`} <= ${roomId}`,
            '&&',
            exp`${roomId} <= ${joinTexts`${auth.uid}-3`}`,
          ),
          $user_id: {
            [write]: join(
              exp`!${data.exists()}`,
              '&&',
              root.child(rooms).hasChild(roomId),
              '&&',
              exp`${userId} === ${auth.uid}`,
            ),
            [validate]: newData.hasChild('password')(),
            password: {
              [validate]: join(
                data.isString(),
                '&&',
                exp`${data.val()} === ${root
                  .child(rooms, roomId, 'password')
                  .val()}`,
              ),
            },
            $other: { [validate]: false },
          },
        },
      },
      $other: { [validate]: false },
    },
  });
})();
