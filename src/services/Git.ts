import { Effect, Config, ConfigProvider, Layer, Schema } from "effect";
import {
  FileSystem,
  Path as PathEffect,
  Command,
  CommandExecutor,
} from "@effect/platform";
import {
  NodeFileSystem,
  NodePath,
  NodeCommandExecutor,
} from "@effect/platform-node";

import { AGIT_REPOSITORY_STORAGE } from "astro:env/server";

import { Hash, hashLength } from "~/schema/Hash";
import { CommitInDetail, Commits } from "~/schema/Commit";
import { Path } from "~/schema/Path";
import { Tree } from "~/schema/Tree";
import { Diff } from "~/schema/Diff";

export class Git extends Effect.Service<Git>()("services/Git", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* PathEffect.Path;
    const cmd = yield* CommandExecutor.CommandExecutor;

    /* Helpers */
    const repositoryStorage = Config.string("AGIT_REPOSITORY_STORAGE");

    const getRepositoryPath = (name: string) =>
      repositoryStorage.pipe(
        Effect.map((repositoryStorage) =>
          path.resolve(repositoryStorage, name),
        ),
      );

    const getRepositoryDescriptionPath = (name: string) =>
      getRepositoryPath(name).pipe(
        Effect.map((repositoryPath) =>
          path.resolve(repositoryPath, "description"),
        ),
      );

    /* Effects */
    const getRepositoryDescription = (name: string) =>
      getRepositoryDescriptionPath(name).pipe(
        Effect.flatMap(fs.readFile),
        Effect.map((buffer) => buffer.toString()),
      );

    const getRepositoryNameDescriptionPair = (repository: string) =>
      getRepositoryDescription(repository).pipe(
        Effect.map((description) => ({ name: repository, description })),
      );

    const listRepositories = repositoryStorage.pipe(
      Effect.flatMap(fs.readDirectory),
      Effect.flatMap((names) =>
        Effect.all(names.map(getRepositoryNameDescriptionPair)),
      ),
    );

    const accessRepository = (repository: string) =>
      getRepositoryPath(repository).pipe(
        Effect.flatMap((path) => fs.access(path)),
      );

    const countCommits = (repository: string) =>
      getRepositoryPath(repository).pipe(
        Effect.map((path) =>
          Command.make("git", "--git-dir", path, "rev-list", "--count", "HEAD"),
        ),
        Effect.flatMap(cmd.string),
        Effect.map((stdout) => stdout.split("\n")),
        Effect.map((lines) => lines[0]),
        Effect.flatMap(Schema.decode(Schema.NumberFromString)),
      );

    const getCommits = (
      repository: string,
      maxAmount: number,
      offset: number,
    ) =>
      getRepositoryPath(repository).pipe(
        Effect.map((path) =>
          Command.make(
            "git",
            "--git-dir",
            path,
            "log",
            "--format=%h%n%at%n%an%n%s%n%D",
            `--abbrev=${hashLength}`,
            "--max-count",
            maxAmount.toString(),
            "--skip",
            offset.toString(),
          ),
        ),
        Effect.flatMap(cmd.string),
        Effect.map((stdout) => stdout.split("\n")),
        Effect.map((lines) => lines.slice(0, -1)),
        Effect.flatMap(Schema.decode(Commits)),
      );

    const getCommitInDetail = (repository: string, commit: string) =>
      getRepositoryPath(repository).pipe(
        Effect.map((path) =>
          Command.make(
            "git",
            "--git-dir",
            path,
            "show",
            "-s",
            "--format=%h%n%an%n%ae%n%at%n%cn%n%ce%n%ct%n%GS%n%GK%n%s%n%b",
            `--abbrev=${hashLength}`,
            commit,
          ),
        ),
        Effect.flatMap(cmd.string),
        Effect.map((stdout) => stdout.split("\n")),
        Effect.map((lines) => lines.slice(0, -1)),
        Effect.flatMap(Schema.decode(CommitInDetail)),
      );

    const getDiff = (repository: string, commit: string) =>
      getRepositoryPath(repository).pipe(
        Effect.map((path) =>
          Command.make(
            "git",
            "--git-dir",
            path,
            "show",
            "--format=%N",
            `--abbrev=${hashLength}`,
            commit,
          ),
        ),
        Effect.flatMap(cmd.string),
        Effect.flatMap(Schema.decode(Diff)),
      );

    const getTree = (
      repository: string,
      treeish: string,
      treePath: readonly string[],
    ) =>
      getRepositoryPath(repository).pipe(
        Effect.map((repositoryPath) =>
          Command.make(
            "git",
            "--git-dir",
            repositoryPath,
            "ls-tree",
            "--format=%(objectmode)%x09%(objecttype)%x09%(objectname)%x09%(path)",
            `--abbrev=${hashLength}`,
            treeish,
            ...(treePath.length == 0
              ? []
              : [`${Schema.encodeSync(Path)(treePath)}/`]),
          ),
        ),
        Effect.flatMap(cmd.string),
        Effect.map((stdout) => stdout.split("\n")),
        Effect.map((lines) => lines.slice(0, -1)),
        Effect.flatMap(Schema.decode(Tree)),
      );

    const getBlob = (repository: string, object: string) =>
      getRepositoryPath(repository).pipe(
        Effect.map((repositoryPath) =>
          Command.make("git", "--git-dir", repositoryPath, "show", object),
        ),
        Effect.flatMap(cmd.string),
      );

    return {
      listRepositories,
      accessRepository,
      getRepositoryDescription,
      countCommits,
      getCommits,
      getCommitInDetail,
      getDiff,
      getTree,
      getBlob,
    } as const;
  }),

  dependencies: [
    NodeFileSystem.layer,
    NodePath.layer,
    NodeCommandExecutor.layer.pipe(Layer.provide(NodeFileSystem.layer)),
  ],
}) {}

const astroEnvConfigProvider = ConfigProvider.fromJson({
  AGIT_REPOSITORY_STORAGE,
});

export const runWithAstro = <A, E>(effect: Effect.Effect<A, E, Git>) =>
  effect.pipe(
    Effect.provide(Git.Default),
    Effect.withConfigProvider(astroEnvConfigProvider),
    Effect.runPromise,
  );
