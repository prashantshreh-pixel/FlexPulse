from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import ExerciseListView, RoutineListView, RegisterView, WorkoutLogViewSet, PersonalRecordListView, UserProfileView

router = DefaultRouter()
router.register(r'workouts', WorkoutLogViewSet, basename='workout')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('routines/', RoutineListView.as_view(), name='routine-list'),
    path('prs/', PersonalRecordListView.as_view(), name='pr-list'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]
