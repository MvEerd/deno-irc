import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as nick } from "../plugins/nick.ts";

Deno.test("nick commands", async () => {
  const { server, client, sanitize } = arrange([nick], { nick: "nick" });

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.nick("nick2");
  const raw = await server.once("NICK");
  assertEquals(raw, "NICK nick2");

  await sanitize();
});

Deno.test("nick events", async () => {
  const { server, client, sanitize } = arrange([nick], { nick: "nick" });

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host NICK nick2");
  const msg = await client.once("nick");
  assertEquals(msg, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    nick: "nick2",
  });

  await sanitize();
});

Deno.test("nick state", async () => {
  const { server, client, sanitize } = arrange([nick], { nick: "nick" });

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host NICK nick2");
  await client.once("nick");
  assertEquals(client.state.nick, "nick2");

  await sanitize();
});