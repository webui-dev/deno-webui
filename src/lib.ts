// Deno WebUI
// FFI (Foreign Function Interface) for webui.ts

import { libPath } from "../deps.ts";

const symbols = {
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
    nonblocking: Deno.build.os !== "darwin",
  },
  webui_show_browser: {
    // bool webui_show_browser(size_t window, const char* content, size_t browser)
    parameters: ["usize", "buffer", "usize"],
    result: "bool",
    nonblocking: Deno.build.os !== "darwin",
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
  webui_set_kiosk: {
    // void webui_set_kiosk(size_t window, bool status)
    parameters: ["usize", "bool"],
    result: "void",
  },
  webui_destroy: {
    // void webui_destroy(size_t window)
    parameters: ["usize"],
    result: "void",
  },
  webui_set_timeout: {
    // void webui_set_timeout(size_t second)
    parameters: ["usize"],
    result: "void",
  },
  webui_set_icon: {
    // void webui_set_icon(size_t window, const char* icon, const char* icon_type)
    parameters: ["usize", "buffer", "buffer"],
    result: "void",
  },
  webui_encode: {
    // char* webui_encode(const char* str)
    parameters: ["buffer"],
    result: "buffer",
  },
  webui_decode: {
    // char* webui_decode(const char* str)
    parameters: ["buffer"],
    result: "buffer",
  },
  webui_free: {
    // void webui_free(void* ptr)
    parameters: ["pointer"],
    result: "void",
  },
  webui_malloc: {
    // void* webui_malloc(size_t size)
    parameters: ["usize"],
    result: "pointer",
  },
  webui_send_raw: {
    // void webui_send_raw(size_t window, const char* function, const void* raw, size_t size)
    parameters: ["usize", "buffer", "buffer", "usize"],
    result: "void",
  },
  webui_set_hide: {
    // void webui_set_hide(size_t window, bool status)
    parameters: ["usize", "bool"],
    result: "void",
  },
  webui_set_size: {
    // void webui_set_size(size_t window, unsigned int width, unsigned int height)
    parameters: ["usize", "u32", "u32"],
    result: "void",
  },
  webui_set_position: {
    // void webui_set_position(size_t window, unsigned int x, unsigned int y)
    parameters: ["usize", "u32", "u32"],
    result: "void",
  },
  webui_get_url: {
    // const char* webui_get_url(size_t window)
    parameters: ["usize"],
    result: "buffer",
  },
  webui_set_public: {
    // void webui_set_public(size_t window, bool status)
    parameters: ["usize", "bool"],
    result: "void",
  },
  webui_navigate: {
    // void webui_navigate(size_t window, const char* url)
    parameters: ["usize", "buffer"],
    result: "void",
  },
  webui_delete_all_profiles: {
    // void webui_delete_all_profiles(void)
    parameters: [],
    result: "void",
  },
  webui_delete_profile: {
    // void webui_delete_profile(size_t window)
    parameters: ["usize"],
    result: "void",
  },
  webui_get_parent_process_id: {
    // size_t webui_get_parent_process_id(size_t window)
    parameters: ["usize"],
    result: "usize",
  },
  webui_get_child_process_id: {
    // size_t webui_get_child_process_id(size_t window)
    parameters: ["usize"],
    result: "usize",
  },
  webui_set_port: {
    // bool webui_set_port(size_t window, size_t port)
    parameters: ["usize", "usize"],
    result: "bool",
  },
  webui_set_runtime: {
    // void webui_set_runtime(size_t window, size_t runtime)
    parameters: ["usize", "usize"],
    result: "void",
  },
  webui_set_config: {
    // void webui_set_config(webui_config option, bool status)
    //   show_wait_connection: 0
    //   ui_event_blocking: 1
    //   folder_monitor: 2
    //   multi_client: 3
    //   use_cookies: 4
    //   asynchronous_response: 5
    parameters: ["usize", "bool"],
    result: "void",
  },
  webui_interface_show_client: {
    // bool webui_interface_show_client(size_t window, size_t event_number, const char* content)
    parameters: ["usize", "usize", "buffer"],
    result: "bool",
  },
  webui_interface_close_client: {
    // void webui_interface_close_client(size_t window, size_t event_number)
    parameters: ["usize", "usize"],
    result: "void",
  },
  webui_interface_send_raw_client: {
    // void webui_interface_send_raw_client(
    //  size_t window, size_t event_number, const char* function, const void* raw, size_t size)
    parameters: ["usize", "usize", "buffer", "buffer", "usize"],
    result: "void",
  },
  webui_interface_navigate_client: {
    // void webui_interface_navigate_client(size_t window, size_t event_number, const char* url)
    parameters: ["usize", "usize", "buffer"],
    result: "void",
  },
  webui_interface_run_client: {
    // void webui_interface_run_client(size_t window, size_t event_number, const char* script)
    parameters: ["usize", "usize", "buffer"],
    result: "void",
  },
  webui_interface_script_client: {
    // bool webui_interface_script_client(
    //  size_t window, size_t event_number, const char* script, size_t timeout, char* buffer, size_t buffer_length)
    parameters: ["usize", "usize", "buffer", "usize", "buffer", "usize"],
    result: "bool",
  },
  webui_send_raw_client: {
    // void webui_send_raw_client(webui_event_t* e, const char* function, const void* raw, size_t size)
    parameters: ["pointer", "buffer", "buffer", "usize"],
    result: "void",
  },
  webui_interface_set_response_file_handler: {
    // void webui_interface_set_response_file_handler(size_t window, const void* response, int length)
    parameters: ["usize", "pointer", "usize"],
    result: "void",
  },
  webui_get_best_browser: {
    // size_t webui_get_best_browser(size_t window)
    parameters: ["usize"],
    result: "usize",
  },
  webui_start_server: {
    // const char* webui_start_server(size_t window, const char* content)
    parameters: ["usize", "buffer"],
    result: "buffer",
  },
  webui_show_wv: {
    // bool webui_show_wv(size_t window, const char* content)
    parameters: ["usize", "buffer"],
    result: "bool",
  },
  webui_set_custom_parameters: {
    // void webui_set_custom_parameters(size_t window, char *params)
    parameters: ["usize", "buffer"],
    result: "void",
  },
  webui_set_high_contrast: {
    // void webui_set_high_contrast(size_t window, bool status)
    parameters: ["usize", "bool"],
    result: "void",
  },
  webui_is_high_contrast: {
    // bool webui_is_high_contrast(void)
    parameters: [],
    result: "bool",
  },
  webui_browser_exist: {
    // bool webui_browser_exist(size_t browser)
    parameters: ["usize"],
    result: "bool",
  },
  webui_set_default_root_folder: {
    // bool webui_set_default_root_folder(const char* path)
    parameters: ["buffer"],
    result: "bool",
  },
  webui_set_minimum_size: {
    // void webui_set_minimum_size(size_t window, unsigned int width, unsigned int height)
    parameters: ["usize", "u32", "u32"],
    result: "void",
  },
  webui_set_proxy: {
    // void webui_set_proxy(size_t window, const char* proxy_server)
    parameters: ["usize", "buffer"],
    result: "void",
  },
  webui_open_url: {
    // void webui_open_url(const char* url)
    parameters: ["buffer"],
    result: "void",
  },
  webui_get_free_port: {
    // size_t webui_get_free_port(void)
    parameters: [],
    result: "usize",
  },
} as const;

export function loadLib(): Deno.DynamicLibrary<typeof symbols> {
  return Deno.dlopen(
    libPath,
    symbols,
  );
}
