const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  // On récupère le jobId depuis l'URL de la requête
  const { jobId } = event.queryStringParameters;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // On va chercher dans la table "jobs" la ligne qui correspond à notre jobId
  const { data, error } = await supabase
    .from('jobs')
    .select('status, results') // On ne demande que le statut et les résultats
    .eq('id', jobId)
    .single(); // On s'attend à ne trouver qu'une seule ligne

  // Si on ne trouve rien ou s'il y a une erreur, on renvoie une erreur
  if (error || !data) {
    return { 
      statusCode: 404, 
      body: JSON.stringify({ error: "Job non trouvé." }) 
    };
  }

  // Si tout va bien, on renvoie les données (statut et résultats)
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
