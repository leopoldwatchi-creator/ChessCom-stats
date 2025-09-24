const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { Netlify } = require('netlify');

exports.handler = async function (event, context) {
  // On ajoute un bloc try...catch pour attraper toutes les erreurs possibles
  try {
    const { username } = JSON.parse(event.body);

    // Initialisation de Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // 1. Créer une nouvelle tâche dans la base de données
    const jobId = uuidv4();
    const { error: insertError } = await supabase
      .from('jobs')
      .insert([{ id: jobId, username: username, status: 'pending' }]);

    if (insertError) {
      throw new Error(`Erreur Supabase : ${insertError.message}`);
    }

    // 2. Déclencher la fonction de fond de manière asynchrone
    const client = new Netlify({
       auth: { token: process.env.NETLIFY_API_TOKEN },
    });
    
    // On déclenche la fonction de fond et on lui passe le jobId et le username
    await client.functions.invoke({
        siteID: process.env.SITE_ID, // Netlify fournit automatiquement cette variable
        name: "process-analysis",
        body: JSON.stringify({ jobId, username }),
    });

    // 3. Renvoyer le jobId au frontend si tout s'est bien passé
    return {
      statusCode: 200,
      body: JSON.stringify({ jobId }),
    };

  } catch (error) {
    // Si n'importe quelle étape ci-dessus échoue, on attrape l'erreur ici
    console.error("Erreur dans start-analysis:", error);
    return {
      statusCode: 500,
      // On renvoie un message d'erreur clair au format JSON
      body: JSON.stringify({ error: error.message }),
    };
  }
};
