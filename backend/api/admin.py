from django.contrib import admin
from .models import UserProfile, Exercise, Routine, RoutineExercise, WorkoutLog, SetLog

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'muscle_group', 'equipment', 'category', 'is_custom')
    list_filter = ('muscle_group', 'equipment', 'category', 'is_custom')
    search_fields = ('name',)

@admin.register(Routine)
class RoutineAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_template')
    list_filter = ('is_template',)
    search_fields = ('name',)

@admin.register(RoutineExercise)
class RoutineExerciseAdmin(admin.ModelAdmin):
    list_display = ('routine', 'exercise', 'target_sets', 'target_reps', 'order_index')
    list_filter = ('routine',)

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'total_volume_lbs', 'started_at')
    list_filter = ('status', 'started_at')
    search_fields = ('title', 'user__username')

@admin.register(SetLog)
class SetLogAdmin(admin.ModelAdmin):
    list_display = ('workout', 'exercise', 'weight_lbs', 'reps', 'rpe', 'is_pr', 'logged_at')
    list_filter = ('is_pr', 'logged_at', 'exercise')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_unit')
