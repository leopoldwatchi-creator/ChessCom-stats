const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
// On met aussi la dépendance Netlify en commentaire car on ne l'utilise pas dans ce test
// const { Netlify } = require('netlify');

exports.handler = async function (event, context) {
  try {
    const { username } = JSON.parse(event.body);

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // 1. Créer une nouvelle tâche dans la base de données
    const jobId = uuidv4();
    const { error: insertError } = await supabase
      .from('jobs')
      .insert([{ id: jobId, username: username, status: 'pending' }]);

    if (insertError) {
      throw new Error(`Erreur Supabase : ${insertError.message}`);
    }

    // 2. DÉCLENCHEMENT DE LA FONCTION DE FOND (DÉSACTIVÉ POUR LE TEST)
    // =================================================================
    /*
    const client = new Netlify({
       auth: { token: process.env.NETLIFY_API_TOKEN },
    });
    
    await client.functions.invoke({
        siteID: process.env.SITE_ID,
        name: "process-analysis",
        body: JSON.stringify({ jobId, username }),
    });
    */
    console.log("TEST: Le déclenchement de la fonction de fond est désactivé.");
    // =================================================================

    // 3. Renvoyer le jobId au frontend si tout s'est bien passé
    return {
      statusCode: 200,
      body: JSON.stringify({ jobId }), // C'est cette ligne que nous testons
    };

  } catch (error) {
    console.error("Erreur dans start-analysis:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
