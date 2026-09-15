import { describe, expect, test } from "bun:test";
import { buildEditorLaunch, getOpenInApp } from "./open-in-apps";

// buildEditorLaunch is the one place that decides the argv of an editor
// launch, on every platform, in both file and folder mode. The launch tests
// that spawn real shims (packages/server/open-in.test.ts) are skipped on
// Windows, so this is the only coverage the Windows argv gets.

const vscode = getOpenInApp("vscode")!;
const sublime = getOpenInApp("sublime-text")!;
const textmate = getOpenInApp("textmate")!;

describe("buildEditorLaunch — file mode (no folder)", () => {
  test("win/linux run the catalog bin on the file alone", () => {
    expect(buildEditorLaunch(vscode, "win", "C:\repo\src\a.ts")).toEqual({
      cmd: "code",
      args: ["C:\repo\src\a.ts"],
    });
    expect(buildEditorLaunch(vscode, "linux", "/repo/src/a.ts")).toEqual({
      cmd: "code",
      args: ["/repo/src/a.ts"],
    });
  });

  test("mac opens the file with the app bundle", () => {
    expect(buildEditorLaunch(vscode, "mac", "/repo/src/a.ts")).toEqual({
      cmd: "open",
      args: ["-a", "Visual Studio Code", "/repo/src/a.ts"],
    });
  });
});

describe("buildEditorLaunch — folder mode", () => {
  test("win/linux pass the folder before the file, mirroring code <root> <file>", () => {
    expect(buildEditorLaunch(vscode, "win", "C:\repo\src\a.ts", "C:\repo")).toEqual({
      cmd: "code",
      args: ["C:\repo", "C:\repo\src\a.ts"],
    });
    expect(buildEditorLaunch(vscode, "linux", "/repo/src/a.ts", "/repo")).toEqual({
      cmd: "code",
      args: ["/repo", "/repo/src/a.ts"],
    });
  });

  test("mac passes the folder before the file to the app bundle", () => {
    expect(buildEditorLaunch(vscode, "mac", "/repo/src/a.ts", "/repo")).toEqual({
      cmd: "open",
      args: ["-a", "Visual Studio Code", "/repo", "/repo/src/a.ts"],
    });
  });

  test("folder mode is not VS Code-only: every editor with a bin gets it", () => {
    expect(buildEditorLaunch(sublime, "linux", "/repo/a.ts", "/repo")).toEqual({
      cmd: "subl",
      args: ["/repo", "/repo/a.ts"],
    });
  });

  test("an empty folder falls back to file mode", () => {
    // resolveOpenInTargetWithRoot can hand back a root the caller decided not
    // to use; an empty string must never become an argv entry.
    expect(buildEditorLaunch(vscode, "linux", "/repo/a.ts", "")).toEqual({
      cmd: "code",
      args: ["/repo/a.ts"],
    });
  });
});

describe("buildEditorLaunch — app not available on the platform", () => {
  test("returns null when the entry has no launch field for the platform", () => {
    // TextMate is mac-only; asking for a Windows launch has no argv to build.
    expect(buildEditorLaunch(textmate, "win", "C:\repo\a.ts")).toBeNull();
    expect(buildEditorLaunch(textmate, "linux", "/repo/a.ts")).toBeNull();
    expect(buildEditorLaunch(textmate, "mac", "/repo/a.ts")).not.toBeNull();
  });
});
