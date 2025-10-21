// To run this script:
// deno run --allow-read --allow-write --allow-net --allow-env --allow-ffi custom_file_handler.ts

// To import from local (Debugging and Development)
// import { WebUI } from "../../mod.ts";

// To import from online package registry (Production)
import { WebUI } from "@webui/deno-webui"; // import {WebUI} from "https://deno.land/x/webui@2.5.11/mod.ts";

// Return HTTP header + file raw binary content
const getFile = async (
  contentType: string,
  filename: string,
): Promise<Uint8Array> => {
  const content = await Deno.readFile(filename);
  const header = `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\n\r\n`;
  const headerBytes = new TextEncoder().encode(header);
  const response = new Uint8Array(headerBytes.length + content.length);
  response.set(headerBytes);
  response.set(content, headerBytes.length);
  return response;
};

// Set a custom files handler
async function myFileHandler(myUrl: URL) {
  console.log(`File: ${myUrl.pathname}`);
  // Index example
  if (myUrl.pathname === "/index.html" || myUrl.pathname === "/") {
    return await getFile("text/html", "index.html");
  }
  // Custom text string example
  if (myUrl.pathname === "/test") {
    return "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHello";
  }
  // File examples
  if (myUrl.pathname === "/assets/test_app.js") {
    return await getFile("application/javascript", "assets/test_app.js");
  }
  if (myUrl.pathname === "/assets/webui.jpeg") {
    return await getFile("image/jpeg", "assets/webui.jpeg");
  }
  // Error 404 example
  return "HTTP/1.1 404 Not Found";
}

// Create new window
const myWindow = new WebUI();

// Bind Exit
myWindow.bind("exit", () => {
  // Close all windows and exit
  WebUI.exit();
});

// Set files handler
// Note: Should be called before `.show()`
myWindow.setFileHandler(myFileHandler);

// Show the window
await myWindow.showBrowser("index.html", WebUI.Browser.AnyBrowser);

// Wait until all windows get closed
await WebUI.wait();

console.log("Thank you.");
