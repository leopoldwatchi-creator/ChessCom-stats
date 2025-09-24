const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  const { jobId } = event.queryStringParameters;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // On sélectionne maintenant aussi la colonne "progress"
  const { data, error } = await supabase
    .from('jobs')
    .select('status, results, progress')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    return { statusCode: 404, body: JSON.stringify({ error: "Job non trouvé." }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
