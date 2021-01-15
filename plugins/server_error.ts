import { Plugin } from "../core/client.ts";
import { Raw } from "../core/parsers.ts";
import { AnyError } from "../core/protocol.ts";

export interface ServerErrorParams {
  events: {
    "server_error": ServerError;
  };
}

export interface ServerError {
  command: "ERROR" | AnyError;
  params: string[];
  text: string;
}

export const serverError: Plugin<ServerErrorParams> = (client) => {
  const emitServerError = (msg: Raw) => {
    if (!msg.command.startsWith("ERR")) {
      return;
    }

    const { command, params: p } = msg;
    const params = p.slice(0, p.length - 1);
    const text = p[p.length - 1];

    client.emit("server_error", { command, params, text } as ServerError);
  };

  client.on("raw", emitServerError);
};
