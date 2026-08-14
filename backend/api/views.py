from rest_framework import generics, viewsets
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Exercise, Routine, WorkoutLog, SetLog
from .serializers import ExerciseSerializer, RoutineSerializer, RegisterSerializer, WorkoutLogSerializer, SetLogSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
class ExerciseListView(generics.ListAPIView):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer

class RoutineListView(generics.ListAPIView):
    queryset = Routine.objects.filter(is_template=True).prefetch_related('exercises__exercise')
    serializer_class = RoutineSerializer

class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkoutLog.objects.filter(user=self.request.user).prefetch_related('sets__exercise')

class PersonalRecordListView(generics.ListAPIView):
    serializer_class = SetLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return all SetLogs for this user that are marked as PRs
        return SetLog.objects.filter(workout__user=self.request.user, is_pr=True).select_related('exercise')

from .serializers import UserDetailSerializer
from .models import UserProfile

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        UserProfile.objects.get_or_create(user=self.request.user)
        return self.request.user
