import React from 'react';
import { PersonalRecord } from '../types';
import { Trophy } from 'lucide-react';

interface HistoryProps {
  prs: PersonalRecord[];
}

export const History: React.FC<HistoryProps> = ({ prs }) => {
  const mockCompletedWorkouts = [
    {
      id: 'comp-1',
      title: 'Push Day A - Chest & Triceps',
      completedAt: '2026-08-10T17:45:00Z',
      durationMinutes: 52,
      totalVolumeLbs: 14250,
      setsLogged: 12,
    },
    {
      id: 'comp-2',
      title: 'Pull Day B - Heavy Back',
      completedAt: '2026-08-08T18:15:00Z',
      durationMinutes: 58,
      totalVolumeLbs: 18400,
      setsLogged: 15,
    },
    {
      id: 'comp-3',
      title: 'Leg Day C - Quad Hypertrophy',
      completedAt: '2026-08-06T15:30:00Z',
      durationMinutes: 65,
      totalVolumeLbs: 22100,
      setsLogged: 14,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="font-mono text-xs uppercase font-bold text-[#ff4d00]">Activity Logs</p>
          <h2 className="font-oswald text-4xl font-semibold uppercase text-[#1a1a1a] mt-1">
            Workout History & PRs
          </h2>
          <p className="font-mono text-xs text-[#1a1a1a]/60 mt-1">
            Persisted in SSMS `WorkoutLogs` & `SetLogs` with IX_SetLogs_Exercise_Weight.
          </p>
        </div>

        <div className="font-mono text-xs font-bold text-[#ff4d00] bg-[#f8f7f4] px-3 py-1.5 border-2 border-[#1a1a1a]">
          ALL-TIME PRs: {prs.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PERSONAL RECORDS HALL OF FAME */}
        <div className="lg:col-span-1 border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] space-y-4">
          <div className="border-b-2 border-[#1a1a1a] pb-4">
            <h3 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#ff4d00]" />
              PR Hall of Fame
            </h3>
            <p className="font-mono text-xs text-[#1a1a1a]/60 mt-0.5">Max lifts achieved</p>
          </div>

          <div className="space-y-3">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[0.6rem] bg-[#1a1a1a] text-white px-2 py-0.5 font-bold uppercase">
                    {pr.muscleGroup}
                  </span>
                  <span className="font-mono text-[10px] text-[#1a1a1a]/60 font-semibold">
                    {new Date(pr.achievedAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-oswald text-lg uppercase font-semibold text-[#1a1a1a]">{pr.exerciseName}</h4>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-mono text-lg font-bold text-[#ff4d00]">
                    {pr.weightLbs} lbs × {pr.reps}
                  </span>
                  <span className="font-mono text-xs text-[#1a1a1a]/70">
                    1RM: <strong className="font-mono text-[#1a1a1a]">{pr.estimated1RM} lbs</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPLETED WORKOUT TIMELINE */}
        <div className="lg:col-span-2 border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#1a1a1a] space-y-4">
          <div className="border-b-2 border-[#1a1a1a] pb-4">
            <h3 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">Completed Sessions</h3>
            <p className="font-mono text-xs text-[#1a1a1a]/60 mt-0.5">Past volume and duration breakdown</p>
          </div>

          <div className="space-y-3">
            {mockCompletedWorkouts.map((session) => (
              <div
                key={session.id}
                className="p-4 bg-[#f8f7f4] border border-[#1a1a1a] space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h4 className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a]">{session.title}</h4>
                    <span className="font-mono text-[11px] text-[#1a1a1a]/60 block mt-0.5">
                      Completed {new Date(session.completedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] bg-[#1a1a1a] text-white px-2 py-0.5 font-bold uppercase">
                    COMPLETED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#1a1a1a]/20 text-xs font-mono">
                  <div className="p-2 bg-white border border-[#1a1a1a] text-center">
                    <span className="text-[0.6rem] uppercase text-[#1a1a1a]/60 font-bold block">Volume</span>
                    <span className="font-mono font-bold text-[#ff4d00] text-sm">
                      {session.totalVolumeLbs.toLocaleString()} lbs
                    </span>
                  </div>

                  <div className="p-2 bg-white border border-[#1a1a1a] text-center">
                    <span className="text-[0.6rem] uppercase text-[#1a1a1a]/60 font-bold block">Duration</span>
                    <span className="font-mono font-bold text-[#1a1a1a] text-sm">
                      {session.durationMinutes} mins
                    </span>
                  </div>

                  <div className="p-2 bg-white border border-[#1a1a1a] text-center">
                    <span className="text-[0.6rem] uppercase text-[#1a1a1a]/60 font-bold block">Sets</span>
                    <span className="font-mono font-bold text-[#1a1a1a] text-sm">
                      {session.setsLogged}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


