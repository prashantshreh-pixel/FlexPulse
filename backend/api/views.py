from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import Exercise, Routine, WorkoutLog, SetLog, UserProfile
from .serializers import (
    ExerciseSerializer,
    RoutineSerializer,
    RegisterSerializer,
    WorkoutLogSerializer,
    SetLogSerializer,
    UserDetailSerializer,
)


class IsOwnerPermission(permissions.BasePermission):
    """Ensure users can only access and mutate their own workout records."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id


class ThrottledTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    throttle_scope = 'auth_login'


class ThrottledTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)
    throttle_scope = 'auth_login'


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    throttle_scope = 'auth_register'
    serializer_class = RegisterSerializer


class ExerciseListView(generics.ListAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]


class RoutineListView(generics.ListAPIView):
    queryset = Routine.objects.filter(is_template=True).prefetch_related('exercises__exercise')
    serializer_class = RoutineSerializer
    permission_classes = [IsAuthenticated]


class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogSerializer
    permission_classes = [IsAuthenticated, IsOwnerPermission]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return WorkoutLog.objects.filter(user=self.request.user).prefetch_related('sets__exercise')


class PersonalRecordListView(generics.ListAPIView):
    serializer_class = SetLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SetLog.objects.filter(workout__user=self.request.user, is_pr=True).select_related('exercise')


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        UserProfile.objects.get_or_create(user=self.request.user)
        return self.request.user
