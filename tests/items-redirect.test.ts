import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface QueuedResponse {
  statusCode: number;
  statusMessage?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

const { requestMock, queuedResponses } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  queuedResponses: [] as QueuedResponse[],
}));

vi.mock("node:https", () => ({
  request: requestMock,
}));

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("getItems redirects", () => {
  beforeEach(() => {
    queuedResponses.length = 0;
    requestMock.mockReset();
    vi.resetModules();

    requestMock.mockImplementation((
      _url: string,
      _options: unknown,
      callback: (response: EventEmitter & {
        statusCode: number;
        statusMessage?: string;
        headers: Record<string, string>;
        resume: () => void;
      }) => void,
    ) => {
      const request = new EventEmitter() as EventEmitter & {
        setTimeout: () => void;
        destroy: (error: Error) => void;
        end: () => void;
      };
      request.setTimeout = vi.fn();
      request.destroy = (error: Error) => request.emit("error", error);
      request.end = () => {
        const queued = queuedResponses.shift();
        if (!queued) throw new Error("Missing queued HTTPS response");

        const response = new EventEmitter() as EventEmitter & {
          statusCode: number;
          statusMessage?: string;
          headers: Record<string, string>;
          resume: () => void;
        };
        response.statusCode = queued.statusCode;
        response.statusMessage = queued.statusMessage;
        response.headers = queued.headers ?? {};
        response.resume = vi.fn();

        callback(response);
        if (queued.body !== undefined) {
          response.emit("data", Buffer.from(JSON.stringify(queued.body)));
        }
        response.emit("end");
      };
      return request;
    });
  });

  it("follows an HTTPS redirect for the large items response", async () => {
    queuedResponses.push(
      {
        statusCode: 301,
        headers: { location: "https://api.deadlock-api.com/v1/assets/items/by-type/upgrade" },
      },
      {
        statusCode: 200,
        body: [{ id: 1, class_name: "upgrade_test", name: "Test Upgrade" }],
      },
    );

    const { getItems } = await import("@/lib/api/deadlock");

    await expect(getItems()).resolves.toEqual([
      { id: 1, class_name: "upgrade_test", name: "Test Upgrade" },
    ]);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it("rejects redirects after the configured limit", async () => {
    for (let i = 0; i < 4; i++) {
      queuedResponses.push({
        statusCode: 301,
        headers: { location: `https://api.deadlock-api.com/redirect-${i}` },
      });
    }

    const { getItems } = await import("@/lib/api/deadlock");

    await expect(getItems()).rejects.toMatchObject({
      message: "Too many redirects",
      status: 508,
    });
  });

  it("rejects redirects to non-HTTPS targets", async () => {
    queuedResponses.push({
      statusCode: 301,
      headers: { location: "http://example.com/items" },
    });

    const { getItems } = await import("@/lib/api/deadlock");

    await expect(getItems()).rejects.toMatchObject({
      message: "Unsafe redirect",
      status: 502,
    });
  });
});
