import { Schema, ParseResult, List } from "effect";

import { Decorations } from "~/schema/Decoration";
import { Hash } from "~/schema/Hash";

export const Commit = Schema.transformOrFail(
  Schema.Array(Schema.String),
  Schema.Struct({
    hash: Hash,
    date: Schema.DateTimeUtcFromNumber,
    author: Schema.String,
    subject: Schema.String,
    decorations: Decorations,
  }),
  {
    strict: true,
    decode: (input, _, ast) => {
      if (input.length != 5) {
        return ParseResult.fail(
          new ParseResult.Type(
            ast,
            input,
            "Raw commit text should contains exactly 5 lines",
          ),
        );
      }

      console.log(input);

      return ParseResult.succeed({
        hash: input[0],
        date: parseInt(input[1]) * 1000,
        author: input[2],
        subject: input[3],
        decorations: input[4],
      });
    },
    encode: (input, _, ast) =>
      ParseResult.fail(new ParseResult.Type(ast, input, "Not Implemented")),
  },
);

export const Commits = Schema.transformOrFail(
  Schema.Array(Schema.String),
  Schema.Array(Commit),
  {
    strict: true,
    decode: (input) => {
      const chunk: (lines: readonly string[]) => readonly string[][] = (
        lines,
      ) => {
        if (lines.length == 0) return [];

        const current = lines.slice(0, 5);
        const rest = lines.slice(5);

        return [current, ...chunk(rest)];
      };

      return ParseResult.succeed(chunk(input));
    },
    encode: (input, _, ast) =>
      ParseResult.fail(new ParseResult.Type(ast, input, "Not Implemented")),
  },
);

export const CommitInDetail = Schema.transformOrFail(
  Schema.List(Schema.String),
  Schema.Struct({
    hash: Hash,
    author: Schema.String,
    authorEmail: Schema.String,
    authorDate: Schema.DateTimeUtcFromNumber,
    committer: Schema.String,
    committerEmail: Schema.String,
    committerDate: Schema.DateTimeUtcFromNumber,
    signer: Schema.OptionFromNonEmptyTrimmedString,
    signatureKey: Schema.OptionFromNonEmptyTrimmedString,
    subject: Schema.String,
    body: Schema.String,
  }),
  {
    strict: true,
    decode: (input) => {
      const lines = input.pipe(List.toArray);

      return ParseResult.succeed({
        hash: lines[0],
        author: lines[1],
        authorEmail: lines[2],
        authorDate: parseInt(lines[3]) * 1000,
        committer: lines[4],
        committerEmail: lines[5],
        committerDate: parseInt(lines[6]) * 1000,
        signer: lines[7],
        signatureKey: lines[8],
        subject: lines[9],
        body: lines.slice(10).join("\n"),
      });
    },
    encode: (input, _, ast) =>
      ParseResult.fail(new ParseResult.Type(ast, input, "Not Implemented")),
  },
);
