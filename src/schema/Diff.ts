import { Schema, ParseResult } from "effect";

const isNotEmpty = (text: string | undefined) => text != "";

export const Diff = Schema.transformOrFail(Schema.String, Schema.String, {
  strict: true,
  decode: (input, _, ast) => {
    const lines = input.split("\n");

    if (
      [lines.at(0), lines.at(1), lines.at(-1)]
        .map(isNotEmpty)
        .reduce((a, b) => a || b, false)
    ) {
      return ParseResult.fail(
        new ParseResult.Type(
          ast,
          input,
          "Raw diff should contains 2 padding lines at the beginning and 1 paddings lines at the end.",
        ),
      );
    }

    return ParseResult.succeed(lines.slice(2, -1).join("\n"));
  },
  encode: (input, _, ast) =>
    ParseResult.fail(new ParseResult.Type(ast, input, "Not Implemented")),
});
