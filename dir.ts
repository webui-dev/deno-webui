import webuiWindowsIntel from "./src/webui-libs/webui-x64.dll_.json" with { type: "json" };
import webuiLinuxArm from "./src/webui-libs/webui-arm64.so_.json" with { type: "json" };
import webuiLinuxIntel from "./src/webui-libs/webui-x64.so_.json" with { type: "json" };
import webuiMacosIntel from "./src/webui-libs/webui-x64.dylib_.json" with { type: "json" };
import webuiMacosArm from "./src/webui-libs/webui-arm64.dylib_.json" with { type: "json" };

export default {
  "darwin": {
    "ext": "dylib",
    "encoded": {
      "aarch64": webuiMacosArm.encoded,
      "x86_64": webuiMacosIntel.encoded,
    },
  },
  "linux": {
    "ext": "so",
    "encoded": {
      "aarch64": webuiLinuxArm.encoded,
      "x86_64": webuiLinuxIntel.encoded,
    }
  },
  "windows": {
    "ext": "dll",
    "encoded": {
      "x86_64": webuiWindowsIntel.encoded,
    }
  }
} as {
  [platform: string]: {
    ext: string,
    encoded: {
      [arch: string]: string,
    },
  },
};
