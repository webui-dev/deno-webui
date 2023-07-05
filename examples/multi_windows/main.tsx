/* @jsxImportSource https://esm.sh/preact@10.15.1 */
import { WebUi } from "../../mod.ts";
import render from "https://esm.sh/preact-render-to-string@5.2.6";

const window = new WebUi();

function App() {
  return (
    <html lang="fr">
      <head>
        <title>Multi Windows</title>
      </head>
      <body>
        <p>{`It is ${new Date().toLocaleTimeString()}`}</p>
        <button id="open">Open new window</button>
        <div className="context">Custom context menu</div>
      </body>
      <style>
        {`
					body {
						animation: disco 3s infinite;
					}
					
					@keyframes disco {
						0% {background-color: red;}
						17% {background-color: yellow;}
						34% {background-color: green;}
						51% {background-color: cyan;}
						68% {background-color: blue;}
						85% {background-color: magenta;}
						100% {background-color: red;}
					}

					.context {
						position: fixed;
						display: none;
						background-color: rgba(255, 255, 255, 0.8);
						border: 0.1rem solid rgba(255, 255, 255, 0.8);
						border-radius: 0.5rem;
						padding: 0.5rem;
						with: fit-content;
					}

					.context-visible {
						display: block;
					}
				`}
      </style>
      <script>
        {`
					const contextMenu = document.querySelector('.context');
					
					document.body.addEventListener('contextmenu', (event) => {
						event.preventDefault();
					
						const { clientX, clientY } = event;
					
						contextMenu.classList.add('context-visible');
						contextMenu.style.top = clientY + 'px';
						contextMenu.style.left = clientX + 'px';
					})

					document.body.addEventListener('click', (e) => {
						if (e.target.offsetParent !== contextMenu) {
						  contextMenu.classList.remove('context-visible');
						}
					})			
				`}
      </script>
    </html>
  );
}

function deepen() {
  const window = new WebUi();
  window.bind("open", deepen);
  window.show(render(<App />));
}

window.bind("open", deepen);

window.show(render(<App />));

WebUi.wait();
