"""
FlexPulse Django URL Configuration
File: django_app/urls.py
"""

from django.urls import path
from . import views

urlpatterns = [
    # SPA Views (HTMX Partial swaps target="#main-content")
    path('', views.dashboard_view, name='dashboard'),
    path('dashboard/', views.dashboard_view, name='dashboard_partial'),
    path('live-workout/', views.live_workout_view, name='live_workout'),
    path('exercises/', views.search_exercises_view, name='exercises'),
    path('routines/', views.routines_view, name='routines'),
    path('history/', views.history_view, name='history'),

    # HTMX API Endpoints
    path('log-set/', views.log_set_view, name='log_set'),
    path('exercises/search/', views.search_exercises_view, name='exercise_search'),
]
