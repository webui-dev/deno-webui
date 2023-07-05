/* @jsxImportSource https://esm.sh/preact@10.15.1 */
import { WebUi } from "../../mod.ts";
import renderSSR from "https://esm.sh/preact-render-to-string@5.2.6";
import { App, Link } from "./app.tsx";
import * as path from "https://deno.land/std@0.192.0/path/mod.ts";

const window = new WebUi();

//Render jsx template to string
window.show(renderSSR(<App />));

//Bind link and search (you can't navigate through url for security issues)
window.bind("link", listDir);
window.bind("search", listDir);

function listDir(event: WebUi.Event) {
  const entries: Deno.DirEntry[] = [];
  const root = event.data;

  try {
    for (const entry of Deno.readDirSync(root)) {
      entries.push(entry);
    }

    const parent = path.parse(root).dir;

    return encodeURIComponent(renderSSR(
      <ul>
        <li style={{ fontWeight: "bold" }}>
          <Link href={parent.replaceAll("\\", "/")}>{`<- ${parent}`}</Link>
        </li>
        {entries.map((entry) => (
          <li>
            <Link
              href={entry.isDirectory
                ? `${path.join(root, entry.name).replaceAll("\\", "/")}`
                : root}
            >
              {`${entry.isDirectory ? "📂" : "📄"} ${entry.name}`}
            </Link>
          </li>
        ))}
      </ul>,
    ));
  } catch (error) {
    return encodeURIComponent(renderSSR(
      <ul>
        <li style={{ fontWeight: "bold" }}>
          <Link href={root}>{`<- ${root}`}</Link>
        </li>
        <div className="error">{String(error)}</div>
      </ul>,
    ));
  }
}

//wait to all views close
WebUi.wait();
