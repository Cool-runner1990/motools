// @ts-nocheck
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // Ensure we have an authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized request" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Initialize Supabase client with correct auth headers
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  const test_id = new URL(req.url).searchParams.get("test_id");

  if (!test_id) {
    return new Response(JSON.stringify({ error: "Missing test_id parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: testDetails, error: testDetailsError } = await supabaseClient.from('test_details')
    .select('*')
    .eq("id", test_id)
    .single();

  if (testDetailsError) {
    return new Response(JSON.stringify({ error: testDetailsError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }


  const { data: testResults, error: testResultsError } = await supabaseClient
    .from("test_results")
    .select("*") // Ensure you select all fields
    .eq("test_details_id", test_id)
    .maybeSingle(); // Use maybeSingle() to allow null values

  if (testResultsError) {
    return new Response(JSON.stringify({ error: testResultsError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      test_details: testDetails,
      test_results: testResults || null, // Return null if no test results
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});