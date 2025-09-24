const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // On récupère le nom d'utilisateur passé dans l'URL
  const username = event.queryStringParameters.username;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Le nom d'utilisateur est manquant." }),
    };
  }

  const API_URL = `https://api.chess.com/pub/player/${username}/games/archives`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error(`Joueur "${username}" introuvable.`);
    }
    const data = await response.json();
    const archiveUrls = data.archives || [];
    
    // On ne prend qu'une seule archive pour aller plus vite pour l'exemple
    if (archiveUrls.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ total: 0, rapid: 0, blitz: 0, bullet: 0 })};
    }

    const lastArchiveUrl = archiveUrls[archiveUrls.length - 1];
    const gamesResponse = await fetch(lastArchiveUrl);
    const gamesData = await gamesResponse.json();

    let stats = { total: 0, rapid: 0, blitz: 0, bullet: 0 };
    for (const game of gamesData.games) {
        stats.total++;
        if (stats.hasOwnProperty(game.time_class)) {
            stats[game.time_class]++;
        }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(stats),
    };

  } catch (error) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
