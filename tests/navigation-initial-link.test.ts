import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Execute the installed native router hook with controlled effect/URL timing.
// This is a lifecycle contract test, not a substitute for physical startup tests.
function harness(initialUrl: unknown) {
  const effects: (() => undefined | (() => void))[] = [];
  const notifications: string[] = [];
  const exports: any = {};
  const react = {
    useRef: (current: unknown) => ({ current }),
    useCallback: (fn: unknown) => fn,
    useEffect: (fn: () => undefined | (() => void)) => effects.push(fn),
  };
  vm.runInNewContext(
    readFileSync("node_modules/expo-router/build/fork/useLinking.native.js", "utf8"),
    {
      exports,
      console,
      process,
      setTimeout,
      clearTimeout,
      require: (name: string) => {
        if (name === "react") return react;
        if (name === "react-native") return { Linking: {}, Platform: { OS: "android" } };
        if (name === "expo-linking") return {};
        if (name === "./extractPathFromURL")
          return {
            extractExpoPathFromURL: (_: unknown, url: string) => url.replace("freightiq://", ""),
          };
        if (name === "../react-navigation/native")
          return {
            useNavigationIndependentTree: () => false,
            getStateFromPath: (path: string) => ({ path, routes: [] }),
            getActionFromState: () => undefined,
          };
        throw new Error(name);
      },
    },
  );
  const hook = exports.useLinking(
    { current: null },
    {
      prefixes: [],
      getInitialURL: () => initialUrl,
      subscribe: () => () => {},
    },
    (path: string) => notifications.push(path),
  );
  return {
    initial: hook.getInitialState,
    notifications,
    mount: () => {
      const cleanups = effects.map((effect) => effect());
      return () => cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}

test("initial async URL resolving before mount does not update React state until commit", async () => {
  const h = harness(Promise.resolve("freightiq://stop?id=fictional"));
  const state = await h.initial();
  assert.equal(state.path, "stop?id=fictional");
  assert.deepEqual(h.notifications, []);
  const unmount = h.mount();
  assert.deepEqual(h.notifications, ["stop?id=fictional"]);
  unmount();
});

test("synchronous initial URL also waits for commit", async () => {
  const h = harness("freightiq://create-account?referral_code=ABC123");
  await h.initial();
  assert.deepEqual(h.notifications, []);
  h.mount()();
  assert.deepEqual(h.notifications, ["create-account?referral_code=ABC123"]);
});

test("late initial URL after unmount cannot update the old navigator", async () => {
  let resolve!: (url: string) => void;
  const h = harness(
    new Promise<string>((done) => {
      resolve = done;
    }),
  );
  const pending = h.initial();
  h.mount()();
  resolve("freightiq://stop?id=fictional");
  await pending;
  assert.deepEqual(h.notifications, []);
});

test("initial URL after mount retains deep-link delivery", async () => {
  let resolve!: (url: string) => void;
  const h = harness(
    new Promise<string>((done) => {
      resolve = done;
    }),
  );
  const pending = h.initial();
  const unmount = h.mount();
  resolve("freightiq://operations");
  await pending;
  assert.deepEqual(h.notifications, ["operations"]);
  unmount();
});

test("effect replay does not duplicate an initial link", async () => {
  const h = harness(Promise.resolve("freightiq://operations"));
  await h.initial();
  h.mount()();
  h.mount()();
  assert.deepEqual(h.notifications, ["operations"]);
});

test("no initial URL does not manufacture a link", async () => {
  const h = harness(null);
  assert.equal(await h.initial(), undefined);
  h.mount()();
  assert.deepEqual(h.notifications, []);
});
