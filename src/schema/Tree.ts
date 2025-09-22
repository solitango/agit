import { Schema, ParseResult } from "effect";

import { Path } from "~/schema/Path";
import { Hash } from "~/schema/Hash";

export const TreeObject = Schema.transformOrFail(
  Schema.String,
  Schema.Struct({
    mode: Schema.String,
    type: Schema.String,
    object: Hash,
    path: Path,
  }),
  {
    strict: true,
    decode: (input) => {
      const [mode, type, object, path] = input.split("\t");
      return ParseResult.succeed({ mode, type, object, path });
    },
    encode: (input, _, ast) =>
      ParseResult.fail(new ParseResult.Type(ast, input, "Not Implemented")),
  },
);

export const Tree = Schema.Array(TreeObject);
