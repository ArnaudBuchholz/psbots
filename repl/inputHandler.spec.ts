import { beforeEach, it, expect } from 'vitest';
import { buildInputHandler } from './inputHandler.js';
import type { IInputHandler } from './inputHandler.js';

let inputHandler: IInputHandler;
let output: string;
let onData: (data: string) => void;

const simulate = async (text: string | string[]) => {
  if (typeof text === 'string') {
    text = [...text];
  }
  for (const data of text) {
    onData(data);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

beforeEach(() => {
  output = '';
  inputHandler = buildInputHandler({
    width: 40,
    height: 25,
    input(callback) {
      onData = callback;
    },
    output(text) {
      output += text;
    }
  });
});

it('reads a line', async () => {
  simulate('Hello World !\r');
  const line = await inputHandler.waitForLines();
  expect(line).toStrictEqual('Hello World !');
  expect(output).toStrictEqual('Hello World !\r\n');
});

it('reads two lines simultaneously', async () => {
  simulate('Hello World !\rsecond line\r');
  const lines = await inputHandler.waitForLines();
  expect(lines).toStrictEqual('Hello World !\nsecond line');
  expect(output).toStrictEqual('Hello World !\r\nsecond line\r\n');
});

it('reads two lines sequentially', async () => {
  const firstKeys = simulate('Hello World !\rsecond');
  const first = await inputHandler.waitForLines();
  expect(first).toStrictEqual('Hello World !');
  expect(output).toStrictEqual('Hello World !\r\nsecond');
  await firstKeys;
  simulate(' line\r');
  const second = await inputHandler.waitForLines();
  expect(second).toStrictEqual('second line');
  expect(output).toStrictEqual('Hello World !\r\nsecond line\r\n');
});

it('reads chars', async () => {
  simulate('abc');
  await expect(inputHandler.waitForChar()).resolves.toStrictEqual('a');
  await expect(inputHandler.waitForChar()).resolves.toStrictEqual('b');
  await expect(inputHandler.waitForChar()).resolves.toStrictEqual('c');
});
