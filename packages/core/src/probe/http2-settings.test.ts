import { expect, it } from "vitest";

import { consumeHttp2Frames } from "./consume-http2-frames.ts";
import { decodeSettingsPayload } from "./decode-settings-payload.ts";
import { emptySettingsFrame } from "./empty-settings-frame.ts";
import { encodeSettingsPayload } from "./encode-settings-payload.ts";
import { firstServerSettings } from "./first-server-settings.ts";

function settingsFrame(payload: Buffer, flags = 0): Buffer {
  const frame = Buffer.concat([emptySettingsFrame(), payload]);

  frame.writeUIntBE(payload.length, 0, 3);
  frame[4] = flags;

  return frame;
}

it("round-trips a Cloudflare-shaped SETTINGS payload", () => {
  const payload = encodeSettingsPayload([
    { id: 3, value: 100 },
    { id: 4, value: 65_536 },
    { id: 5, value: 16_777_215 },
  ]);

  expect(decodeSettingsPayload(payload)).toStrictEqual([
    { id: 3, name: "MAX_CONCURRENT_STREAMS", value: 100 },
    { id: 4, name: "INITIAL_WINDOW_SIZE", value: 65_536 },
    { id: 5, name: "MAX_FRAME_SIZE", value: 16_777_215 },
  ]);
});

it("rejects a truncated payload", () => {
  expect(() => decodeSettingsPayload(Buffer.from([0, 3, 0, 0]))).toThrow("not a multiple of 6");
});

it("names unknown setting ids as hex", () => {
  expect(decodeSettingsPayload(encodeSettingsPayload([{ id: 7, value: 1 }]))).toStrictEqual([
    { id: 7, name: "0x7", value: 1 },
  ]);
});

it("consumes complete frames and leaves a partial rest", () => {
  const payload = encodeSettingsPayload([{ id: 3, value: 100 }]);
  const { frames, rest } = consumeHttp2Frames(Buffer.concat([settingsFrame(payload), Buffer.from([0, 0])]));

  expect(frames).toHaveLength(1);
  expect(frames[0]?.type).toBe(4);
  expect(rest).toStrictEqual(Buffer.from([0, 0]));
  expect(firstServerSettings(frames)?.equals(payload)).toBe(true);
});

it("skips a SETTINGS acknowledgement when looking for the server's limit", () => {
  const payload = encodeSettingsPayload([{ id: 3, value: 100 }]);
  const { frames } = consumeHttp2Frames(Buffer.concat([settingsFrame(Buffer.alloc(0), 1), settingsFrame(payload)]));

  expect(frames).toHaveLength(2);
  expect(firstServerSettings(frames)?.equals(payload)).toBe(true);
  expect(firstServerSettings(consumeHttp2Frames(settingsFrame(payload, 1)).frames)).toBeNull();
});
