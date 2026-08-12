import React, { useState } from 'react';
import { Exercise, MuscleGroup, WeightUnit } from '../types';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { Info, Plus } from 'lucide-react';

interface ExerciseLibraryProps {
  exercises: Exercise[];
  weightUnit?: WeightUnit;
  onAddExercise: (exercise: Exercise) => void;
}

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Chest:     '#ef4444',
  Back:      '#3b82f6',
  Legs:      '#10b981',
  Shoulders: '#f59e0b',
  Arms:      '#f97316',
  Core:      '#8b5cf6',
};

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ exercises, weightUnit = 'lbs', onAddExercise }) => {
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [detailExercise, setDetailExercise]   = useState<Exercise | null>(null);

  const muscleOptions: (MuscleGroup | 'All')[] = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
  const categoryOptions = ['All', 'Compound', 'Isolation'];

  const filtered = exercises.filter(ex => {
    const q = searchQuery.toLowerCase();
    const matchSearch = ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q);
    const matchMuscle   = selectedMuscle === 'All'   || ex.muscleGroup === selectedMuscle;
    const matchCategory = selectedCategory === 'All' || ex.category   === selectedCategory;
    return matchSearch && matchMuscle && matchCategory;
  });

  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    (acc[ex.muscleGroup] ??= []).push(ex);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="font-mono text-xs uppercase font-bold text-[#ff4d00]">Exercise Database</p>
          <h2 className="font-oswald text-4xl font-semibold uppercase text-[#1a1a1a] mt-1">Exercise Library</h2>
          <p className="font-mono text-xs text-[#1a1a1a]/60 mt-1">
            {exercises.length} exercises — click any card to see full details & proper form before adding
          </p>
        </div>
        <div className="font-mono text-[0.6rem] text-[#1a1a1a]/50 uppercase font-bold text-right">
          {filtered.length} showing
        </div>
      </div>

      {/* Filters */}
      <div className="border-2 border-[#1a1a1a] p-4 bg-white shadow-[2px_2px_0_#1a1a1a] flex flex-col gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, muscle group, or equipment..."
          className="border-2 border-[#1a1a1a] p-2.5 font-mono text-sm w-full bg-white"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <span className="font-mono text-[0.6rem] uppercase font-bold text-[#1a1a1a]/50 self-center pr-1">Muscle:</span>
            {muscleOptions.map(m => (
              <button key={m} onClick={() => setSelectedMuscle(m)}
                className={`font-mono text-[0.65rem] px-2.5 py-1 uppercase font-semibold transition cursor-pointer border whitespace-nowrap ${
                  selectedMuscle === m ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#1a1a1a] text-[#1a1a1a]/70 hover:text-[#1a1a1a]'
                }`}>{m}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <span className="font-mono text-[0.6rem] uppercase font-bold text-[#1a1a1a]/50 self-center pr-1">Type:</span>
            {categoryOptions.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`font-mono text-[0.65rem] px-2.5 py-1 uppercase font-semibold transition cursor-pointer border whitespace-nowrap ${
                  selectedCategory === c ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#1a1a1a] text-[#1a1a1a]/70 hover:text-[#1a1a1a]'
                }`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise grid — grouped by muscle */}
      {Object.entries(grouped).map(([muscleGroup, exList]) => {
        const color = MUSCLE_COLORS[muscleGroup as MuscleGroup] || '#1a1a1a';
        return (
          <div key={muscleGroup} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 border-2 border-[#1a1a1a]" style={{ backgroundColor: color }} />
              <h3 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">{muscleGroup}</h3>
              <span className="font-mono text-[0.6rem] text-[#1a1a1a]/50 uppercase">({exList.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {exList.map(ex => (
                <div
                  key={ex.id}
                  className="group border-2 border-[#1a1a1a] bg-white hover:shadow-[4px_4px_0_#1a1a1a] transition-all cursor-pointer"
                  onClick={() => setDetailExercise(ex)}
                >
                  {/* Color accent top bar */}
                  <div className="h-1" style={{ backgroundColor: color }} />

                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-oswald uppercase text-base font-semibold text-[#1a1a1a] group-hover:text-[#ff4d00] transition leading-tight">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-[0.55rem] uppercase font-bold text-[#1a1a1a]/50">{ex.equipment}</span>
                        <span className="font-mono text-[0.55rem] text-[#1a1a1a]/30">•</span>
                        <span className="font-mono text-[0.55rem] uppercase font-bold"
                          style={{ color: ex.category === 'Compound' ? '#ff4d00' : '#6b7280' }}>
                          {ex.category}
                        </span>
                      </div>
                    </div>

                    <p className="font-mono text-[0.6rem] text-[#1a1a1a]/60 leading-relaxed line-clamp-2">
                      {ex.instructions}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-[#1a1a1a]/10">
                      <button
                        onClick={e => { e.stopPropagation(); setDetailExercise(ex); }}
                        className="flex items-center gap-1 font-mono text-[0.6rem] uppercase font-bold text-[#1a1a1a]/60 hover:text-[#ff4d00] transition cursor-pointer"
                      >
                        <Info className="w-3 h-3" /> Details
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onAddExercise(ex); }}
                        className="ml-auto flex items-center gap-1 font-mono text-[0.6rem] uppercase font-bold bg-[#1a1a1a] text-[#f8f7f4] px-2 py-1 hover:bg-[#ff4d00] transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16 font-mono text-xs text-[#1a1a1a]/40 uppercase">
          No exercises match your filters.
        </div>
      )}

      {/* Exercise detail modal */}
      <ExerciseDetailModal
        exercise={detailExercise}
        isOpen={detailExercise !== null}
        onClose={() => setDetailExercise(null)}
        onAdd={onAddExercise}
      />
    </div>
  );
};
