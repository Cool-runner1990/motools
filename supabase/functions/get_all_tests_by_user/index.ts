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
  const token = authHeader.replace("Bearer ", "");

  // Initialize Supabase client with correct auth headers
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
 
  try {
    const url = new URL(req.url);


  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);

  if (authError) {
    return new Response(authError.message, { status: 401 });
  }
  const userId = user.id;

    // Call stored procedure with filters
    const { data, error } = await supabaseClient.rpc("get_all_tests_by_user", {
      p_user_id: userId,
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
  


});