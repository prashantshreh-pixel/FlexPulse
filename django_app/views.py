"""
FlexPulse Django Views & HTMX Controllers
File: django_app/views.py
Handles partial HTML rendering for HTMX requests with JSON triggers for Alpine.js events (Rest Timer, PR Alerts).
"""

import json
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
from django.db.models import Q
from .models import Exercise, Routine, WorkoutLog, SetLog

# ===============================================================================
# 1. UNIFIED SINGLE-PAGE VIEWS (HTMX Partials Swap)
# ===============================================================================

def dashboard_view(request):
    """Render Dashboard overview partial."""
    context = {
        'active_workout': WorkoutLog.objects.filter(user=request.user, status='IN_PROGRESS').first(),
        'recent_workouts': WorkoutLog.objects.filter(user=request.user, status='COMPLETED')[:5],
        'total_workouts': WorkoutLog.objects.filter(user=request.user, status='COMPLETED').count(),
    }
    if request.htmx:
        return render(request, 'partials/dashboard.html', context)
    return render(request, 'base.html', {'partial': 'partials/dashboard.html', **context})


def live_workout_view(request):
    """Render Live Workout workspace with active set logging table."""
    workout = WorkoutLog.objects.filter(user=request.user, status='IN_PROGRESS').first()
    
    if not workout:
        # Create a new default workout if none active
        routine = Routine.objects.filter(is_template=True).first()
        workout = WorkoutLog.objects.create(
            user=request.user,
            routine=routine,
            title=f"{routine.name if routine else 'Quick'} Workout",
            status='IN_PROGRESS'
        )

    # Group sets by exercise
    logged_sets = SetLog.objects.filter(workout=workout).select_related('exercise')
    exercises = Exercise.objects.all()

    context = {
        'workout': workout,
        'logged_sets': logged_sets,
        'exercises': exercises,
    }
    
    if request.htmx:
        return render(request, 'partials/live_workout.html', context)
    return render(request, 'base.html', {'partial': 'partials/live_workout.html', **context})


# ===============================================================================
# 2. HTMX SET LOGGING & REAL-TIME PR DETECTION
# ===============================================================================

@require_POST
def log_set_view(request):
    """
    Handles logging a set via hx-post="/log-set/".
    Calculates PR status, saves set, updates total volume,
    and returns set item HTML + HX-Trigger header to start Alpine rest timer.
    """
    workout_id = request.POST.get('workout_id')
    exercise_id = request.POST.get('exercise_id')
    weight = float(request.POST.get('weight', 0))
    reps = int(request.POST.get('reps', 0))
    rpe = request.POST.get('rpe')

    workout = get_object_or_404(WorkoutLog, id=workout_id, user=request.user)
    exercise = get_object_or_404(Exercise, id=exercise_id)

    # Determine set number
    current_set_count = SetLog.objects.filter(workout=workout, exercise=exercise).count() + 1

    # Create Set
    set_log = SetLog(
        workout=workout,
        exercise=exercise,
        set_number=current_set_count,
        weight_lbs=weight,
        reps=reps,
        rpe=float(rpe) if rpe else None
    )
    set_log.save() # Automatic PR detection happens inside SetLog.save()

    # Prepare response partial
    response = render(request, 'partials/set_row.html', {
        'set': set_log,
        'exercise': exercise
    })

    # Trigger Alpine.js events: Auto-start 90s Rest Timer & Notify PR if applicable
    trigger_data = {
        "startRestTimer": {"duration": 90, "exerciseName": exercise.name},
        "setLogged": {"setId": set_log.id, "isPr": set_log.is_pr}
    }
    if set_log.is_pr:
        trigger_data["showPrBadge"] = {
            "exercise": exercise.name,
            "weight": float(set_log.weight_lbs),
            "reps": set_log.reps
        }

    response["HX-Trigger"] = json.dumps(trigger_data)
    return response


# ===============================================================================
# 3. DYNAMIC EXERCISE SEARCH FILTER (HTMX Keyup Search)
# ===============================================================================

@require_GET
def search_exercises_view(request):
    """
    Dynamic exercise search triggered by:
    hx-get="/exercises/search/" hx-trigger="keyup changed delay:200ms"
    """
    query = request.GET.get('q', '').strip()
    muscle = request.GET.get('muscle', '').strip()
    equipment = request.GET.get('equipment', '').strip()

    exercises = Exercise.objects.all()

    if query:
        exercises = exercises.filter(Q(name__icontains=query) | Q(instructions__icontains=query))
    if muscle and muscle != 'All':
        exercises = exercises.filter(muscle_group=muscle)
    if equipment and equipment != 'All':
        exercises = exercises.filter(equipment=equipment)

    context = {
        'exercises': exercises[:20],
        'query': query,
        'selected_muscle': muscle,
        'selected_equipment': equipment,
    }
    
    if request.htmx:
        return render(request, 'partials/exercise_search_results.html', context)
    return render(request, 'partials/exercise_database.html', context)


# ===============================================================================
# 4. ROUTINE & HISTORY VIEWS
# ===============================================================================

def routines_view(request):
    """View and select Push-Pull-Legs templates or custom routines."""
    routines = Routine.objects.filter(Q(user=request.user) | Q(is_template=True))
    context = {'routines': routines}
    if request.htmx:
        return render(request, 'partials/routines.html', context)
    return render(request, 'base.html', {'partial': 'partials/routines.html', **context})


def history_view(request):
    """View completed workout logs and personal record timeline."""
    completed_workouts = WorkoutLog.objects.filter(user=request.user, status='COMPLETED')
    prs = SetLog.objects.filter(workout__user=request.user, is_pr=True).select_related('exercise')
    
    context = {
        'workouts': completed_workouts,
        'prs': prs
    }
    if request.htmx:
        return render(request, 'partials/history.html', context)
    return render(request, 'base.html', {'partial': 'partials/history.html', **context})
