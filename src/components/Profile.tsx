import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldAlert, Award, FileText, CheckCircle2, Dumbbell, Upload, Save, HelpCircle, Edit3, X, Ruler } from 'lucide-react';
import { WorkoutProgram, PersonalRecord } from '../types';

interface ProfileProps {
  token: string | null;
  username: string | null;
  programs: WorkoutProgram[];
  activeRoutineId: string | null;
  onActivateRoutine: (id: string | null) => void;
  prs: PersonalRecord[];
}

interface ProfileFields {
  username: string;
  email: string;
  password?: string;
  profile: {
    preferred_unit: string;
    default_rest_duration: number;
    bio: string;
    profile_picture: string;
    background_picture: string;
    
    // Gym & Fitness Metrics
    height: string;
    weight: string;
    body_fat: string;
    chest: string;
    waist: string;
    biceps: string;
    thighs: string;
    calves: string;
  };
}

export const Profile: React.FC<ProfileProps> = ({
  token,
  username,
  programs,
  activeRoutineId,
  onActivateRoutine,
  prs
}) => {
  const [profileData, setProfileData] = useState<ProfileFields>({
    username: username || '',
    email: '',
    password: '',
    profile: {
      preferred_unit: 'lbs',
      default_rest_duration: 90,
      bio: '',
      profile_picture: '',
      background_picture: '',
      height: '',
      weight: '',
      body_fat: '',
      chest: '',
      waist: '',
      biceps: '',
      thighs: '',
      calves: ''
    }
  });

  const [originalData, setOriginalData] = useState<ProfileFields | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    async function getProfile() {
      if (!token) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const loaded = {
            username: data.username || '',
            email: data.email || '',
            password: '',
            profile: {
              preferred_unit: data.profile?.preferred_unit || 'lbs',
              default_rest_duration: data.profile?.default_rest_duration || 90,
              bio: data.profile?.bio || '',
              profile_picture: data.profile?.profile_picture || '',
              background_picture: data.profile?.background_picture || '',
              
              // Fitness metrics
              height: data.profile?.height || '',
              weight: data.profile?.weight || '',
              body_fat: data.profile?.body_fat || '',
              chest: data.profile?.chest || '',
              waist: data.profile?.waist || '',
              biceps: data.profile?.biceps || '',
              thighs: data.profile?.thighs || '',
              calves: data.profile?.calves || ''
            }
          };
          setProfileData(loaded);
          setOriginalData(loaded);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    getProfile();
  }, [token]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'bg') => {
    if (!isEditing) return; // Only allow picture uploads when in edit mode
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [type === 'avatar' ? 'profile_picture' : 'background_picture']: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    if (originalData) {
      setProfileData(originalData);
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        username: profileData.username,
        email: profileData.email,
        profile: {
          ...profileData.profile,
          height: profileData.profile.height || null,
          weight: profileData.profile.weight || null,
          body_fat: profileData.profile.body_fat || null,
          chest: profileData.profile.chest || null,
          waist: profileData.profile.waist || null,
          biceps: profileData.profile.biceps || null,
          thighs: profileData.profile.thighs || null,
          calves: profileData.profile.calves || null
        }
      };
      if (profileData.password) {
        payload.password = profileData.password;
      }

      const res = await fetch('http://127.0.0.1:8000/api/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage({ text: 'Profile metrics updated successfully!', type: 'success' });
        const updated = { ...profileData, password: '' };
        setProfileData(updated);
        setOriginalData(updated);
        setIsEditing(false);
      } else {
        const errData = await res.json();
        setMessage({ text: errData.detail || 'Failed to update profile details', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const activeProgram = programs.find(p => String(p.id) === String(activeRoutineId));

  // Dynamic Calculations
  const heightCm = parseFloat(profileData.profile.height) || 0;
  const weightVal = parseFloat(profileData.profile.weight) || 0;
  const bodyFatVal = parseFloat(profileData.profile.body_fat) || 0;
  const waistIn = parseFloat(profileData.profile.waist) || 0;

  const preferredUnit = profileData.profile.preferred_unit;

  // Convert weight to kg for calculations
  const weightKg = preferredUnit === 'lbs' ? weightVal / 2.205 : weightVal;
  const heightM = heightCm / 100;

  // Calculate BMI
  let bmi: number | null = null;
  let bmiCategory = '';
  let bmiColor = '';
  if (heightCm > 0 && weightVal > 0) {
    bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-blue-500';
    } else if (bmi < 25) {
      bmiCategory = 'Normal';
      bmiColor = 'text-emerald-500';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-amber-500';
    } else {
      bmiCategory = 'Obese';
      bmiColor = 'text-red-500';
    }
  }

  // Calculate FFMI (Fat-Free Mass Index)
  let ffmi: number | null = null;
  let ffmiCategory = '';
  if (heightCm > 0 && weightVal > 0 && bodyFatVal > 0) {
    const leanWeightKg = weightKg * (1 - bodyFatVal / 100);
    ffmi = Math.round((leanWeightKg / (heightM * heightM)) * 10) / 10;
    if (ffmi < 18) ffmiCategory = 'Below Average';
    else if (ffmi < 20) ffmiCategory = 'Average / Fit';
    else if (ffmi < 22) ffmiCategory = 'Above Average';
    else if (ffmi < 25) ffmiCategory = 'Excellent';
    else ffmiCategory = 'Genetic Limit / Superior';
  }

  // Calculate Waist-to-Height Ratio
  let waistToHeight: number | null = null;
  let waistToHeightText = '';
  if (heightCm > 0 && waistIn > 0) {
    const waistCm = waistIn * 2.54;
    waistToHeight = Math.round((waistCm / heightCm) * 100) / 100;
    if (waistToHeight <= 0.43) waistToHeightText = 'Lean';
    else if (waistToHeight <= 0.52) waistToHeightText = 'Healthy';
    else if (waistToHeight <= 0.57) waistToHeightText = 'Overweight';
    else waistToHeightText = 'Elevated Risk';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#ff4d00]"></div>
      </div>
    );
  }

  const metricFields = [
    { key: 'height',   label: 'Height',     suffix: 'cm',       step: '0.1' },
    { key: 'weight',   label: 'Weight',     suffix: profileData.profile.preferred_unit, step: '0.1' },
    { key: 'body_fat', label: 'Body Fat',   suffix: '%',        step: '0.1' },
    { key: 'chest',    label: 'Chest Size', suffix: 'in',       step: '0.01' },
    { key: 'waist',    label: 'Waist Size', suffix: 'in',       step: '0.01' },
    { key: 'biceps',   label: 'Biceps',     suffix: 'in',       step: '0.01' },
    { key: 'thighs',   label: 'Thighs',     suffix: 'in',       step: '0.01' },
    { key: 'calves',   label: 'Calves',     suffix: 'in',       step: '0.01' },
  ];

  return (
    <div className="select-none max-w-6xl mx-auto w-full flex flex-col gap-8">
      
      {/* Cover / Background Picture */}
      <div className="relative border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] bg-zinc-200 dark:bg-zinc-800 h-48 md:h-64 overflow-hidden flex items-center justify-center">
        {profileData.profile.background_picture ? (
          <img 
            src={profileData.profile.background_picture} 
            alt="Profile Background" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-[#1a1a1a]/30 dark:text-white/20 font-mono text-sm uppercase">No Cover Background Photo</div>
        )}
        
        {/* Edit Cover Trigger */}
        {isEditing && (
          <label className="absolute bottom-4 right-4 bg-white border-2 border-[#1a1a1a] hover:bg-[#ff4d00] hover:text-white px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase transition flex items-center gap-1.5 shadow-[2px_2px_0_#1a1a1a] cursor-pointer text-[#1a1a1a]">
            <Upload className="w-3 h-3" />
            Upload Cover
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={e => handleImageUpload(e, 'bg')} 
            />
          </label>
        )}
        
        {/* Avatar / Profile Picture */}
        <div className="absolute -bottom-8 left-6 md:left-10 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#1a1a1a] bg-[#f8f7f4] dark:bg-[#111113] shadow-[4px_4px_0_#1a1a1a] overflow-hidden flex items-center justify-center group">
          {profileData.profile.profile_picture ? (
            <img 
              src={profileData.profile.profile_picture} 
              alt="Profile Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-[#1a1a1a]/40 dark:text-white/40" />
          )}
          
          {/* Avatar Upload Overlay */}
          {isEditing && (
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
              <Upload className="w-4 h-4 mb-1" />
              <span className="font-mono text-[9px] uppercase font-bold">Upload</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={e => handleImageUpload(e, 'avatar')} 
              />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-4">
        
        {/* Column 1: Account Settings / Edit Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Account Settings Card */}
          <div className="bg-white dark:bg-[#151518] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <h2 className="font-oswald text-2xl font-bold uppercase tracking-tight flex items-center gap-2 text-[#1a1a1a] dark:text-white">
                <User className="w-6 h-6 text-[#ff4d00]" />
                Account Settings
              </h2>
              {!isEditing ? (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="bg-white hover:bg-[#ff4d00] hover:text-white border-2 border-[#1a1a1a] px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 shadow-[3px_3px_0_#1a1a1a] cursor-pointer text-[#1a1a1a]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-2 border-[#1a1a1a] px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 shadow-[3px_3px_0_#1a1a1a] cursor-pointer text-[#1a1a1a] dark:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div className={`font-mono text-xs border-2 p-3 mb-6 font-bold ${
                message.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500' 
                  : 'bg-red-100 text-red-700 border-red-600 dark:bg-red-950/30 dark:text-red-400 dark:border-red-500'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Username</label>
                  <input 
                    type="text" 
                    required
                    disabled={!isEditing}
                    value={profileData.username}
                    onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                    className={`w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors ${
                      !isEditing ? 'opacity-65 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled={!isEditing}
                    value={profileData.email}
                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                    className={`w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors ${
                      !isEditing ? 'opacity-65 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">
                    Change Password <span className="text-[10px] text-zinc-400 font-normal">(Leave blank to keep current)</span>
                  </label>
                  <input 
                    type="password" 
                    disabled={!isEditing}
                    value={profileData.password || ''}
                    onChange={e => setProfileData({ ...profileData, password: e.target.value })}
                    placeholder={isEditing ? "Enter new password" : "••••••••••••"}
                    className={`w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors ${
                      !isEditing ? 'opacity-65 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Preferred Unit</label>
                  <select
                    disabled={!isEditing}
                    value={profileData.profile.preferred_unit}
                    onChange={e => setProfileData({
                      ...profileData,
                      profile: { ...profileData.profile, preferred_unit: e.target.value }
                    })}
                    className={`w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors ${
                      !isEditing ? 'opacity-65 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed' : ''
                    }`}
                  >
                    <option value="lbs">lbs (Pounds)</option>
                    <option value="kg">kg (Kilograms)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">Bio / Training Philosophy</label>
                <textarea 
                  disabled={!isEditing}
                  value={profileData.profile.bio}
                  onChange={e => setProfileData({
                    ...profileData,
                    profile: { ...profileData.profile, bio: e.target.value }
                  })}
                  rows={4}
                  maxLength={500}
                  placeholder="Describe your training goals, target splits, or dynamic routines..."
                  className={`w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors resize-none ${
                    !isEditing ? 'opacity-65 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-dashed' : ''
                  }`}
                />
                <p className="text-right font-mono text-[9px] text-[#1a1a1a]/40 dark:text-white/40 mt-1">
                  {profileData.profile.bio.length} / 500 characters
                </p>
              </div>
            </form>
          </div>

          {/* Fitness & Body Measurements Card */}
          <div className="bg-white dark:bg-[#151518] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 md:p-8">
            <h2 className="font-oswald text-2xl font-bold uppercase mb-6 tracking-tight flex items-center gap-2 text-[#1a1a1a] dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <Ruler className="w-6 h-6 text-[#ff4d00]" />
              Fitness & Dimensions
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {metricFields.map(field => (
                  <div key={field.key}>
                    <label className="font-mono text-[10px] uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60 block mb-1">
                      {field.label} ({field.suffix})
                    </label>
                    <input 
                      type="number" 
                      step={field.step}
                      disabled={!isEditing}
                      value={(profileData.profile as any)[field.key] || ''}
                      onChange={e => setProfileData({
                        ...profileData,
                        profile: { ...profileData.profile, [field.key]: e.target.value }
                      })}
                      placeholder="--"
                      className={`w-full bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700 px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#ff4d00] dark:text-white transition-colors ${
                        !isEditing ? 'opacity-65 cursor-not-allowed bg-zinc-150 dark:bg-zinc-900 border-dashed text-[#1a1a1a]/80 dark:text-white/80' : ''
                      }`}
                    />
                  </div>
                ))}
              </div>

              {isEditing && (
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="action-btn primary w-full justify-center py-4 text-base font-bold uppercase transition mt-4"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </button>
              )}
            </form>
          </div>

        </div>

        {/* Column 2: Active Plan & PR Summary */}
        <div className="flex flex-col gap-6">
          
          {/* Active Workout Program */}
          <div className="bg-white dark:bg-[#151518] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6">
            <h3 className="font-oswald text-xl font-bold uppercase mb-4 tracking-tight flex items-center gap-2 text-[#1a1a1a] dark:text-white">
              <Dumbbell className="w-5 h-5 text-[#ff4d00]" />
              Active Routine
            </h3>
            
            {activeProgram ? (
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700">
                  <p className="font-mono text-[9px] uppercase font-bold text-[#ff4d00]">Current Program</p>
                  <p className="font-oswald text-xl uppercase font-semibold text-[#1a1a1a] dark:text-white mt-0.5">{activeProgram.name}</p>
                  <p className="font-mono text-xs text-[#1a1a1a]/60 dark:text-white/60 mt-1 line-clamp-2">{activeProgram.description}</p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => onActivateRoutine(null)}
                    className="flex-1 font-mono text-xs font-bold uppercase bg-red-100 hover:bg-red-200 text-red-700 border-2 border-red-700 py-2.5 transition cursor-pointer text-center"
                  >
                    Deactivate Program
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-[#1a1a1a]/30 dark:text-white/20" />
                <p className="font-mono text-xs text-[#1a1a1a]/50 dark:text-white/50">No routine currently active.</p>
              </div>
            )}
          </div>

          {/* Fitness Calculations & Tracker */}
          <div className="bg-white dark:bg-[#151518] border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 flex-1">
            <h3 className="font-oswald text-xl font-bold uppercase mb-4 tracking-tight flex items-center gap-2 text-[#1a1a1a] dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <Award className="w-5 h-5 text-[#ff4d00]" />
              Fitness Analytics
            </h3>

            <div className="flex flex-col gap-4 mt-4">
              {/* BMI Section */}
              <div className="p-4 bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60">Body Mass Index (BMI)</span>
                  {bmi !== null && (
                    <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 border border-[#1a1a1a] dark:border-zinc-700 bg-white dark:bg-[#151518] ${bmiColor}`}>
                      {bmiCategory}
                    </span>
                  )}
                </div>
                {bmi !== null ? (
                  <p className="font-oswald text-3xl font-bold text-[#1a1a1a] dark:text-white mt-1">
                    {bmi} <span className="font-mono text-xs font-normal text-[#1a1a1a]/50 dark:text-white/50">kg/m²</span>
                  </p>
                ) : (
                  <p className="font-mono text-xs text-[#1a1a1a]/40 dark:text-white/40 mt-1">Add Height and Weight to calculate</p>
                )}
              </div>

              {/* FFMI Section */}
              <div className="p-4 bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60">Fat-Free Mass Index (FFMI)</span>
                  {ffmi !== null && (
                    <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 border border-[#1a1a1a] dark:border-zinc-700 bg-white dark:bg-[#151518] text-[#ff4d00]">
                      {ffmiCategory}
                    </span>
                  )}
                </div>
                {ffmi !== null ? (
                  <p className="font-oswald text-3xl font-bold text-[#1a1a1a] dark:text-white mt-1">
                    {ffmi} <span className="font-mono text-xs font-normal text-[#1a1a1a]/50 dark:text-white/50">index</span>
                  </p>
                ) : (
                  <p className="font-mono text-xs text-[#1a1a1a]/40 dark:text-white/40 mt-1">Add Body Fat % to calculate</p>
                )}
              </div>

              {/* Waist-to-Height Ratio Section */}
              <div className="p-4 bg-[#f8f7f4] dark:bg-[#202024] border-2 border-[#1a1a1a] dark:border-zinc-700">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#1a1a1a]/60 dark:text-white/60">Waist-to-Height Ratio</span>
                  {waistToHeight !== null && (
                    <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 border border-[#1a1a1a] dark:border-zinc-700 bg-white dark:bg-[#151518] text-teal-600 dark:text-teal-400">
                      {waistToHeightText}
                    </span>
                  )}
                </div>
                {waistToHeight !== null ? (
                  <p className="font-oswald text-3xl font-bold text-[#1a1a1a] dark:text-white mt-1">
                    {waistToHeight} <span className="font-mono text-xs font-normal text-[#1a1a1a]/50 dark:text-white/50">ratio</span>
                  </p>
                ) : (
                  <p className="font-mono text-xs text-[#1a1a1a]/40 dark:text-white/40 mt-1">Add Waist size to check risk</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
