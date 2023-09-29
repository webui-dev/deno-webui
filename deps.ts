// Dependences needed by webui.ts

export { existsSync } from "https://deno.land/std@0.192.0/fs/mod.ts";
export * as path from "https://deno.land/std@0.192.0/path/mod.ts";
export * as fs from "https://deno.land/std@0.192.0/fs/mod.ts";
export { default as CRC32 } from "npm:crc-32@1.2.2";

// Preload lib files statically

// Linux Clang x64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiLinuxClangX64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-linux-clang-x64/webui-2.so" assert {
  type: "json",
};

// Linux GCC aarch64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiLinuxGccAarch64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-linux-gcc-aarch64/webui-2.so" assert {
  type: "json",
};

// Linux GCC arm
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiLinuxGccArm,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-linux-gcc-arm/webui-2.so" assert {
  type: "json",
};

// Linux GCC x64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiLinuxGccX64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-linux-gcc-x64/webui-2.so" assert {
  type: "json",
};

// MacOS Clang arm64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiMacosClangArm64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-macos-clang-arm64/webui-2.dylib" assert {
  type: "json",
};

// MacOS Clang x64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiMacosClangX64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-macos-clang-x64/webui-2.dylib" assert {
  type: "json",
};

// Windows GCC x64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiWindowsGccX64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-windows-gcc-x64/webui-2.dll" assert {
  type: "json",
};

// Windows MSVC x64
export {
  //@ts-ignore ejm serve { b64: string }
  default as webuiWindowsMsvcX64,
} from "https://ejm.sh/github.com/webui-dev/deno-webui/blob/main/src/webui-windows-msvc-x64/webui-2.dll" assert {
  type: "json",
};
