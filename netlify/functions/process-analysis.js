const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const { jobId, username } = JSON.parse(event.body);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    await supabase.from('jobs').update({ status: 'running' }).eq('id', jobId);

    const archivesResponse = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    const archivesData = await archivesResponse.json();
    const allArchiveUrls = archivesData.archives || [];

    // --- MODIFICATION 1 : On limite aux 6 dernières archives ---
    const archivesToProcess = allArchiveUrls.slice(-6);
    const totalMonths = archivesToProcess.length;

    let finalResults = { /* Ici on stockera les stats par ouverture */ };
    let processedMonths = 0;

    // On utilise une boucle séquentielle pour traiter chaque mois l'un après l'autre
    for (const url of archivesToProcess) {
      const monthResponse = await fetch(url);
      const monthData = await monthResponse.json();

      // --- LOGIQUE D'ANALYSE (à développer plus tard) ---
      // Pour l'instant, on simule un traitement
      console.log(`Analyse de ${monthData.games.length} parties pour le mois...`);

      processedMonths++;

      // --- MODIFICATION 2 : On met à jour la progression dans la base de données ---
      const progress = { current: processedMonths, total: totalMonths };
      await supabase.from('jobs').update({ progress: progress }).eq('id', jobId);
    }

    // Pour l'instant, le résultat est un simple message de succès
    finalResults.message = `Analyse terminée. ${processedMonths} mois sur ${totalMonths} ont été traités.`;

    await supabase.from('jobs').update({ status: 'completed', results: finalResults }).eq('id', jobId);

  } catch (error) {
    await supabase.from('jobs').update({ status: 'failed', results: { error: error.message } }).eq('id', jobId);
  }
};
