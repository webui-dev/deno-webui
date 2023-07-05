// Same as hello_world.ts but using a local file

import { WebUi } from "../../mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.192.0/path/mod.ts";

async function calculate({ window }: WebUi.Event) {
  // Call a js function
  const getA = await window.script("return get_A()").catch((error) => {
    console.error(`Error in the JavaScript: ${error}`);
    return "";
  });

  const getB = await window.script("return get_B()").catch((error) => {
    console.error(`Error in the JavaScript: ${error}`);
    return "";
  });

  // Calculate
  const result = parseInt(getA) + parseInt(getB);

  // Run js (Quick Way)
  window.run(`set_result(${result});`);
}

// Create new window
const myWindow = new WebUi();

// Bind
myWindow.bind("Calculate", calculate);
myWindow.bind("Exit", () => WebUi.exit()); // Close all windows and exit

// Show the window
const htmlPath = fromFileUrl(import.meta.resolve("./hello_world.html"));
myWindow.show(await Deno.readTextFile(htmlPath)); // Or myWindow.show(myWindow, 'hello_world.html');

// Wait until all windows get closed
await WebUi.wait();
console.log("Thank you.");
