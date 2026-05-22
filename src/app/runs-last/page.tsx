import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function LastRunPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Middleware should have already redirected if not authenticated,
  // but we keep this as a safety check
  if (!user) {
    return null;
  }

  // fetch most recent run for this user
  // (RLS now also exposes runs linked to public benchmarks, so the
  // user_id filter is required to keep this scoped to the caller.)
  const { data: runs } = await supabase
    .from('runs')
    .select('id,prompt,created_at,models,metrics')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const run = runs?.[0];
  if (!run) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Last <span className="text-orange-400">Run Results</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                View your most recent LLM comparison results and model responses.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Runs Yet</h3>
              <p className="text-gray-600 mb-6">You haven&apos;t created any LLM comparison runs yet. Get started by testing a prompt.</p>
              <a 
                href="/runner"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg inline-block"
              >
                Try the Runner
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // fetch outputs for that run
  const { data: outputs } = await supabase
    .from('run_outputs')
    .select('model,output,created_at')
    .eq('run_id', run.id)
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Last <span className="text-orange-400">Run Results</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              View your most recent LLM comparison results and model responses.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Run Details Card */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Run Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-900">Execution Time:</span>
                <p className="text-sm text-gray-600 mt-1">{new Date(run.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Models Tested:</span>
                <p className="text-sm text-gray-600 mt-1">{run.models?.length || 0} models</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-900">Prompt:</span>
              <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 italic leading-relaxed">{run.prompt}</p>
              </div>
            </div>
          </div>

          {/* Model Responses */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Model Responses</h2>
            <div className="space-y-6">
              {outputs?.length ? outputs.map(o => (
                <div key={o.model} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">{o.model}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">{o.output}</pre>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Outputs Available</h3>
                  <p className="text-sm text-gray-600">No model outputs were stored for this run.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
