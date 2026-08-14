from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Exercise, Routine, RoutineExercise, WorkoutLog, SetLog, UserProfile
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user
class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'muscle_group', 'equipment', 'category', 'instructions', 'is_custom']

class RoutineExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    
    class Meta:
        model = RoutineExercise
        fields = ['id', 'exercise', 'target_sets', 'target_reps', 'order_index', 'notes']

class RoutineSerializer(serializers.ModelSerializer):
    exercises = RoutineExerciseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Routine
        fields = ['id', 'name', 'description', 'is_template', 'exercises']

class SetLogSerializer(serializers.ModelSerializer):
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(), source='exercise'
    )
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    muscle_group = serializers.CharField(source='exercise.muscle_group', read_only=True)

    class Meta:
        model = SetLog
        fields = ['id', 'exercise_id', 'exercise_name', 'muscle_group', 'set_number', 'weight_lbs', 'reps', 'rpe', 'is_pr', 'logged_at']
        read_only_fields = ['is_pr']

class WorkoutLogSerializer(serializers.ModelSerializer):
    sets = SetLogSerializer(many=True)

    class Meta:
        model = WorkoutLog
        fields = ['id', 'title', 'started_at', 'completed_at', 'duration_seconds', 'total_volume_lbs', 'status', 'sets']
        read_only_fields = ['total_volume_lbs']

    def create(self, validated_data):
        sets_data = validated_data.pop('sets', [])
        user = self.context['request'].user
        workout = WorkoutLog.objects.create(user=user, **validated_data)
        
        for set_data in sets_data:
            SetLog.objects.create(workout=workout, **set_data)
            
        workout.update_total_volume()
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'preferred_unit', 'default_rest_duration', 'bio', 'profile_picture', 'background_picture',
            'height', 'weight', 'body_fat', 'chest', 'waist', 'biceps', 'thighs', 'calves'
        ]

class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'id': {'read_only': True}
        }

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        if password:
            instance.set_password(password)
        instance.save()

        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
