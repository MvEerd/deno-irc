import { assertEquals, assertMatch } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { invalidNames } from "./invalid_names.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";
import { throwOnError } from "./throw_on_error.ts";

describe("plugins/invalid_names", (test) => {
  const plugins = [
    nick,
    register,
    registerOnConnect,
    throwOnError,
    invalidNames,
  ];

  const options = { nick: "me" };

  test("change nickname on ERR_NICKNAMEINUSE", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: true,
    });

    server.send(":serverhost 433 me new_nick :Nickname is already in use");
    client.once("error");
    await client.once("raw");
    const raw = server.receive();

    assertEquals(raw, ["NICK new_nick_"]);
  });

  test("change nickname on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: true,
    });

    server.send(":serverhost 432 me `^$ :Erroneous nickname");
    client.once("error");
    await client.once("raw");
    const raw = server.receive();

    assertMatch(raw[0], /^NICK _[a-zA-Z0-9]+$/);
  });

  test("change username on ERR_INVALIDUSERNAME", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: true,
    });

    server.send(":serverhost 468 * USER :Your username is not valid");
    client.once("error");
    await client.once("raw");
    const raw = server.receive();

    assertMatch(raw[0], /^USER _[a-zA-Z0-9]+ 0 \* me$/);
  });

  test("not change anything if disabled", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: false,
    });

    const noop = () => {};
    client.on("error", noop);

    server.send(":serverhost 433 me new_nick :Nickname is already in use");
    await client.once("raw");

    server.send(":serverhost 432 me `^$ :Erroneous nickname");
    await client.once("raw");

    server.send(":serverhost 468 * USER :Your username is not valid");
    await client.once("raw");

    const raw = server.receive();

    assertEquals(raw, []);
  });
});
