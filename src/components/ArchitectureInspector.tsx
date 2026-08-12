import React, { useState } from 'react';
import { Database, FileCode, Check, Copy, Server, Code, Terminal } from 'lucide-react';

export const ArchitectureInspector: React.FC = () => {
  const [activeFile, setActiveFile] = useState<
    'sql' | 'settings' | 'models' | 'views' | 'urls' | 'base_html' | 'workout_html'
  >('sql');
  const [copied, setCopied] = useState(false);

  const fileContents = {
    sql: `-- ===============================================================================
-- FlexPulse - Gym & Workout Tracking Application
-- Microsoft SQL Server (SSMS) T-SQL Database Schema
-- File: django_app/schema.sql
-- ===============================================================================

USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'FlexPulseDB')
BEGIN
    CREATE DATABASE [FlexPulseDB];
END;
GO

USE [FlexPulseDB];
GO

-- 1. USERS TABLE
CREATE TABLE dbo.Users (
    UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    PreferredUnit NVARCHAR(10) NOT NULL DEFAULT 'lbs',
    DefaultRestDuration INT NOT NULL DEFAULT 90,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 2. EXERCISES TABLE
CREATE TABLE dbo.Exercises (
    ExerciseID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    MuscleGroup NVARCHAR(50) NOT NULL,
    Equipment NVARCHAR(50) NOT NULL,
    Category NVARCHAR(50) NOT NULL DEFAULT 'Compound',
    Instructions NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 3. ROUTINES TABLE
CREATE TABLE dbo.Routines (
    RoutineID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    IsTemplate BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 4. ROUTINE EXERCISES
CREATE TABLE dbo.RoutineExercises (
    RoutineExerciseID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoutineID INT NOT NULL FOREIGN KEY REFERENCES dbo.Routines(RoutineID) ON DELETE CASCADE,
    ExerciseID INT NOT NULL FOREIGN KEY REFERENCES dbo.Exercises(ExerciseID) ON DELETE CASCADE,
    TargetSets INT NOT NULL DEFAULT 3,
    TargetReps INT NOT NULL DEFAULT 10,
    OrderIndex INT NOT NULL DEFAULT 1
);
GO

-- 5. WORKOUT LOGS
CREATE TABLE dbo.WorkoutLogs (
    WorkoutID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
    RoutineID INT NULL FOREIGN KEY REFERENCES dbo.Routines(RoutineID) ON DELETE SET NULL,
    Title NVARCHAR(100) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CompletedAt DATETIME2 NULL,
    TotalVolumeLbs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Status NVARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'
);
GO

-- 6. SET LOGS
CREATE TABLE dbo.SetLogs (
    SetID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    WorkoutID INT NOT NULL FOREIGN KEY REFERENCES dbo.WorkoutLogs(WorkoutID) ON DELETE CASCADE,
    ExerciseID INT NOT NULL FOREIGN KEY REFERENCES dbo.Exercises(ExerciseID) ON DELETE CASCADE,
    SetNumber INT NOT NULL,
    WeightLbs DECIMAL(6,2) NOT NULL,
    Reps INT NOT NULL,
    RPE DECIMAL(3,1) NULL,
    IsPR BIT NOT NULL DEFAULT 0,
    LoggedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- NON-CLUSTERED INDEXES
CREATE NONCLUSTERED INDEX IX_Exercises_Muscle_Equipment ON dbo.Exercises (MuscleGroup, Equipment);
CREATE NONCLUSTERED INDEX IX_SetLogs_Exercise_Weight ON dbo.SetLogs (ExerciseID, WeightLbs DESC, Reps DESC);
GO`,

    settings: `"""
FlexPulse Django Settings Configuration
File: django_app/settings.py
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'django_htmx', # HTMX Integration
    'workout_tracker',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    
    'django_htmx.middleware.HtmxMiddleware', # HTMX Header middleware
]

# MICROSOFT SQL SERVER (SSMS) DATABASE CONFIG VIA mssql-django
DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': os.getenv('SQL_SERVER_DB', 'FlexPulseDB'),
        'USER': os.getenv('SQL_SERVER_USER', 'sa'),
        'PASSWORD': os.getenv('SQL_SERVER_PASSWORD', 'YourStrongPass123!'),
        'HOST': os.getenv('SQL_SERVER_HOST', 'localhost'),
        'PORT': os.getenv('SQL_SERVER_PORT', '1433'),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'TrustServerCertificate': 'yes',
        },
    }
}`,

    models: `"""
FlexPulse Django Models
File: django_app/models.py
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models import Max
from decimal import Decimal

class Exercise(models.Model):
    name = models.CharField(max_length=100, unique=True)
    muscle_group = models.CharField(max_length=50)
    equipment = models.CharField(max_length=50)
    category = models.CharField(max_length=50, default='Compound')
    instructions = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Exercises'
        indexes = [models.Index(fields=['muscle_group', 'equipment'])]

class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    started_at = models.DateTimeField(auto_now_add=True)
    total_volume_lbs = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default='IN_PROGRESS')

    class Meta:
        db_table = 'WorkoutLogs'

class SetLog(models.Model):
    workout = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.IntegerField()
    weight_lbs = models.DecimalField(max_digits=6, decimal_places=2)
    reps = models.IntegerField()
    rpe = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    is_pr = models.BooleanField(default=False)

    class Meta:
        db_table = 'SetLogs'

    def check_is_pr(self):
        previous_max = SetLog.objects.filter(
            workout__user=self.workout.user,
            exercise=self.exercise
        ).exclude(id=self.id).aggregate(Max('weight_lbs'))['weight_lbs__max'] or Decimal('0.00')

        return self.weight_lbs > previous_max

    def save(self, *args, **kwargs):
        if self.check_is_pr():
            self.is_pr = True
        super().save(*args, **kwargs)`,

    views: `"""
FlexPulse Django Views
File: django_app/views.py
"""

import json
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST, require_GET
from .models import Exercise, WorkoutLog, SetLog

@require_POST
def log_set_view(request):
    workout_id = request.POST.get('workout_id')
    exercise_id = request.POST.get('exercise_id')
    weight = float(request.POST.get('weight', 0))
    reps = int(request.POST.get('reps', 0))

    workout = get_object_or_404(WorkoutLog, id=workout_id, user=request.user)
    exercise = get_object_or_404(Exercise, id=exercise_id)

    set_log = SetLog(
        workout=workout,
        exercise=exercise,
        set_number=1,
        weight_lbs=weight,
        reps=reps
    )
    set_log.save()

    response = render(request, 'partials/set_row.html', {'set': set_log})
    
    # Trigger Alpine Rest Timer & PR Badge
    response["HX-Trigger"] = json.dumps({
        "startRestTimer": {"duration": 90},
        "showPrBadge": {"exercise": exercise.name, "weight": weight, "reps": reps} if set_log.is_pr else None
    })
    return response

@require_GET
def search_exercises_view(request):
    query = request.GET.get('q', '').strip()
    exercises = Exercise.objects.filter(name__icontains=query) if query else Exercise.objects.all()
    return render(request, 'partials/exercise_search_results.html', {'exercises': exercises})`,

    urls: `"""
FlexPulse Django URLs
File: django_app/urls.py
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('live-workout/', views.live_workout_view, name='live_workout'),
    path('log-set/', views.log_set_view, name='log_set'),
    path('exercises/search/', views.search_exercises_view, name='exercise_search'),
]`,

    base_html: `<!-- File: django_app/templates/base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body x-data="globalApp()" @start-rest-timer.window="startRestTimer($event.detail)">
    <aside>
        <a href="/live-workout/" hx-get="/live-workout/" hx-target="#main-content">Live Workout</a>
    </aside>

    <main id="main-content">
        {% include partial|default:"partials/live_workout.html" %}
    </main>
</body>
</html>`,

    workout_html: `<!-- File: django_app/templates/partials/live_workout.html -->
<div>
    <input type="text"
           name="q"
           placeholder="Search exercises..."
           hx-get="/exercises/search/"
           hx-trigger="keyup changed delay:200ms"
           hx-target="#search-results">

    <div id="search-results"></div>

    <button hx-post="/log-set/"
            hx-vals='{"workout_id": 101, "exercise_id": 1}'
            hx-target="#set-list"
            hx-swap="beforeend">
        Log Set
    </button>
</div>`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileTabs = [
    { id: 'sql', label: 'SSMS T-SQL Schema', file: 'schema.sql', icon: Database },
    { id: 'settings', label: 'Django Settings', file: 'settings.py', icon: Server },
    { id: 'models', label: 'Django Models', file: 'models.py', icon: FileCode },
    { id: 'views', label: 'Django Views', file: 'views.py', icon: Code },
    { id: 'urls', label: 'Django URLs', file: 'urls.py', icon: Terminal },
    { id: 'base_html', label: 'Base Template', file: 'base.html', icon: FileCode },
    { id: 'workout_html', label: 'HTMX Component', file: 'live_workout.html', icon: Code },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="card-minimal flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="label">Architecture Specs</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#111113] mt-1">
            Source Code Inspector
          </h2>
          <p className="label text-[#111113]/60 mt-1">
            Python/Django, SSMS T-SQL, and HTMX templates stored in `/django_app/`.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="btn-accent flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-white" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* FILE SELECTION TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b-2 border-[#1a1a1a]">
        {fileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFile === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFile(tab.id as any)}
              className={`font-mono text-xs px-3 py-1.5 uppercase font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border-2 ${
                isActive
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-[#f8f7f4] text-[#1a1a1a]/70 hover:text-[#1a1a1a] border-[#1a1a1a]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.file}</span>
            </button>
          );
        })}
      </div>

      {/* CODE DISPLAY PANEL */}
      <div className="border-2 border-[#1a1a1a] overflow-hidden p-0 bg-white shadow-[4px_4px_0_#1a1a1a]">
        <div className="bg-[#1a1a1a] text-white px-4 py-3 flex justify-between items-center font-mono text-xs">
          <span>django_app/{fileTabs.find((t) => t.id === activeFile)?.file}</span>
          <span className="text-white/50 text-[10px]">T-SQL / DJANGO</span>
        </div>

        <pre className="p-6 font-mono text-xs text-[#1a1a1a] bg-[#f8f7f4] overflow-x-auto leading-relaxed max-h-[500px] overflow-y-auto">
          <code>{fileContents[activeFile]}</code>
        </pre>
      </div>
    </div>
  );
};

