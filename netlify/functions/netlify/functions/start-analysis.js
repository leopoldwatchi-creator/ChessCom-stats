const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid'); // Pour générer un ID unique

// La bibliothèque Netlify pour appeler notre fonction de fond
const { VITE_API_TOKEN, Netlify } = require('netlify');

exports.handler = async function (event, context) {
  const { username } = JSON.parse(event.body);

  // Initialisation de Supabase
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // 1. Créer une nouvelle tâche dans la base de données
  const jobId = uuidv4();
  const { data, error } = await supabase
    .from('jobs')
    .insert([{ id: jobId, username: username, status: 'pending' }])
    .select();

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  // 2. Déclencher la fonction de fond de manière asynchrone
  // Note: Vous devrez créer un "Personal Access Token" dans votre compte Netlify
  // et l'ajouter comme variable d'environnement `NETLIFY_API_TOKEN`
  const client = new Netlify({
     auth: { token: process.env.NETLIFY_API_TOKEN },
  });

  // On déclenche la fonction de fond et on lui passe le jobId et le username
  await client.functions.invoke({
      siteID: process.env.SITE_ID, // Netlify fournit automatiquement cette variable
      name: "process-analysis",
      body: JSON.stringify({ jobId, username }),
  });

  // 3. Renvoyer le jobId au frontend pour qu'il puisse suivre la tâche
  return {
    statusCode: 200,
    body: JSON.stringify({ jobId }),
  };
};
