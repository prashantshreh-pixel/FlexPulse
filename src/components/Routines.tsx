import React, { useState } from 'react';
import { WorkoutProgram, Exercise, WorkoutDay } from '../types';
import { Settings, Play, Plus, Trash2, ArrowLeft, GripVertical } from 'lucide-react';

interface RoutinesProps {
  programs: WorkoutProgram[];
  exercises: Exercise[];
  onStartDay: (day: WorkoutDay, programName: string) => void;
  onSaveCustomProgram: (program: WorkoutProgram) => void;
  activeRoutineId: string | null;
  onActivateRoutine: (routineId: string | null) => void;
}

export const Routines: React.FC<RoutinesProps> = ({
  programs, exercises, onStartDay, onSaveCustomProgram,
  activeRoutineId, onActivateRoutine,
}) => {
  const [activeView, setActiveView] = useState<'grid' | 'detail' | 'builder'>('grid');
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);

  // Builder state
  const [buildName, setBuildName] = useState('');
  const [buildDesc, setBuildDesc] = useState('');
  const [buildDays, setBuildDays] = useState<WorkoutDay[]>([]);
  
  // Builder selected day index to add exercises to
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);

  const handleProgramClick = (p: WorkoutProgram) => {
    setSelectedProgram(p);
    setActiveView('detail');
  };

  // ── BUILDER LOGIC ──────────────────────────────────────────────────────────
  const handleAddDay = () => {
    const newDay: WorkoutDay = {
      id: `day-${Date.now()}`,
      name: `Day ${buildDays.length + 1}`,
      exercises: [],
    };
    setBuildDays([...buildDays, newDay]);
    setActiveDayIndex(buildDays.length);
  };

  const handleUpdateDayName = (index: number, name: string) => {
    const updated = [...buildDays];
    updated[index].name = name;
    setBuildDays(updated);
  };

  const handleRemoveDay = (index: number) => {
    const updated = [...buildDays];
    updated.splice(index, 1);
    setBuildDays(updated);
    if (activeDayIndex >= updated.length) {
      setActiveDayIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleAddExerciseToDay = (dayIndex: number, exerciseId: string) => {
    const updated = [...buildDays];
    updated[dayIndex].exercises.push({
      exerciseId,
      sets: 3,
      reps: 10,
    });
    setBuildDays(updated);
  };

  const handleUpdateExerciseInDay = (dayIndex: number, exIndex: number, field: 'sets' | 'reps', value: number) => {
    const updated = [...buildDays];
    updated[dayIndex].exercises[exIndex][field] = value;
    setBuildDays(updated);
  };

  const handleRemoveExerciseFromDay = (dayIndex: number, exIndex: number) => {
    const updated = [...buildDays];
    updated[dayIndex].exercises.splice(exIndex, 1);
    setBuildDays(updated);
  };

  const handleSaveBuilder = () => {
    if (!buildName.trim() || buildDays.length === 0) return;
    
    const newProgram: WorkoutProgram = {
      id: `custom-${Date.now()}`,
      name: buildName,
      description: buildDesc || 'Custom routine created by you.',
      isCustom: true,
      days: buildDays,
    };
    
    onSaveCustomProgram(newProgram);
    
    // Reset builder
    setBuildName('');
    setBuildDesc('');
    setBuildDays([]);
    setActiveView('grid');
  };

  // ── VIEWS ──────────────────────────────────────────────────────────────────
  if (activeView === 'detail' && selectedProgram) {
    const isActive = activeRoutineId !== null && String(activeRoutineId) === String(selectedProgram.id);
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setActiveView('grid')} className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 hover:text-[#ff4d00] transition cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Routines
        </button>
        
        <div className="border-2 border-[#1a1a1a] bg-white p-8 shadow-[6px_6px_0_#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex gap-2 mb-3">
              <span className="font-mono text-[0.6rem] uppercase font-bold px-2 py-0.5 bg-[#1a1a1a] text-white">
                {selectedProgram.days.length} Days
              </span>
              {selectedProgram.isCustom && (
                <span className="font-mono text-[0.6rem] uppercase font-bold px-2 py-0.5 bg-[#ff4d00] text-white">
                  Custom Routine
                </span>
              )}
              {isActive && (
                <span className="font-mono text-[0.6rem] uppercase font-bold px-2 py-0.5 bg-[#ff4d00] text-white animate-pulse">
                  Active Program
                </span>
              )}
            </div>
            <h2 className="font-oswald text-4xl uppercase font-semibold text-[#1a1a1a]">{selectedProgram.name}</h2>
            <p className="font-mono text-sm text-[#1a1a1a]/70 mt-2 leading-relaxed max-w-2xl">
              {selectedProgram.description}
            </p>
          </div>
          <button
            onClick={() => onActivateRoutine(isActive ? null : selectedProgram.id)}
            className={`action-btn ${isActive ? '' : 'primary'} shrink-0 w-full md:w-auto justify-center`}
          >
            {isActive ? 'Deactivate Program' : 'Activate Program'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedProgram.days.map((day, i) => (
            <div key={day.id} className="border-2 border-[#1a1a1a] bg-[#f8f7f4] flex flex-col h-full shadow-[4px_4px_0_#1a1a1a]">
              <div className="p-4 border-b-2 border-[#1a1a1a] bg-white flex justify-between items-center">
                <div>
                  <p className="font-mono text-[0.6rem] uppercase font-bold text-[#ff4d00]">Day 0{i + 1}</p>
                  <h3 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">{day.name}</h3>
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-3">
                {day.exercises.map((dex, j) => {
                  const ex = exercises.find(e => e.id === dex.exerciseId);
                  return (
                    <div key={j} className="flex justify-between items-start border-b border-[#1a1a1a]/10 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-mono text-[0.7rem] uppercase font-bold text-[#1a1a1a] leading-tight">
                          {ex?.name || 'Unknown Exercise'}
                        </p>
                        <p className="font-mono text-[0.55rem] uppercase text-[#1a1a1a]/50">
                          {ex?.muscleGroup} • {ex?.equipment}
                        </p>
                      </div>
                      <span className="font-mono text-[0.65rem] font-bold text-[#1a1a1a] bg-white border border-[#1a1a1a]/20 px-1.5 py-0.5 whitespace-nowrap">
                        {dex.sets} × {dex.reps}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === 'builder') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => setActiveView('grid')} className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 hover:text-[#ff4d00] transition cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Cancel Build
          </button>
          <button onClick={handleSaveBuilder} disabled={!buildName.trim() || buildDays.length === 0}
            className="action-btn primary disabled:opacity-50 disabled:cursor-not-allowed">
            Save Custom Routine
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Build Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] space-y-4">
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Routine Name</label>
                <input type="text" value={buildName} onChange={e => setBuildName(e.target.value)} placeholder="e.g. Bro Split V2"
                  className="w-full border-2 border-[#1a1a1a] p-3 font-oswald text-xl uppercase font-semibold bg-[#f8f7f4]" />
              </div>
              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 block mb-1">Description (Optional)</label>
                <textarea value={buildDesc} onChange={e => setBuildDesc(e.target.value)} placeholder="Focusing on hypertrophy..."
                  className="w-full border-2 border-[#1a1a1a] p-3 font-mono text-sm bg-[#f8f7f4] h-20 resize-none" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a]">Training Days</h3>
              <button onClick={handleAddDay} className="flex items-center gap-1 font-mono text-xs uppercase font-bold text-[#1a1a1a] hover:text-[#ff4d00] transition cursor-pointer">
                <Plus className="w-4 h-4" /> Add Day
              </button>
            </div>

            {buildDays.length === 0 ? (
              <div className="border-2 border-dashed border-[#1a1a1a]/30 p-10 text-center text-[#1a1a1a]/50 font-mono text-sm uppercase">
                Add a day to start building your routine.
              </div>
            ) : (
              <div className="space-y-4">
                {buildDays.map((day, i) => (
                  <div key={day.id} className={`border-2 border-[#1a1a1a] transition-all ${activeDayIndex === i ? 'bg-white shadow-[4px_4px_0_#ff4d00] border-[#ff4d00]' : 'bg-[#f8f7f4] shadow-[4px_4px_0_#1a1a1a]'}`}>
                    <div className="p-4 border-b-2 border-[#1a1a1a] flex justify-between items-center bg-white cursor-pointer" onClick={() => setActiveDayIndex(i)}>
                      <div className="flex items-center gap-3 w-full">
                        <GripVertical className="w-5 h-5 text-[#1a1a1a]/30" />
                        <span className="font-mono text-xs uppercase font-bold text-[#ff4d00] w-12">Day {i+1}</span>
                        <input type="text" value={day.name} onChange={e => handleUpdateDayName(i, e.target.value)} placeholder="e.g. Pull Day"
                          className="flex-1 font-oswald text-lg uppercase font-semibold bg-transparent focus:outline-none border-b border-transparent focus:border-[#1a1a1a]/20" onClick={e => e.stopPropagation()} />
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleRemoveDay(i); }} className="text-[#1a1a1a]/40 hover:text-red-500 transition cursor-pointer ml-4 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {activeDayIndex === i && (
                      <div className="p-4 space-y-2">
                        {day.exercises.length === 0 ? (
                          <p className="font-mono text-xs text-[#1a1a1a]/40 uppercase text-center py-4">
                            Select exercises from the library on the right to add to this day.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_60px_60px_40px] gap-2 px-2 pb-1 border-b border-[#1a1a1a]/10">
                              <span className="font-mono text-[0.55rem] uppercase font-bold text-[#1a1a1a]/50">Exercise</span>
                              <span className="font-mono text-[0.55rem] uppercase font-bold text-[#1a1a1a]/50 text-center">Sets</span>
                              <span className="font-mono text-[0.55rem] uppercase font-bold text-[#1a1a1a]/50 text-center">Reps</span>
                              <span></span>
                            </div>
                            {day.exercises.map((dex, j) => {
                              const ex = exercises.find(e => e.id === dex.exerciseId);
                              return (
                                <div key={j} className="grid grid-cols-[1fr_60px_60px_40px] gap-2 items-center bg-white border border-[#1a1a1a]/20 p-2">
                                  <div>
                                    <p className="font-mono text-xs uppercase font-bold text-[#1a1a1a] truncate">{ex?.name}</p>
                                    <p className="font-mono text-[0.55rem] text-[#1a1a1a]/50 uppercase truncate">{ex?.muscleGroup}</p>
                                  </div>
                                  <input type="number" min={1} value={dex.sets} onChange={e => handleUpdateExerciseInDay(i, j, 'sets', parseInt(e.target.value)||1)}
                                    className="w-full border border-[#1a1a1a] p-1 font-mono text-sm text-center" />
                                  <input type="number" min={1} value={dex.reps} onChange={e => handleUpdateExerciseInDay(i, j, 'reps', parseInt(e.target.value)||1)}
                                    className="w-full border border-[#1a1a1a] p-1 font-mono text-sm text-center" />
                                  <button onClick={() => handleRemoveExerciseFromDay(i, j)} className="w-full flex justify-center text-[#1a1a1a]/40 hover:text-red-500 cursor-pointer">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exercise Selection Sidebar */}
          <div className="border-2 border-[#1a1a1a] bg-white shadow-[4px_4px_0_#1a1a1a] sticky top-6 max-h-[calc(100vh-120px)] flex flex-col">
            <div className="p-4 border-b-2 border-[#1a1a1a] bg-[#1a1a1a] text-white">
              <h3 className="font-oswald text-lg uppercase font-semibold">Exercise Library</h3>
              <p className="font-mono text-[0.65rem] opacity-70">Add to active day (Day {activeDayIndex + 1})</p>
            </div>
            
            <div className="p-3 border-b border-[#1a1a1a]/10 bg-[#f8f7f4]">
               {/* Quick filter could go here */}
               <p className="font-mono text-[0.6rem] uppercase text-[#1a1a1a]/60 text-center">Click exercise to add to day</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {buildDays.length === 0 ? (
                <div className="p-4 text-center font-mono text-[0.65rem] text-[#1a1a1a]/40 uppercase">
                  Add a day first.
                </div>
              ) : (
                exercises.map(ex => (
                  <button key={ex.id} onClick={() => handleAddExerciseToDay(activeDayIndex, ex.id)}
                    className="w-full text-left p-2 hover:bg-[#1a1a1a] hover:text-white transition cursor-pointer border border-transparent hover:border-[#1a1a1a] flex justify-between items-center group">
                    <div>
                      <p className="font-oswald text-sm uppercase leading-tight">{ex.name}</p>
                      <p className="font-mono text-[0.55rem] uppercase opacity-50 group-hover:opacity-70">{ex.muscleGroup}</p>
                    </div>
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // default grid view
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="font-mono text-xs uppercase font-bold text-[#ff4d00]">Program Selection</p>
          <h2 className="font-oswald text-4xl font-semibold uppercase text-[#1a1a1a] mt-1">
            Workout Routines
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/70 mt-2 max-w-xl leading-relaxed">
            Select a structured program based on your goals, or build your own custom routine.
          </p>
        </div>
        <button onClick={() => setActiveView('builder')} className="action-btn">
          <Settings className="w-4 h-4" />
          <span>Routine Builder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map(p => (
          <div key={p.id} onClick={() => handleProgramClick(p)}
            className="group border-2 border-[#1a1a1a] bg-white hover:shadow-[8px_8px_0_#1a1a1a] hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden">
            
            {p.isCustom && (
              <div className="absolute top-3 right-[-30px] bg-[#ff4d00] text-white font-mono text-[0.55rem] uppercase font-bold py-1 w-[100px] text-center rotate-45 shadow-sm">
                CUSTOM
              </div>
            )}
            
            <div className="p-6 border-b-2 border-[#1a1a1a] bg-[#f8f7f4]">
              <span className="font-mono text-[0.6rem] uppercase font-bold px-2 py-0.5 border border-[#1a1a1a] bg-white text-[#1a1a1a]">
                {p.days.length} Days / Week
              </span>
              <h3 className="font-oswald text-2xl uppercase font-semibold text-[#1a1a1a] mt-3 group-hover:text-[#ff4d00] transition">
                {p.name}
              </h3>
            </div>
            <div className="p-6 flex-1 bg-white">
              <p className="font-mono text-xs text-[#1a1a1a]/70 leading-relaxed line-clamp-3">
                {p.description}
              </p>
            </div>
            <div className="p-4 border-t border-[#1a1a1a]/10 bg-white flex justify-between items-center group-hover:bg-[#1a1a1a] group-hover:text-white transition">
              <span className="font-mono text-[0.65rem] uppercase font-bold tracking-wider">
                View Routine
              </span>
              <Play className="w-4 h-4 fill-current opacity-50 group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
