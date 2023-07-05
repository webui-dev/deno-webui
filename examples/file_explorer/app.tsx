/* @jsxImportSource https://esm.sh/preact@10.15.1 */
import { JSX } from "https://esm.sh/preact@10.15.1";
import { fromFileUrl } from "https://deno.land/std@0.192.0/path/mod.ts";

const css = await Deno.readTextFile(
  fromFileUrl(import.meta.resolve("./style.css")),
);
const icon = await Deno.readFile(
  fromFileUrl(import.meta.resolve("./search.png")),
);
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
