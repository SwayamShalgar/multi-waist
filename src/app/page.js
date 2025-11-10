// src/app/page.js
import { createClient } from '@supabase/supabase-js';
import { Heart, Thermometer, Droplet, Activity, Wifi, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const revalidate = 10; // Auto refresh every 10 sec

// Helper function to get status color based on vital signs
function getVitalStatus(type, value) {
  switch(type) {
    case 'hr':
      if (value < 60 || value > 100) return 'text-red-500';
      if (value < 70 || value > 90) return 'text-yellow-500';
      return 'text-green-500';
    case 'temp':
      if (value < 36 || value > 37.5) return 'text-red-500';
      if (value < 36.5 || value > 37.2) return 'text-yellow-500';
      return 'text-green-500';
    case 'spo2':
      if (value < 95) return 'text-red-500';
      if (value < 97) return 'text-yellow-500';
      return 'text-green-500';
    case 'bp':
      const [sys, dia] = value;
      if (sys > 140 || sys < 90 || dia > 90 || dia < 60) return 'text-red-500';
      if (sys > 130 || sys < 100 || dia > 85 || dia < 65) return 'text-yellow-500';
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

export default async function Home() {
  const { data } = await supabase
    .from('wristband_data')
    .select('*')
    .order('created_at', { ascending: false });

  const devices = [...new Set(data?.map(d => d.device_id) || [])];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-10 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Live Wristband Monitor
                </h1>
                <p className="text-sm text-gray-500 mt-1">Real-time health vitals tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
            <Link
                href="/analytics-built-in"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Stats Overview */}
        <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-700">
                {devices.length} Device{devices.length !== 1 ? 's' : ''} Connected
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Auto-refresh: 10s</span>
            </div>
          </div>
        </div>

        {/* Device Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => {
            const latest = data.find(d => d.device_id === device);
            if (!latest) return null;

            const hrStatus = getVitalStatus('hr', latest.hr);
            const tempStatus = getVitalStatus('temp', latest.temp);
            const spo2Status = getVitalStatus('spo2', latest.spo2);
            const bpStatus = getVitalStatus('bp', [latest.bp_sys, latest.bp_dia]);

            return (
              <div 
                key={device} 
                className="group bg-white rounded-3xl shadow-xl p-8 border border-indigo-100 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Device Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {device}
                    </h2>
                  </div>
                  <TrendingUp className="w-6 h-6 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Vitals Grid */}
                <div className="space-y-4">
                  {/* Heart Rate */}
                  <div className="bg-linear-to-r from-red-50 to-pink-50 rounded-2xl p-4 border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                          <Heart className="w-6 h-6 text-red-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Heart Rate</p>
                          <p className={`text-2xl font-bold ${hrStatus}`}>
                            {latest.hr}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">BPM</span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                          <Thermometer className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Temperature</p>
                          <p className={`text-2xl font-bold ${tempStatus}`}>
                            {latest.temp}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">°C</span>
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                          <Droplet className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Blood Oxygen</p>
                          <p className={`text-2xl font-bold ${spo2Status}`}>
                            {latest.spo2}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">%</span>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm">
                          <Activity className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Blood Pressure</p>
                          <p className={`text-2xl font-bold ${bpStatus}`}>
                            {latest.bp_sys}/{latest.bp_dia}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">mmHg</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Updated: {new Date(latest.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {devices.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full mb-6 animate-pulse">
              <Activity className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-700 mb-2">
              Waiting for wristband data...
            </h3>
            <p className="text-gray-500">
              Devices will appear here once they start transmitting data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}