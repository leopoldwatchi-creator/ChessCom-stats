const fetch = require('node-fetch');

// On augmente le temps maximum que la fonction peut tourner (spécifique à Netlify)
// Cela nous donne 26 secondes au lieu des 10 par défaut sur les comptes gratuits.
exports.handler = async function (event, context) {
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
    const allArchiveUrls = data.archives || [];
    
    if (allArchiveUrls.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ total: 0, rapid: 0, blitz: 0, bullet: 0, daily: 0 })};
    }

    // --- MODIFICATION PRINCIPALE ICI ---
    // Nous ne prenons plus un "slice", mais bien toutes les archives.
    const archivesToProcess = allArchiveUrls;
    
    // On télécharge toutes les archives en parallèle pour gagner du temps
    const allMonthsData = await Promise.all(
      archivesToProcess.map(url => fetch(url).then(res => res.json()))
    );

    let stats = { total: 0, rapid: 0, blitz: 0, bullet: 0, daily: 0 };
    
    for (const monthData of allMonthsData) {
      for (const game of monthData.games) {
        stats.total++;
        if (stats.hasOwnProperty(game.time_class)) {
          stats[game.time_class]++;
        }
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
