import homeHtml from '../screens/home.html?raw';
import lobbyHtml from '../screens/lobby.html?raw';
import waitHtml from '../screens/wait.html?raw';
import playHtml from '../screens/play.html?raw';
import resultsHtml from '../screens/results.html?raw';

const app = document.getElementById('app');
if (app) {
  app.innerHTML = homeHtml + lobbyHtml + waitHtml + playHtml + resultsHtml;
}

await import('./generator.js');
await import('./names.js');
await import('./multi.js');
await import('./party.js');
await import('./roast.js');
await import('./game.js');
