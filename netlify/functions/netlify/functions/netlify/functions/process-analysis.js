const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const { jobId, username } = JSON.parse(event.body);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // Mettre à jour le statut à "en cours"
    await supabase.from('jobs').update({ status: 'running' }).eq('id', jobId);

    // --- TOUTE LA LOGIQUE D'ANALYSE VA ICI ---
    // (C'est le même code que nous avions avant pour compter les parties et les ouvertures)
    const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    const archivesData = await archivesResponse.json();
    const allArchiveUrls = archivesData.archives || [];

    let statsByOpening = {}; // ex: { "Sicilian Defense": { wins: 5, losses: 2, draws: 3 } }

    for (const url of allArchiveUrls) {
       const monthResponse = await fetch(url);
       const monthData = await monthResponse.json();
       for (const game of monthData.games) {
          const opening = game.pgn.match(/\[Opening "([^"]+)"\]/)?.[1] || "Unknown";
          const result = game.pgn.match(/\[Result "([^"]+)"\]/)?.[1];
          // ... et ainsi de suite pour analyser chaque PGN ...
       }
    }
    // Pour l'instant, mettons un résultat simple
    const finalResults = { message: `Analyse terminée pour ${username} avec ${allArchiveUrls.length} mois d'archives.` };
    // --- FIN DE LA LOGIQUE D'ANALYSE ---

    // Mettre à jour la base de données avec les résultats et le statut "terminé"
    await supabase.from('jobs').update({ status: 'completed', results: finalResults }).eq('id', jobId);

  } catch (error) {
    // En cas d'erreur, on le note dans la base de données
    await supabase.from('jobs').update({ status: 'failed', results: { error: error.message } }).eq('id', jobId);
  }
};
