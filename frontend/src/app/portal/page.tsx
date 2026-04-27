"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getTafheemLink } from "@/lib/quran_utils";
import { Calendar, Book, Clock, MapPin, Search, ChevronRight, Loader2, ExternalLink } from "lucide-react";

export default function AttendeePortal() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [schedule, setSchedule] = useState<any[]>([]);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch Syllabus
      const { data: sylData } = await supabase
        .from('syllabus_topics')
        .select('*')
        .order('topic_number');
      setSyllabus(sylData || []);

      // Fetch Sessions (Schedule)
      const { data: sessData } = await supabase
        .from('sessions')
        .select(`
          *,
          quran_circles(name),
          syllabus_topics(title, reference)
        `)
        .order('session_date', { ascending: true })
        .gte('session_date', new Date().toISOString().split('T')[0]); // Only future/today
      
      setSchedule(sessData || []);
      setLoading(false);
    }
    
    fetchData();
  }, []);

  const categories = ["All", "Quran Circle", "Ijtima Arkan", "Dars-e-Quran", "Other"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredSchedule = schedule.filter(item => {
    const catMatch = item.category.replace('_', ' ').toLowerCase();
    const isCatMatched = selectedCategory === "All" || catMatch === selectedCategory.toLowerCase();
    const isSearchMatched = (item.syllabus_topics?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.quran_circles?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return isCatMatched && isSearchMatched;
  });

  const filteredSyllabus = syllabus.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.reference && item.reference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-emerald-800 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-8 pb-10 shadow-lg">
        <h1 className="text-3xl font-black tracking-tight text-center">Attendee Portal</h1>
        <p className="text-emerald-100/70 text-center text-xs font-bold uppercase tracking-[0.3em] mt-2">Dawat-e-Quran • Zone 5</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white sticky top-0 z-30 shadow-sm px-4">
        <button 
          onClick={() => setActiveTab("schedule")}
          className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'schedule' ? 'text-emerald-700 border-emerald-700' : 'text-gray-400 border-transparent'}`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'schedule' ? 'text-emerald-600' : 'text-gray-300'}`} />
          Schedule
        </button>
        <button 
          onClick={() => setActiveTab("syllabus")}
          className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'syllabus' ? 'text-emerald-700 border-emerald-700' : 'text-gray-400 border-transparent'}`}
        >
          <Book className={`w-4 h-4 ${activeTab === 'syllabus' ? 'text-emerald-600' : 'text-gray-300'}`} />
          Syllabus
        </button>
      </div>

      <div className="p-5 space-y-6 mt-2 relative z-10">
        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder={activeTab === "schedule" ? "Search circles or topics..." : "Search topics or references..."}
              className="w-full bg-white border-0 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none shadow-xl shadow-emerald-900/5 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-4.5 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
          </div>

          {activeTab === "schedule" && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-gray-400 border border-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-20" />
            <p className="font-black text-sm uppercase tracking-widest opacity-40">Loading Portal...</p>
          </div>
        ) : activeTab === "schedule" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-gray-900 font-black text-lg">Upcoming Events</h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{filteredSchedule.length} found</span>
            </div>
            {filteredSchedule.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex gap-5 items-start relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0">
                   <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl text-white ${item.category === 'quran_circle' ? 'bg-blue-500' : item.category === 'ijtima_arkan' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                    {item.category.replace('_', ' ')}
                   </span>
                </div>
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[70px] border border-emerald-100">
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-60">
                    {new Date(item.session_date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-black">{new Date(item.session_date).getDate()}</span>
                </div>
                <div className="flex-1 space-y-3 pt-1">
                  <h3 className="font-black text-gray-900 leading-tight pr-12 text-lg">
                    {item.syllabus_topics?.title || "Special Session"}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                      <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      {item.quran_circles?.name || 'General Circle'}
                    </div>
                    {item.syllabus_topics?.reference && (
                      <a 
                        href={getTafheemLink(item.syllabus_topics.reference) || "#"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[11px] text-emerald-600 font-black hover:text-emerald-800 transition-colors bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"
                      >
                        <Book className="w-3.5 h-3.5" />
                        {item.syllabus_topics.reference}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {item.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredSchedule.length === 0 && (
              <div className="text-center py-20 px-10">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold">No upcoming events found</p>
                <p className="text-gray-400 text-xs mt-1">Try changing the category or search query.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-gray-900 font-black text-lg">Syllabus Overview</h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{filteredSyllabus.length} topics</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {filteredSyllabus.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-gray-900 leading-tight">{item.title}</h3>
                    <a 
                      href={getTafheemLink(item.reference) || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-1.5"
                    >
                      {item.reference}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  </div>
                  <div className="bg-gray-50 w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-gray-400 border group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                    #{item.topic_number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 px-8 text-center pb-20">
        <div className="w-12 h-1 bg-gray-100 mx-auto mb-6 rounded-full"></div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
          Need help or want to join a circle? <br />
          Contact your local Union Council representative.
        </p>
      </div>
    </div>
  );
}