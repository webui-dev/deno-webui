/* @jsxImportSource https://esm.sh/preact@10.15.1 */
import { JSX } from "https://esm.sh/preact@10.15.1";
import { fromFileUrl } from "https://deno.land/std@0.192.0/path/mod.ts";

const css = await getTextFile("./style.css");
const icon = await getFile("./search.png");
//embed icon to base64 data url
const iconUrl = `data:image/png;base64,${
  btoa(String.fromCharCode.apply(null, Array.from(icon)))
}`;

export function Link(
  { href, children, ...props }: JSX.HTMLAttributes<HTMLAnchorElement>,
) {
  //set client callback using webui global helpers
  //use decodeURIComponent().slice(1, -1) beacause au lacking of proper deno.json compilerOptions
  const onclick =
    `webui_fn('link', '${href}').then(response => output.innerHTML = decodeURIComponent(response).slice(1, -1))`;
  //@ts-ignore embedded js
  return <span className="link" onclick={onclick} {...props}>{children}</span>;
}

export function App() {
  return (
    <html lang="en">
      <head>
        <title>File explorer</title>
        <link
          rel="shortcut icon"
          href={iconUrl}
          type="image/png"
        />
      </head>
      <body>
        <form id="search">
          <label>
            <span>Dir:</span>
            <input type="text" id="query" value={Deno.cwd()} />
          </label>
          <button>Go to</button>
        </form>
        <div id="output"></div>
        <script>
          {`
                        const search = document.getElementById('search')
                        const query = document.getElementById('query')
                        const output = document.getElementById('output')

                        search.addEventListener('submit', async (e) => {
                            e.preventDefault()
                            const response = await webui_fn('search', query.value)
                            //use decodeURIComponent().slice(1, -1) beacause au lacking of proper deno.json compilerOptions
                            output.innerHTML = decodeURIComponent(response).slice(1, -1)
                        })
                    `}
        </script>
        <style>{css}</style>
        {/* webui js will be inserted before body closing tag */}
      </body>
    </html>
  );
}

//Get file for example (handle remote or local access)
async function getFile(relativeUrl: string) {
  const url = import.meta.resolve(relativeUrl);
  try {
    //If example run from local copy
    const path = fromFileUrl(url);
    return Deno.readFile(path);
  } catch {
    //If example run from remote url
    const response = await fetch(url);
    return new Uint8Array(await response.arrayBuffer());
  }
}

//Get text file for example (handle remote or local access)
async function getTextFile(relativeUrl: string) {
  return new TextDecoder().decode(await getFile(relativeUrl));
}
