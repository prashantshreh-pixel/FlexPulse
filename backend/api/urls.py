from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExerciseListView,
    RoutineListView,
    RegisterView,
    WorkoutLogViewSet,
    PersonalRecordListView,
    UserProfileView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
)

router = DefaultRouter()
router.register(r'workouts', WorkoutLogViewSet, basename='workout')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('routines/', RoutineListView.as_view(), name='routine-list'),
    path('prs/', PersonalRecordListView.as_view(), name='pr-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]
