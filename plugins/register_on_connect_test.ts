import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";

Deno.test("register_on_connect", async () => {
  const { server, client, sanitize } = arrange(
    [registerOnConnect, nick, register],
    {
      nick: "nick",
      username: "user",
      realname: "real name",
      password: "pass",
    },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  const raw1 = await Promise.all([
    server.once("PASS"),
    server.once("NICK"),
    server.once("USER"),
  ]);
  assertEquals(raw1, [
    "PASS pass",
    "NICK nick",
    "USER user 0 * :real name",
  ]);

  server.send(":serverhost 451 nick :You have not registered");
  assertEquals((await client.once("raw")).command, "ERR_NOTREGISTERED");
  const raw2 = await Promise.all([
    server.once("PASS"),
    server.once("NICK"),
    server.once("USER"),
  ]);
  assertEquals(raw2, [
    "PASS pass",
    "NICK nick",
    "USER user 0 * :real name",
  ]);

  await sanitize();
});
