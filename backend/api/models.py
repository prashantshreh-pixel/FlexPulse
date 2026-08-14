"""
FlexPulse Django Models
File: django_app/models.py
Mapped ORM models matching SSMS T-SQL Database Schema with helper methods for PR calculations.
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models import Max
from decimal import Decimal

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    preferred_unit = models.CharField(max_length=10, choices=[('lbs', 'Pounds'), ('kg', 'Kilograms')], default='lbs')
    default_rest_duration = models.IntegerField(default=90, help_text="Default rest timer in seconds")
    bio = models.TextField(blank=True, null=True, max_length=500)
    profile_picture = models.TextField(blank=True, null=True, help_text="Base64 encoded string or URL for avatar")
    background_picture = models.TextField(blank=True, null=True, help_text="Base64 encoded string or URL for cover image")
    
    # Gym & Personal Fitness Metrics
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Height in cm")
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Body weight in preferred unit")
    body_fat = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, help_text="Body fat percentage")
    chest = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Chest size in inches")
    waist = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Waist size in inches")
    biceps = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Biceps size in inches")
    thighs = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Thighs size in inches")
    calves = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Calves size in inches")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile ({self.preferred_unit})"


class Exercise(models.Model):
    MUSCLE_GROUPS = [
        ('Chest', 'Chest'),
        ('Back', 'Back'),
        ('Legs', 'Legs'),
        ('Shoulders', 'Shoulders'),
        ('Arms', 'Arms'),
        ('Core', 'Core'),
    ]

    EQUIPMENT_TYPES = [
        ('Barbell', 'Barbell'),
        ('Dumbbell', 'Dumbbell'),
        ('Cable', 'Cable'),
        ('Machine', 'Machine'),
        ('Bodyweight', 'Bodyweight'),
    ]

    name = models.CharField(max_length=100, unique=True)
    muscle_group = models.CharField(max_length=50, choices=MUSCLE_GROUPS)
    equipment = models.CharField(max_length=50, choices=EQUIPMENT_TYPES)
    category = models.CharField(max_length=50, default='Compound')
    instructions = models.TextField(blank=True, null=True)
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Exercises'
        ordering = ['muscle_group', 'name']
        indexes = [
            models.Index(fields=['muscle_group', 'equipment']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.muscle_group} - {self.equipment})"

    def get_user_max_weight(self, user):
        """Retrieve user's all-time max weight lifted for this exercise."""
        max_set = SetLog.objects.filter(
            workout__user=user,
            exercise=self
        ).aggregate(Max('weight_lbs'))['weight_lbs__max']
        return max_set or Decimal('0.00')


class Routine(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routines')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_template = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Routines'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({'Template' if self.is_template else 'Custom'})"


class RoutineExercise(models.Model):
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    target_sets = models.IntegerField(default=3)
    target_reps = models.IntegerField(default=10)
    order_index = models.IntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'RoutineExercises'
        ordering = ['order_index']

    def __str__(self):
        return f"{self.routine.name} -> {self.exercise.name} ({self.target_sets}x{self.target_reps})"


class WorkoutLog(models.Model):
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('DISCARDED', 'Discarded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    routine = models.ForeignKey(Routine, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=100)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_volume_lbs = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_seconds = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')

    class Meta:
        db_table = 'WorkoutLogs'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.title} - {self.user.username} ({self.status})"

    def update_total_volume(self):
        """Recalculate total volume from associated sets."""
        sets = self.sets.all()
        volume = sum(s.weight_lbs * s.reps for s in sets)
        self.total_volume_lbs = Decimal(str(volume))
        self.save()


class SetLog(models.Model):
    workout = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.IntegerField()
    weight_lbs = models.DecimalField(max_digits=6, decimal_places=2)
    reps = models.IntegerField()
    rpe = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    is_pr = models.BooleanField(default=False)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'SetLogs'
        ordering = ['logged_at']

    def calculate_estimated_1rm(self):
        """Epley Formula: Weight * (1 + Reps/30)"""
        if self.reps == 1:
            return float(self.weight_lbs)
        return round(float(self.weight_lbs) * (1 + self.reps / 30.0), 1)

    def check_is_pr(self):
        """Check if weight exceeds user's previous max weight for this exercise."""
        previous_max = SetLog.objects.filter(
            workout__user=self.workout.user,
            exercise=self.exercise
        ).exclude(id=self.id).aggregate(Max('weight_lbs'))['weight_lbs__max'] or Decimal('0.00')

        return self.weight_lbs > previous_max

    def save(self, *args, **kwargs):
        if self.check_is_pr():
            self.is_pr = True
        super().save(*args, **kwargs)
        self.workout.update_total_volume()
