// src/app/api/data/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const device = searchParams.get('id');
  const hr = parseInt(searchParams.get('hr') || '0');
  const temp = parseFloat(searchParams.get('temp') || '0');
  const spo2 = parseInt(searchParams.get('spo2') || '0');

  if (!device || !hr || !spo2) {
    return new Response('Missing data', { status: 400 });
  }

  // Auto BP Estimation (realistic formula)
  const bp_sys = Math.round(90 + (hr - 60) * 0.8 + (100 - spo2) * 1.2);
  const bp_dia = Math.round(60 + (hr - 60) * 0.4 + (100 - spo2) * 0.8);

  const { error } = await supabase.from('wristband_data').insert({
    device_id: device,
    hr,
    temp,
    spo2,
    bp_sys,
    bp_dia
  });

  return new Response(error ? 'Error' : 'OK', { status: 200 });
}