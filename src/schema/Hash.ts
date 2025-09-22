import { Schema, ParseResult } from "effect";

export const hashLength = 12;

const matcher = new RegExp(`^[0-9a-f]{${hashLength}}$`);

export const Hash = Schema.transformOrFail(Schema.String, Schema.String, {
  strict: true,
  decode: (input, _, ast) => {
    if (input.match(matcher)) return ParseResult.succeed(input);
    return ParseResult.fail(
      new ParseResult.Type(ast, input, "Hash should contain only hex char."),
    );
  },
  encode: ParseResult.succeed,
});
