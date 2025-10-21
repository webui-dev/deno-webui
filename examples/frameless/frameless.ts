// To run this script:
// deno run --allow-read --allow-write --allow-net --allow-env --allow-ffi frameless.ts

// To import from local (Debugging and Development)
// import { WebUI } from "../../mod.ts";

// To import from online package registry (Production)
import { WebUI } from "@webui/deno-webui"; // import {WebUI} from "https://deno.land/x/webui@2.5.10/mod.ts";

const myHtml = `
  <html>
    <head>
      <meta charset='UTF-8'>
      <script src="webui.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; background: transparent; }
        #titlebar {
          height: 40px;
          background: linear-gradient(to right, #2c3e50, #34495e);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          -webkit-app-region: drag;
          --webui-app-region: drag;
          font-family: Arial, sans-serif;
        }
        #title { font-size: 16px; font-weight: bold; }
        #buttons { -webkit-app-region: no-drag; }
        .button {
          display: inline-block;
          width: 24px;
          height: 24px;
          margin-left: 8px;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .minimize { background: #f1c40f; }
        .maximize { background: #2ecc71; }
        .close { background: #e74c3c; }
        .button:hover { filter: brightness(120%); }
        #content {
          height: calc(100% - 40px);
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #message {
          color: white;
          font-size: 32px;
          font-family: Arial, sans-serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
      </style>
    </head>
    <body>
      <div id='titlebar'>
        <span id='title'>WebUI Deno Frameless Window</span>
        <div id='buttons'>
          <span class='button minimize' onclick='minimize()'>–</span>
          <span class='button close' onclick='close_win()'>✕</span>
        </div>
      </div>
      <div id='content'>
        <span id='message'>This is a WebUI Deno frameless example</span>
      </div>
    </body>
  </html>`;

// Create new window
const myWindow = new WebUI();

// Bind
myWindow.bind("minimize", () => {
  myWindow.minimize();
});
myWindow.bind("close_win", () => {
  WebUI.exit();
});

myWindow.setSize(800, 600);
myWindow.setFrameless(true);
myWindow.setTransparent(true);
myWindow.setResizable(false);
myWindow.setCenter();

// Show the window
await myWindow.showWebView(myHtml); // in Microsoft Windows you may need `WebView2Loader.dll`

// Wait until all windows get closed
await WebUI.wait();

console.log("Thank you.");
