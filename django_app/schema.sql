-- ===============================================================================
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
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
CREATE TABLE dbo.Users (
    UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(50) NULL,
    LastName NVARCHAR(50) NULL,
    PreferredUnit NVARCHAR(10) NOT NULL DEFAULT 'lbs', -- 'lbs' or 'kg'
    DefaultRestDuration INT NOT NULL DEFAULT 90, -- in seconds
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 2. EXERCISES TABLE
IF OBJECT_ID('dbo.Exercises', 'U') IS NOT NULL DROP TABLE dbo.Exercises;
CREATE TABLE dbo.Exercises (
    ExerciseID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE,
    MuscleGroup NVARCHAR(50) NOT NULL, -- Chest, Back, Legs, Shoulders, Arms, Core
    Equipment NVARCHAR(50) NOT NULL,   -- Barbell, Dumbbell, Cable, Machine, Bodyweight
    Category NVARCHAR(50) NOT NULL DEFAULT 'Compound', -- Compound, Isolation
    Instructions NVARCHAR(MAX) NULL,
    IsCustom BIT NOT NULL DEFAULT 0,
    CreatedByUserID INT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE SET NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 3. ROUTINES TABLE
IF OBJECT_ID('dbo.Routines', 'U') IS NOT NULL DROP TABLE dbo.Routines;
CREATE TABLE dbo.Routines (
    RoutineID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    IsTemplate BIT NOT NULL DEFAULT 0, -- 1 for predefined PPL/Home templates
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 4. ROUTINE EXERCISES (Junction Table for Routine Templates)
IF OBJECT_ID('dbo.RoutineExercises', 'U') IS NOT NULL DROP TABLE dbo.RoutineExercises;
CREATE TABLE dbo.RoutineExercises (
    RoutineExerciseID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoutineID INT NOT NULL FOREIGN KEY REFERENCES dbo.Routines(RoutineID) ON DELETE CASCADE,
    ExerciseID INT NOT NULL FOREIGN KEY REFERENCES dbo.Exercises(ExerciseID) ON DELETE CASCADE,
    TargetSets INT NOT NULL DEFAULT 3,
    TargetReps INT NOT NULL DEFAULT 10,
    OrderIndex INT NOT NULL DEFAULT 1,
    Notes NVARCHAR(255) NULL
);
GO

-- 5. WORKOUT LOGS TABLE
IF OBJECT_ID('dbo.WorkoutLogs', 'U') IS NOT NULL DROP TABLE dbo.WorkoutLogs;
CREATE TABLE dbo.WorkoutLogs (
    WorkoutID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
    RoutineID INT NULL FOREIGN KEY REFERENCES dbo.Routines(RoutineID) ON DELETE SET NULL,
    Title NVARCHAR(100) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CompletedAt DATETIME2 NULL,
    TotalVolumeLbs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    DurationSeconds INT NOT NULL DEFAULT 0,
    Notes NVARCHAR(MAX) NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' -- IN_PROGRESS, COMPLETED, DISCARDED
);
GO

-- 6. SET LOGS TABLE
IF OBJECT_ID('dbo.SetLogs', 'U') IS NOT NULL DROP TABLE dbo.SetLogs;
CREATE TABLE dbo.SetLogs (
    SetID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    WorkoutID INT NOT NULL FOREIGN KEY REFERENCES dbo.WorkoutLogs(WorkoutID) ON DELETE CASCADE,
    ExerciseID INT NOT NULL FOREIGN KEY REFERENCES dbo.Exercises(ExerciseID) ON DELETE CASCADE,
    SetNumber INT NOT NULL,
    WeightLbs DECIMAL(6,2) NOT NULL,
    Reps INT NOT NULL,
    RPE DECIMAL(3,1) NULL, -- Rate of Perceived Exertion (6.0 - 10.0)
    IsPR BIT NOT NULL DEFAULT 0, -- Flagged if new Personal Record for max weight/volume
    LoggedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- ===============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===============================================================================

-- Fast Lookup for Exercise Filtering by Muscle Group & Equipment
CREATE NONCLUSTERED INDEX IX_Exercises_Muscle_Equipment 
ON dbo.Exercises (MuscleGroup, Equipment);
GO

-- Fast Search for Exercises by Name
CREATE NONCLUSTERED INDEX IX_Exercises_Name
ON dbo.Exercises (Name);
GO

-- Quick Retrieval of User Workouts by Date
CREATE NONCLUSTERED INDEX IX_WorkoutLogs_User_StartedAt 
ON dbo.WorkoutLogs (UserID, StartedAt DESC);
GO

-- Efficient Set History & PR Calculation Lookup
CREATE NONCLUSTERED INDEX IX_SetLogs_Exercise_Weight 
ON dbo.SetLogs (ExerciseID, WeightLbs DESC, Reps DESC);
GO

-- Foreign Key Indexing
CREATE NONCLUSTERED INDEX IX_RoutineExercises_RoutineID ON dbo.RoutineExercises (RoutineID);
CREATE NONCLUSTERED INDEX IX_SetLogs_WorkoutID ON dbo.SetLogs (WorkoutID);
GO

-- ===============================================================================
-- STORED PROCEDURE: Check & Flag Personal Record (PR)
-- ===============================================================================
IF OBJECT_ID('dbo.sp_LogSetWithPRCheck', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_LogSetWithPRCheck;
GO
CREATE PROCEDURE dbo.sp_LogSetWithPRCheck
    @WorkoutID INT,
    @ExerciseID INT,
    @SetNumber INT,
    @WeightLbs DECIMAL(6,2),
    @Reps INT,
    @RPE DECIMAL(3,1) = NULL,
    @NewSetID INT OUTPUT,
    @IsPR BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Get User ID associated with this workout
    DECLARE @UserID INT;
    SELECT @UserID = UserID FROM dbo.WorkoutLogs WHERE WorkoutID = @WorkoutID;

    -- Check previous max weight for this user & exercise
    DECLARE @MaxPrevWeight DECIMAL(6,2) = 0;
    SELECT @MaxPrevWeight = ISNULL(MAX(s.WeightLbs), 0)
    FROM dbo.SetLogs s
    JOIN dbo.WorkoutLogs w ON s.WorkoutID = w.WorkoutID
    WHERE w.UserID = @UserID 
      AND s.ExerciseID = @ExerciseID 
      AND w.WorkoutID <> @WorkoutID;

    -- Determine PR status
    IF @WeightLbs > @MaxPrevWeight AND @Reps >= 1
    BEGIN
        SET @IsPR = 1;
    END
    ELSE
    BEGIN
        SET @IsPR = 0;
    END

    -- Insert new Set Log
    INSERT INTO dbo.SetLogs (WorkoutID, ExerciseID, SetNumber, WeightLbs, Reps, RPE, IsPR, LoggedAt)
    VALUES (@WorkoutID, @ExerciseID, @SetNumber, @WeightLbs, @Reps, @RPE, @IsPR, GETDATE());

    SET @NewSetID = SCOPE_IDENTITY();

    -- Update Total Volume in WorkoutLogs
    UPDATE dbo.WorkoutLogs
    SET TotalVolumeLbs = TotalVolumeLbs + (@WeightLbs * @Reps)
    WHERE WorkoutID = @WorkoutID;
END;
GO

-- ===============================================================================
-- SEED INITIAL EXERCISE LIBRARY
-- ===============================================================================
INSERT INTO dbo.Exercises (Name, MuscleGroup, Equipment, Category, Instructions) VALUES
('Barbell Bench Press', 'Chest', 'Barbell', 'Compound', 'Lie on bench, unrack barbell, lower to mid-chest, drive up.'),
('Incline Dumbbell Press', 'Chest', 'Dumbbell', 'Compound', 'Set bench to 30 degrees, press dumbbells overhead.'),
('Cable Chest Flyes', 'Chest', 'Cable', 'Isolation', 'Set cables to chest height, hug forward with slight elbow bend.'),
('Barbell Back Squat', 'Legs', 'Barbell', 'Compound', 'Bar across upper traps, squat past parallel, drive back up.'),
('Romanian Deadlift', 'Legs', 'Barbell', 'Compound', 'Hinge at hips, lower barbell along shins, squeeze glutes.'),
('Leg Extension', 'Legs', 'Machine', 'Isolation', 'Extend legs to lock out quadriceps, pause at top.'),
('Barbell Conventional Deadlift', 'Back', 'Barbell', 'Compound', 'Stand over bar, grip shoulder-width, drive hips forward to lockout.'),
('Lat Pulldown', 'Back', 'Cable', 'Compound', 'Pull wide bar down to upper chest, squeeze lats.'),
('Seated Cable Row', 'Back', 'Cable', 'Compound', 'Maintain neutral spine, pull handle to abdomen.'),
('Overhead Barbell Press', 'Shoulders', 'Barbell', 'Compound', 'Press bar straight up overhead, lock out shoulders.'),
('Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell', 'Isolation', 'Raise dumbbells out to sides until parallel with floor.'),
('Barbell Bicep Curl', 'Arms', 'Barbell', 'Isolation', 'Keep elbows pinned to sides, curl weight up.'),
('Tricep Rope Pushdown', 'Arms', 'Cable', 'Isolation', 'Push rope attachment down, flare ends out at bottom.'),
('Hanging Leg Raise', 'Core', 'Bodyweight', 'Isolation', 'Hang from pull-up bar, raise legs to 90 degrees.');
GO
