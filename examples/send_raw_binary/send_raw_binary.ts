// To run this script:
// deno run --allow-read --allow-write --allow-run --allow-net --allow-env --allow-ffi send_raw_binary.ts

// To import from local (Debugging and Development)
// import { WebUI } from "../../mod.ts";

// To import from online package registry (Production)
import { WebUI } from "jsr:@webui/deno-webui@2.5.5"; // import {WebUI} from "https://deno.land/x/webui@2.5.5/mod.ts";

const myHtml = `<!DOCTYPE html>
<html>
  <head>
    <script src="webui.js"></script>
      <title>WebUI 2 - Deno Send Raw Binary Example</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        color: white;
        background: linear-gradient(to right, #507d91, #1c596f, #022737);
        text-align: center;
        font-size: 18px;
      }
      button, input {
        padding: 10px;
        margin: 10px;
        border-radius: 3px;
        border: 1px solid #ccc;
        box-shadow: 0 3px 5px rgba(0,0,0,0.1);
        transition: 0.2s;
      }
      button {
        background: #3498db;
        color: #fff;
        cursor: pointer;
        font-size: 16px;
      }
      h1 { text-shadow: -7px 10px 7px rgb(67 57 57 / 76%); }
      button:hover { background: #c9913d; }
      input:focus { outline: none; border-color: #3498db; }
    </style>
    </head>
    <body>
        <h1>WebUI 2 - Deno Send Raw Binary Example</h1>
        <br>
        <div id="Result" style="color: #dbdd52">Received 0 bytes from backend</div>
        <br>
        <img id="imageDisplay" alt="Image">
        <br>
        <button id="get_raw_data">Get Raw Binary Data</button> - <button id="get_raw_picture">Get Raw Picture</button> - <button id="exit">Exit</button>
        <script>
            let result = document.getElementById("Result");

            function setRawImage(rawImageData) {
              result.innerHTML = "Received a " + rawImageData.length + " bytes file from the backend";
              // Set picture
              const blob = new Blob([rawImageData], { type: 'image/jpeg' });
              const imageUrl = URL.createObjectURL(blob);
              const imgElement = document.getElementById('imageDisplay');
              imgElement.src = imageUrl;
              imgElement.onload = () => URL.revokeObjectURL(imageUrl);
            }

            function processRawData(rawData) {
              result.innerHTML = "Received " + rawData.length + " bytes from backend.";
            }
        </script>
    </body>
</html>`;

function get_raw_data(e: WebUI.Event) {
  const rawData = new Uint8Array([0x01, 0x02, 0x03]);
  console.log(`Sending ${rawData.byteLength} bytes to UI...`);
  e.window.sendRaw("processRawData", rawData);
}

async function get_raw_picture(e: WebUI.Event) {
  const pictureRaw = await Deno.readFile("./webui.jpeg");
  console.log(`Sending picture file (${pictureRaw.byteLength} bytes) to UI...`);
  e.window.sendRaw("setRawImage", pictureRaw);
}

// Create new window
const myWindow = new WebUI();

// Bind
myWindow.bind("get_raw_data", get_raw_data);
myWindow.bind("get_raw_picture", get_raw_picture);
myWindow.bind("exit", () => {
  // Close all windows and exit
  WebUI.exit();
});

// Show the window
myWindow.show(myHtml); // Or myWindow.show('./myFile.html');

// Wait until all windows get closed
await WebUI.wait();

console.log("Thank you.");
