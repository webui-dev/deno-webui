// Deno WebUI
// FFI (Foreign Function Interface) for webui.ts

import {
  libName,
} from "../deps.ts";

export function loadLib() {
  return Deno.dlopen(
    libName,
    {
      webui_wait: {
        // void webui_wait(void)
        parameters: [],
        result: "void",
        nonblocking: true,
      },
      webui_new_window: {
        // size_t webui_new_window(void)
        parameters: [],
        result: "usize",
      },
      webui_show: {
        // bool webui_show(size_t window, const char* content)
        parameters: ["usize", "buffer"],
        result: "bool",
      },
      webui_show_browser: {
        // bool webui_show_browser(size_t window, const char* content, size_t browser)
        parameters: ["usize", "buffer", "usize"],
        result: "bool",
      },
      webui_interface_bind: {
        // size_t webui_interface_bind(size_t window, const char* element, void (*func)(size_t, size_t, char*, size_t, size_t));
        parameters: ["usize", "buffer", "function"],
        result: "usize",
      },
      webui_script: {
        // bool webui_script(size_t window, const char* script, size_t timeout, char* buffer, size_t buffer_length)
        parameters: ["usize", "buffer", "usize", "buffer", "usize"],
        result: "bool",
      },
      webui_run: {
        // void webui_run(size_t window, const char* script)
        parameters: ["usize", "buffer"],
        result: "void",
      },
      webui_interface_set_response: {
        // void webui_interface_set_response(size_t window, size_t event_number, const char* response)
        parameters: ["usize", "usize", "buffer"],
        result: "void",
      },
      webui_exit: {
        // void webui_exit(void)
        parameters: [],
        result: "void",
      },
      webui_is_shown: {
        // bool webui_is_shown(size_t window)
        parameters: ["usize"],
        result: "bool",
      },
      webui_close: {
        // void webui_close(size_t window)
        parameters: ["usize"],
        result: "void",
      },
      webui_set_file_handler: {
        // void webui_set_file_handler(size_t window, const void* (*handler)(const char* filename, int* length))
        parameters: ["usize", "function"],
        result: "void",
      },
      webui_interface_is_app_running: {
        // bool webui_interface_is_app_running(void)
        parameters: [],
        result: "bool",
      },
      webui_set_profile: {
        // void webui_set_profile(size_t window, const char* name, const char* path)
        parameters: ["usize", "buffer", "buffer"],
        result: "void",
      },
      webui_interface_get_int_at: {
        // long long int webui_interface_get_int_at(size_t window, size_t event_number, size_t index)
        parameters: ["usize", "usize", "usize"],
        result: "i64",
      },
      webui_interface_get_string_at: {
        // const char* webui_interface_get_string_at(size_t window, size_t event_number, size_t index)
        parameters: ["usize", "usize", "usize"],
        result: "buffer",
      },
      webui_interface_get_bool_at: {
        // bool webui_interface_get_bool_at(size_t window, size_t event_number, size_t index)
        parameters: ["usize", "usize", "usize"],
        result: "bool",
      },
      // webui_interface_get_size_at: {
      //   // size_t webui_interface_get_size_at(size_t window, size_t event_number, size_t index)
      //   parameters: ["usize", "usize", "usize"],
      //   result: "usize",
      // },
      webui_clean: {
        // void webui_clean()
        parameters: [],
        result: "void",
      },
      webui_set_root_folder: {
          // bool webui_set_root_folder(size_t window, const char* path)
          parameters: ["usize", "buffer"],
          result: "bool",
      },
      webui_set_tls_certificate: {
          // bool webui_set_tls_certificate(const char* certificate_pem, const char* private_key_pem)
          parameters: ["buffer", "buffer"],
          result: "bool",
      },
    } as const,
  );
}
