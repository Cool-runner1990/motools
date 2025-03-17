// @ts-nocheck
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";


const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      });
    }
  
    const { email, password } = await req.json();

    // Step 1: Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      throw new Error("Invalid credentials");
    }

    const userId = authData.user.id;

    // Step 2: Fetch user profile from the "users" table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id, name, last_name, profile_image")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      throw new Error("User profile not found");
    }

    // Step 3: Return auth and profile data
    return new Response(JSON.stringify({
      ...authData.session,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: userProfile
      }
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
})
