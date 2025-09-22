import { ParseResult, Schema } from "effect";

export const Path = Schema.transformOrFail(
  Schema.String,
  Schema.Array(Schema.String),
  {
    strict: true,
    decode: (input, _, ast) => {
      if (input == "") return ParseResult.succeed([]);

      if (input[0] == "/") {
        ParseResult.fail(
          new ParseResult.Type(ast, input, "Path should never start with `/`"),
        );
      }

      return ParseResult.succeed(input.split("/"));
    },
    encode: (input) => ParseResult.succeed(input.join("/")),
  },
);
