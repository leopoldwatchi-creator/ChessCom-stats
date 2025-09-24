const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  const { jobId } = event.queryStringParameters;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from('jobs')
    .select('status, results')
    .eq('id', jobId)
    .single(); // On ne s'attend qu'à un seul résultat

  if (error || !data) {
    return { statusCode: 404, body: JSON.stringify({ error: "Job non trouvé." }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
