#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const cwd = process.cwd();

const args = process.argv.slice(2);

// Console format
const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';

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
  const read = '.read';
  const write = '.write';
  const validate = '.validate';
  const join = (...texts) => texts.join(' ');
  const emailVerified = 'auth.token.email_verified === true';
  const publicOwnerId = "'public_info/owner_id'";
  const roomId = '$room_id';
  const roomInfo = "'room_info";
  const publicInfo = (childPath) =>
    `'public_info${childPath && `/${childPath}`}'`;
  const parent = (depth = 1) => Array(depth).fill('parent()').join('.');
  const child = (...paths) =>
    paths.map((pathText) => `child(${pathText})`).join('.');
  const bracket = (...texts) => `( ${texts.join(' ')} )`;

  writer({
    rules: {
      [read]: false,
      [write]: false,
      [validate]: "newData.hasChild('next_room_id')",
      next_room_id: {
        [read]: emailVerified,
        [write]: emailVerified,
        [validate]: join(
          'newData.isNumber()',
          '&&',
          'data.exists()',
          '?',
          bracket(
            'newData.val() === data.val()',
            '||',
            bracket(
              'newData.val() === data.val() + 1',
              '&&',
              "newData.parent().hasChild('room_info/' + data.val())",
            ),
          ),
          ':',
          'newData.val() === 1',
        ),
      },
      room_info: {
        $room_id: {
          [write]: `newData.child(${publicOwnerId}).val() === auth.uid`,
          [validate]: join(
            "newData.hasChildren(['public_info', 'password'])",
            '&&',
            bracket(
              'data.exists()',
              '||',
              bracket(
                "$room_id === '' + root.child('next_room_id').val()",
                '&&',
                "newData.parent().child('next_room_id').val() === root.child('next_room_id').val() + 1",
              ),
            ),
          ),
          public_info: {
            [read]: join(
              "data.child('owner_id').val() === auth.uid",
              '||',
              "data.child('allowed_users').hasChild(auth.uid)",
            ),
            [validate]:
              "newData.hasChildren(['owner_id', 'allowed_users', 'room_name', 'members_count'])",
            owner_id: {
              [validate]: 'newData.val() === auth.uid',
            },
            allowed_users: {
              $user_id: {
                [validate]: 'newData.isBoolean()',
              },
            },
            room_name: {
              [validate]: join(
                'newData.isString()',
                '&&',
                '0 < newData.val().length',
                '&&',
                'newData.val().length < 20',
              ),
            },
            members_count: {
              [validate]: join(
                'newData.isNumber()',
                '&&',
                bracket(
                  'data.exists()',
                  '?',
                  'newData.val() < data.val() + 200',
                  ':',
                  'newData.val() === 0',
                ),
              ),
            },
            $other: {
              [validate]: false,
            },
          },
          password: {
            [read]: `data.parent().child(${publicOwnerId}).val() === auth.uid`,
            [write]: `newData.parent().child(${publicOwnerId}).val() === auth.uid`,
            [validate]: join(
              'newData.isString()',
              '&&',
              'newData.val().length < 16',
            ),
          },
          $other: {
            [validate]: false,
          },
        },
      },
      room_entrance: {
        [read]: 'auth !== null',
        $room_id: {
          [write]: "newData.child('owner_id').val() === auth.uid",
          [validate]: join(
            "newData.hasChildren(['owner_id', 'room_name', 'members_count', 'created_at'])",
            '&&',
            `newData.${parent(2)}.child('room_info').hasChild($room_id)`,
          ),
          owner_id: {
            [validate]: join(
              `newData.val() === newData.${parent(3)}.${child(
                roomInfo,
                roomId,
                publicOwnerId,
              )}.val()`,
            ),
          },
          room_name: {
            [validate]: join(
              `newData.val() === newData.${parent(3)}.${child(
                roomInfo,
                roomId,
                publicInfo('room_name'),
              )}.val()`,
            ),
          },
          members_count: {
            [validate]: join(
              `newData.val() === newData.${parent(3)}.${child(
                roomInfo,
                roomId,
                publicInfo('members_count'),
              )}.val()`,
            ),
          },
          created_at: {
            [validate]: join(
              'newData.val() < now',
              '&&',
              bracket('!data.exists()', '||', 'newData.val() === data.val()'),
            ),
          },
          $other: {
            [validate]: false,
          },
        },
      },
      entry_requests: {
        $room_id: {
          [read]: `root.${child(
            roomInfo,
            '$room_id',
            publicOwnerId,
          )}.val() === auth.uid`,
          $user_id: {
            [write]: join(
              '!data.exists()',
              '&&',
              "root.child('room_info').hasChild($room_id)",
              '&&',
              '$user_id === auth.uid',
            ),
            [validate]: "newData.hasChild('password')",
            password: {
              [validate]: join(
                'data.isString()',
                '&&',
                `data.val() === root.${child(
                  roomInfo,
                  roomId,
                  "'password'",
                )}.val()`,
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
