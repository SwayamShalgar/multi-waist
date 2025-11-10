'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Heart, Thermometer, Droplet, BarChart3, Download, Filter } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BuiltInAnalytics() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    
    // Calculate time range
    const now = new Date();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    const startTime = new Date(now.getTime() - timeRanges[timeRange]);

    const { data: rawData, error } = await supabase
      .from('wristband_data')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    if (!error && rawData) {
      setData(rawData);
      const filteredData = deviceFilter === 'ALL' ? rawData : rawData.filter(d => d.device_id === deviceFilter);
      setFiltered(filteredData);
      calculateStats(filteredData);
    }
    
    setLoading(false);
  };

  const calculateStats = (dataSet) => {
    const data = dataSet;
    if (data.length === 0) return;

    const devices = [...new Set(data.map(d => d.device_id))];
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    const stats = {
      avgHR: (data.reduce((sum, d) => sum + d.hr, 0) / data.length).toFixed(1),
      avgTemp: (data.reduce((sum, d) => sum + d.temp, 0) / data.length).toFixed(1),
      avgSpO2: (data.reduce((sum, d) => sum + d.spo2, 0) / data.length).toFixed(1),
      minHR: Math.min(...data.map(d => d.hr)),
      maxHR: Math.max(...data.map(d => d.hr)),
      totalReadings: data.length,
      devices: devices.length,
      hrTrend: previous ? ((latest.hr - previous.hr) / previous.hr * 100).toFixed(1) : 0,
      tempTrend: previous ? ((latest.temp - previous.temp) / previous.temp * 100).toFixed(1) : 0,
      spo2Trend: previous ? ((latest.spo2 - previous.spo2) / previous.spo2 * 100).toFixed(1) : 0,
    };

    setStats(stats);
  };

  const formatChartData = () => {
    return filtered.map(d => ({
      time: new Date(d.created_at).toLocaleTimeString(),
      hr: d.hr,
      temp: d.temp,
      spo2: d.spo2,
      bp_sys: d.bp_sys,
      bp_dia: d.bp_dia,
      device: d.device_id,
    }));
  };

  // Heart rate distribution buckets
  const hrDistribution = () => {
    const buckets = [50,60,70,80,90,100,110,120];
    const counts = buckets.map((upper,i) => {
      const lower = i === 0 ? 0 : buckets[i-1];
      const inBucket = filtered.filter(d => d.hr >= lower && d.hr < upper);
      return { range: `${lower}-${upper-1}`, count: inBucket.length };
    });
    const over = filtered.filter(d => d.hr >= buckets[buckets.length-1]);
    counts.push({ range: `${buckets[buckets.length-1]}+`, count: over.length });
    return counts;
  };

  // Export current filtered dataset as CSV
  const exportCSV = () => {
    if (filtered.length === 0) return;
    const header = ['device_id','hr','temp','spo2','bp_sys','bp_dia','created_at'];
    const rows = filtered.map(d => header.map(h => d[h]).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wristband_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, unit, icon: Icon, trend, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg border border-white/20`}>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white/90 p-3 rounded-xl shadow-sm">
          <Icon className="w-6 h-6 text-gray-700" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${parseFloat(trend) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {parseFloat(trend) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">
        {value} <span className="text-lg text-gray-600">{unit}</span>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-10 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Advanced Analytics
                </h1>
                <p className="text-sm text-gray-500 mt-1">Historical trends and insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md">
                {['1h', '6h', '24h', '7d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Device Filter */}
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-md">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={deviceFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDeviceFilter(val);
                    const filteredData = val === 'ALL' ? data : data.filter(d => d.device_id === val);
                    setFiltered(filteredData);
                    calculateStats(filteredData);
                  }}
                  className="bg-transparent text-sm focus:outline-none"
                >
                  <option value="ALL">All Devices</option>
                  {[...new Set(data.map(d => d.device_id))].map(dev => (
                    <option key={dev} value={dev}>{dev}</option>
                  ))}
                </select>
              </div>
              {/* Export Button */}
              <button
                onClick={exportCSV}
                disabled={filtered.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium shadow-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Activity className="w-4 h-4" />
                Live Monitor
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading analytics...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
            <BarChart3 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Data Available</h3>
            <p className="text-gray-500">Start collecting wristband data to see analytics</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Average Heart Rate"
                value={stats.avgHR}
                unit="BPM"
                icon={Heart}
                trend={stats.hrTrend}
                color="from-red-50 to-pink-50"
              />
              <StatCard
                title="Average Temperature"
                value={stats.avgTemp}
                unit="°C"
                icon={Thermometer}
                trend={stats.tempTrend}
                color="from-orange-50 to-amber-50"
              />
              <StatCard
                title="Average SpO2"
                value={stats.avgSpO2}
                unit="%"
                icon={Droplet}
                trend={stats.spo2Trend}
                color="from-blue-50 to-cyan-50"
              />
              <StatCard
                title="Total Readings"
                value={stats.totalReadings}
                unit="records"
                icon={Activity}
                color="from-purple-50 to-indigo-50"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Heart Rate Chart */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  Heart Rate Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} domain={[50, 120]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Heart Rate (BPM)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Temperature Chart */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Thermometer className="w-6 h-6 text-orange-500" />
                  Temperature Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} domain={[35, 39]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="temp" stroke="#f97316" fill="#fed7aa" strokeWidth={2} name="Temperature (°C)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Blood Oxygen Chart */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Droplet className="w-6 h-6 text-blue-500" />
                  Blood Oxygen (SpO2)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} domain={[90, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="spo2" stroke="#3b82f6" fill="#bfdbfe" strokeWidth={2} name="SpO2 (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Blood Pressure Chart */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-500" />
                  Blood Pressure
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} domain={[50, 150]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bp_sys" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                    <Line type="monotone" dataKey="bp_dia" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heart Rate Distribution */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Heart Rate Distribution
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hrDistribution()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="range" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#6366f1" name="Readings" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 mt-4">Buckets grouped in 10 BPM ranges. Higher distributions may indicate stress or activity periods.</p>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Summary Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Devices</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.devices}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">HR Range</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.minHR} - {stats.maxHR}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time Period</p>
                  <p className="text-2xl font-bold text-gray-800">{timeRange.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Data Points</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalReadings}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
