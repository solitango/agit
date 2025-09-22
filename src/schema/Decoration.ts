import { Schema, ParseResult } from "effect";

export enum DecorationType {
  Head,
  Branch,
  Tag,
}

export const Decoration = Schema.Struct({
  label: Schema.String,
  type: Schema.Enums(DecorationType),
});

export const Decorations = Schema.transformOrFail(
  Schema.String,
  Schema.Array(Decoration),

  {
    strict: true,
    decode: (input) =>
      ParseResult.succeed(
        input
          .split(", ")
          .flatMap<Schema.Schema.Type<typeof Decoration>>((rawDecoration) => {
            if (rawDecoration == "") return [];

            if (rawDecoration.startsWith("HEAD -> ")) {
              return [
                {
                  label: "HEAD",
                  type: DecorationType.Head,
                },
                { label: rawDecoration.slice(8), type: DecorationType.Branch },
              ];
            }

            if (rawDecoration.startsWith("Tag: ")) {
              return [
                {
                  label: rawDecoration.slice(5),
                  type: DecorationType.Tag,
                },
              ];
            }

            return [
              {
                label: rawDecoration,
                type: DecorationType.Branch,
              },
            ];
          }),
      ),
    encode: (input, _, ast) =>
      ParseResult.fail(new ParseResult.Type(ast, input, "Not Implemented")),
  },
);
