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
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

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
    serial_number,
    battery,
    can,
    gprs,
    gps,
    ignition,
    power,
    tacho_connection_test,
    last_data_received,
    last_calibration,
    last_calibration_date,
    next_calibration,
    next_calibration_date,
    tacho_manufacturer,
    tacho_manufacturer_date,
    tacho_license_plate,
    tacho_license_plate_date,
    tacho_odometer_reading,
    tacho_odometer_reading_date,
    tacho_vin,
    tacho_vin_date,
  } = await req.json();

  
  //first create a new test details row
  const { data: newTestDetailsRow, error: testDetailsError } =
    await supabaseClient
      .from("test_details")
      .insert({
        serial_number,
        test_owner: user.id,
      })
      .select()
  
  if (testDetailsError) {
    return new Response(testDetailsError.message, { status: 401 });
  }

  // Make sure to get the first row from the response array
  const testDetailsId = newTestDetailsRow?.[0]?.id;

  //create a new row in the TestResults table
  const { data: newTestResultRow, error: testResultError } =
    await supabaseClient
      .from("test_results")
      .insert({
        battery,
        can,
        gps,
        gprs,
        power,
        ignition,
        tacho_connection_test,
        last_data_received: convertToSeconds(last_data_received),
        last_calibration: convertToSeconds(last_calibration),
        last_calibration_date: convertToSeconds(last_calibration_date),
        next_calibration: convertToSeconds(next_calibration),
        next_calibration_date: convertToSeconds(next_calibration_date),
        tacho_manufacturer,
        tacho_manufacturer_date: convertToSeconds(tacho_manufacturer_date),
        tacho_license_plate,
        tacho_license_plate_date: convertToSeconds(tacho_license_plate_date),
        tacho_odometer_reading,
        tacho_odometer_reading_date: convertToSeconds(tacho_odometer_reading_date),
        tacho_vin,
        tacho_vin_date: convertToSeconds(tacho_vin_date),
        test_details_id: testDetailsId,
      })
      .select();

  if (testResultError) {
    return new Response(testResultError.message, { status: 401 });
  }

  return new Response(testDetailsId, { status: 200 });
});

function convertToSeconds(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toISOString(); // Converts to 'YYYY-MM-DDTHH:mm:ss.sssZ' format
}
