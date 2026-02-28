import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!
    const GITHUB_OWNER = Deno.env.get('GITHUB_OWNER')!
    const GITHUB_REPO = Deno.env.get('GITHUB_REPO')!

    const { message, email, page_url, user_agent } = await req.json()

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Save to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: feedbackRow, error: dbError } = await supabase
      .from('feedback')
      .insert({ message, email, page_url, user_agent })
      .select()
      .single()

    if (dbError) throw dbError

    // 2. Create GitHub Issue
    const issueBody = [
      email ? `**From:** ${email}` : '**From:** Anonymous',
      `**Page:** ${page_url || 'Unknown'}`,
      `**Browser:** ${user_agent || 'Unknown'}`,
      `**Submitted:** ${new Date().toISOString()}`,
      '',
      '---',
      '',
      message,
    ].join('\n')

    const githubRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Feedback: ${message.slice(0, 60)}${message.length > 60 ? '...' : ''}`,
          body: issueBody,
          labels: ['user-feedback'],
        }),
      }
    )

    if (!githubRes.ok) {
      const err = await githubRes.text()
      console.error('GitHub API error:', err)
      // Update DB row as failed but don't throw — feedback is saved
      await supabase
        .from('feedback')
        .update({ status: 'failed' })
        .eq('id', feedbackRow.id)

      return new Response(
        JSON.stringify({ success: true, warning: 'Feedback saved but GitHub sync failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const issue = await githubRes.json()

    // 3. Update DB row with GitHub issue details
    await supabase
      .from('feedback')
      .update({
        github_issue_number: issue.number,
        github_issue_url: issue.html_url,
        status: 'synced',
      })
      .eq('id', feedbackRow.id)

    return new Response(
      JSON.stringify({ success: true, issue_url: issue.html_url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
