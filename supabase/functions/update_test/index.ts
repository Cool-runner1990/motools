// @ts-nocheck

import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

//Sample data being received from the device

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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    }
  );

  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser(token);

  if (authError) {
    return new Response(authError.message, { status: 401 });
  }
  const {
    test_id,
    license_plate,
    model,
    tacho_manufacturer,
    installer_name,
    installer_phone,
    installer_company,
  } = await req.json();

  //first create a new test details row
  const { data, error: testDetailsError } = await supabaseClient
    .from("test_details")
    .update({
      license_plate,
      model,
      tacho_manufacturer,
      installer_name,
      installer_phone,
      installer_company
    })
    .eq("id", test_id)
    .select()
    .single();

  if (testDetailsError) {
    return new Response(testDetailsError.message, { status: 401 });
  }

  return Response.json(data, { status: 200 });
});

function convertToSeconds(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toISOString(); // Converts to 'YYYY-MM-DDTHH:mm:ss.sssZ' format
}
