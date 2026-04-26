import React from 'react';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Rocket } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { useAppContext } from '../context/AppContext';

export default function CalendarView() {
  const { state } = useAppContext();
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  
  const days = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));

  const getScheduledItems = (date: Date) => {
    return state.variants.filter(v => v.scheduledFor && format(new Date(v.scheduledFor), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Content Calendar</h1>
          <p className="text-gray-400">Schedule your generated variants for auto-publishing.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-white/10 rounded-lg bg-[#111113] p-1">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></Button>
             <span className="text-sm font-medium px-4">{format(startDate, 'MMMM yyyy')}</span>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Button variant="neon" className="gap-2">
            <Plus className="w-4 h-4" />
            Schedule Mix
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#111113] bg-opacity-30 border border-white/10 rounded-xl overflow-hidden flex flex-col">
       
        {/* Header Days */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-[#111113] shrink-0">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 items-center justify-center flex text-xs font-bold text-gray-500 tracking-wider uppercase border-r border-white/10 last:border-0">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
           {days.map((date, i) => {
             const items = getScheduledItems(date);
             const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

             return (
               <div key={i} className="min-h-[140px] border-r border-b border-white/10 last:border-r-0 p-2 flex flex-col gap-2 relative group hover:bg-[#111113] transition-colors">
                 <div className="flex justify-between items-start">
                   <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500'}`}>
                     {format(date, 'd')}
                   </span>
                   <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white p-1">
                     <Plus className="w-3 h-3" />
                   </button>
                 </div>
                 
                 <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                   {items.map(item => (
                     <div key={item.id} className="bg-white/5 border border-white/10 rounded-md p-1.5 flex gap-2 cursor-pointer hover:border-white/20 transition-colors">
                       <img src={item.thumbnail} className="w-8 h-10 object-cover rounded bg-[#0B0B0C] shrink-0" alt="thumbnail" />
                       <div className="flex flex-col min-w-0 flex-1">
                         <span className="text-[10px] font-medium truncate mb-1">Mix #{item.id.replace('var', '')}</span>
                         <span className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                           <Rocket className="w-2.5 h-2.5" /> 
                           {format(new Date(item.scheduledFor!), 'h:mm a')}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
}
