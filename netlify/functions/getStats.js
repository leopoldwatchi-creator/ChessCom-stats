const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const username = event.queryStringParameters.username;

  if (!username) {
    return { statusCode: 400, body: JSON.stringify({ error: "Le nom d'utilisateur est manquant." }) };
  }

  // URLs des deux API que nous allons appeler
  const ARCHIVES_URL = `https://api.chess.com/pub/player/${username}/games/archives`;
  const STATS_URL = `https://api.chess.com/pub/player/${username}/stats`;

  try {
    // On lance les deux appels en parallèle pour gagner du temps
    const [archivesResponse, statsResponse] = await Promise.all([
      fetch(ARCHIVES_URL),
      fetch(STATS_URL)
    ]);

    if (!archivesResponse.ok || !statsResponse.ok) {
      throw new Error(`Joueur "${username}" introuvable ou API inaccessible.`);
    }

    // --- Traitement des classements Elo ---
    const statsData = await statsResponse.json();
    const eloStats = {
      rapid: statsData.chess_rapid?.last.rating || 'N/A',
      blitz: statsData.chess_blitz?.last.rating || 'N/A',
      bullet: statsData.chess_bullet?.last.rating || 'N/A',
      daily: statsData.chess_daily?.last.rating || 'N/A',
    };

    // --- Traitement du nombre de parties (comme avant) ---
    const archivesData = await archivesResponse.json();
    const allArchiveUrls = archivesData.archives || [];
    
    let gameCounts = { total: 0, rapid: 0, blitz: 0, bullet: 0, daily: 0 };

    if (allArchiveUrls.length > 0) {
      const allMonthsData = await Promise.all(
        allArchiveUrls.map(url => fetch(url).then(res => res.json()))
      );
      for (const monthData of allMonthsData) {
        for (const game of monthData.games) {
          gameCounts.total++;
          if (gameCounts.hasOwnProperty(game.time_class)) {
            gameCounts[game.time_class]++;
          }
        }
      }
    }

    // On combine les deux résultats en un seul objet
    const finalResponse = {
      elo: eloStats,
      games: gameCounts
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(finalResponse),
    };

  } catch (error) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
