import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { serverError } from "./server_error.ts";

describe("plugins/server_error", (test) => {
  const plugins = [serverError];

  test("emit 'server_error' on ERROR", async () => {
    const { client, server } = await mock(plugins, {});

    server.send("ERROR :Closing link: (user@host) [Client exited]");
    const error = await client.once("server_error");

    assertEquals(error, {
      command: "ERROR",
      params: [],
      text: "Closing link: (user@host) [Client exited]",
    });
  });

  test("emit 'server_error' on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 432 * 0nick :Erroneous Nickname");
    const error = await client.once("server_error");

    assertEquals(error, {
      command: "ERR_ERRONEUSNICKNAME",
      params: ["*", "0nick"],
      text: "Erroneous Nickname",
    });
  });
});
