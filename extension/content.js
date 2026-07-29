const folk_url = "http://127.0.0.1:6969";

function wait_for_element(id) {
  return new Promise(resolve => {
    const existing = document.getElementById(id);
    if (existing) {
      return resolve(existing);
    }

    const observer = new MutationObserver(() => {
      const element = document.getElementById(id);

      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
}


function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function str2num(text) {
  const hex = [...text]
    .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  const num =  BigInt("0x" + hex).toString();
  return num;
}

function num2str(num) {
  let hex = BigInt(num).toString(16);
  if (hex.length % 2) {
    hex = "0" + hex;
  }
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return str;
}

async function game_add(grid, game) {
  await delay(100);
  const thumbnail = await browser.runtime.sendMessage({
    type: `/api/thumbnails/${game.id}.png`
  });
  const html = `
<a class="game-card" href="/games/${str2num(game.id)}">
            <div class="game-card-thumb">
                <img src="${thumbnail}" alt="${game.name}">
            </div>
            <div class="game-card-body">
                <div class="game-card-title">${game.name}</div>
                <div class="game-card-meta">
                    <span class="game-card-stat">
                        <i class="fa-solid fa-users"></i>
                        ${game.player_count}
                    </span>
                </div>
            </div>
        </a>
`
  const div = document.createElement("div");
  div.innerHTML = html;
  grid.appendChild(div);
}

async function game_replace(page, me, game) {
  const err_elem = document.querySelector(".error-msg");
  err_elem.remove();
  await delay(100);
  const thumbnail = await browser.runtime.sendMessage({
    type: `/api/thumbnails/${game.id}.png`
  });
  const html = `
  <div class="page" id="page">
        <div class="game-banner">
            <img src="${thumbnail}" alt="${game.name}">
        </div>

        <div class="game-detail-header">
            <div class="game-detail-info">
                <div class="game-detail-title">${game.name}</div>
                <div class="game-detail-creator">By <a href="/users/${game.creator_id}/profile" style="color:inherit;">${game.creator_name}</a></div>
                <div class="game-detail-stats">
                    <div class="game-stat">
                        <span class="game-stat-value" id="stat-active"><i class="fa-solid fa-users"></i>${game.player_count}</span>
                        <span class="game-stat-label">Playing</span>
                    </div>
                    <div class="game-stat">
                        <span class="game-stat-value"><i class="fa-solid fa-eye"></i>${game.visits}</span>
                        <span class="game-stat-label">Visits</span>
                    </div>
                </div>
            </div>
            <a class="btn-play" href="${folk_url + "/?game_id=" + game.id + "&me=" + encodeURIComponent(JSON.stringify(me))}" target="_blank">Play</a>
        </div>

        <div class="game-description-box">
            <div class="game-description-label">About</div>
            <div class="game-description-text">${game.description}</div>
        </div>

        <div class="game-description-box server-list-box">
            <div class="game-description-label">Servers</div>
            <div class="server-list" id="server-list"><p class="empty-msg">No servers</p></div>
        </div>
    </div>
  `
  const div = document.createElement("div");
  div.innerHTML = html;
  page.appendChild(div);
}

async function game_parse(game_id) {
  let game = await browser.runtime.sendMessage({
    type: `/api/games/${game_id}`
  });
  let stat = await browser.runtime.sendMessage({
    type: `/api/game-stats`
  });
  stat = stat[game_id];
  game = {...game, stat};
  return game;
}

async function game_get_all() {
  const games = await browser.runtime.sendMessage({
    type: "/api/games_added"
  });
  return await Promise.all(
    games.map(game => game_parse(game))
  );
}

async function get_me() {
  const outfit = await fetch("/api/catalog/init").then(r => r.json());

  const vrtx_me = await new Promise((resolve) => {
    function on_me(e) {
      window.removeEventListener("folk-me", on_me);
      resolve(e.detail);
    }

    window.addEventListener("folk-me", on_me);

    const script = document.createElement("script");
    script.textContent = `
      (async () => {
        const me = await getMe();

        window.dispatchEvent(new CustomEvent("folk-me", {
          detail: me
        }));
      })();
    `;

    (document.head || document.documentElement).appendChild(script);
    script.remove();
  });

  return {
    id: vrtx_me.id,
    username: vrtx_me.username,
    avatar: {
      gender: outfit.body_type,
      face: outfit.face_id,
      shirt: outfit.shirt_id,
      pants: outfit.pant_id,
    }
  };
}

(async function() {
  const all_games = await game_get_all();

  const parts = location.pathname.split("/");
  if (location.pathname == "/home") {
    await wait_for_element("games-grid");
    const grid = document.getElementById("games-grid");
    await delay(500);
    for (const game of all_games) {
      await game_add(grid, game)
    }

  } else if (location.pathname.startsWith("/games/")) {
    const game_id = num2str(parts[2]);
    const game = all_games.find(game => game.id == game_id);
    if (!game) return;
    const me = await get_me();
    await wait_for_element("page");
    const page = document.getElementById("page");
    await delay(500);
    await game_replace(page, me, game);
  }
})();
