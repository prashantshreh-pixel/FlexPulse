from decimal import Decimal
import re
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.html import strip_tags
from rest_framework import serializers
from .models import Exercise, Routine, RoutineExercise, WorkoutLog, SetLog, UserProfile

USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_.-]{3,30}$')
BASE64_IMAGE_PATTERN = re.compile(
    r'^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$'
)
MAX_IMAGE_STRING_LENGTH = 2_800_000


def _sanitize_text(value: str, max_length: int | None = None) -> str:
    if value is None:
        return ''
    cleaned = strip_tags(str(value)).replace('\x00', '')
    cleaned = cleaned.replace('\u2014', '-').replace('\u2013', '-').strip()
    if max_length is not None:
        cleaned = cleaned[:max_length]
    return cleaned


def _validate_username_value(value: str) -> str:
    cleaned = _sanitize_text(value, 30)
    if not USERNAME_PATTERN.match(cleaned):
        raise serializers.ValidationError(
            'Username must be 3-30 characters using only letters, numbers, underscores, hyphens, or dots.'
        )
    return cleaned


def _validate_image_value(value: str | None) -> str:
    if not value:
        return ''
    trimmed = str(value).strip()
    if len(trimmed) > MAX_IMAGE_STRING_LENGTH:
        raise serializers.ValidationError('Image payload exceeds the 2MB limit.')
    if trimmed.startswith('data:'):
        if not BASE64_IMAGE_PATTERN.match(trimmed):
            raise serializers.ValidationError(
                'Only PNG, JPEG, WEBP, and GIF base64 images are permitted.'
            )
        return trimmed
    if trimmed.startswith('https://') or trimmed.startswith('/images/'):
        if len(trimmed) > 500:
            raise serializers.ValidationError('Image URL is too long.')
        return trimmed
    raise serializers.ValidationError('Invalid image URL or data format.')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_username(self, value):
        return _validate_username_value(value)

    def validate_email(self, value):
        return _sanitize_text(value, 254).lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=validated_data['password'],
            )
            UserProfile.objects.get_or_create(user=user)
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
    set_number = serializers.IntegerField(min_value=1, max_value=100)
    weight_lbs = serializers.DecimalField(
        max_digits=6, decimal_places=2, min_value=Decimal('0.00'), max_value=Decimal('2500.00')
    )
    reps = serializers.IntegerField(min_value=1, max_value=500)
    rpe = serializers.DecimalField(
        max_digits=3,
        decimal_places=1,
        min_value=Decimal('1.0'),
        max_value=Decimal('10.0'),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = SetLog
        fields = [
            'id', 'exercise_id', 'exercise_name', 'muscle_group',
            'set_number', 'weight_lbs', 'reps', 'rpe', 'is_pr', 'logged_at',
        ]
        read_only_fields = ['is_pr', 'logged_at']


class WorkoutLogSerializer(serializers.ModelSerializer):
    sets = SetLogSerializer(many=True)
    title = serializers.CharField(max_length=100)
    duration_seconds = serializers.IntegerField(min_value=0, max_value=86400, default=0)

    class Meta:
        model = WorkoutLog
        fields = [
            'id', 'title', 'started_at', 'completed_at',
            'duration_seconds', 'total_volume_lbs', 'status', 'sets',
        ]
        read_only_fields = ['total_volume_lbs']

    def validate_title(self, value):
        cleaned = _sanitize_text(value, 100)
        if not cleaned:
            raise serializers.ValidationError('Workout title cannot be empty.')
        return cleaned

    def validate_sets(self, value):
        if len(value) > 200:
            raise serializers.ValidationError('Maximum 200 sets per workout log.')
        return value

    def create(self, validated_data):
        sets_data = validated_data.pop('sets', [])
        user = self.context['request'].user
        with transaction.atomic():
            workout = WorkoutLog.objects.create(user=user, **validated_data)
            for set_data in sets_data:
                SetLog.objects.create(workout=workout, **set_data)
            workout.update_total_volume()
            return workout


class UserProfileSerializer(serializers.ModelSerializer):
    default_rest_duration = serializers.IntegerField(min_value=10, max_value=600, default=90)
    height = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('50'), max_value=Decimal('300'),
        required=False, allow_null=True
    )
    weight = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('20'), max_value=Decimal('999'),
        required=False, allow_null=True
    )
    body_fat = serializers.DecimalField(
        max_digits=4, decimal_places=1, min_value=Decimal('2'), max_value=Decimal('75'),
        required=False, allow_null=True
    )
    chest = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('10'), max_value=Decimal('100'),
        required=False, allow_null=True
    )
    waist = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('10'), max_value=Decimal('100'),
        required=False, allow_null=True
    )
    biceps = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('4'), max_value=Decimal('40'),
        required=False, allow_null=True
    )
    thighs = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('10'), max_value=Decimal('60'),
        required=False, allow_null=True
    )
    calves = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal('5'), max_value=Decimal('40'),
        required=False, allow_null=True
    )

    class Meta:
        model = UserProfile
        fields = [
            'preferred_unit', 'default_rest_duration', 'bio', 'profile_picture', 'background_picture',
            'height', 'weight', 'body_fat', 'chest', 'waist', 'biceps', 'thighs', 'calves',
        ]

    def validate_bio(self, value):
        return _sanitize_text(value, 500)

    def validate_profile_picture(self, value):
        return _validate_image_value(value)

    def validate_background_picture(self, value):
        return _validate_image_value(value)


class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    is_staff = serializers.BooleanField(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'profile', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'allow_blank': True},
            'id': {'read_only': True},
        }

    def validate_username(self, value):
        return _validate_username_value(value)

    def validate_email(self, value):
        return _sanitize_text(value, 254).lower()

    def validate_password(self, value):
        if value:
            validate_password(value, user=self.instance)
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)

        with transaction.atomic():
            instance.username = validated_data.get('username', instance.username)
            instance.email = validated_data.get('email', instance.email)
            if password:
                instance.set_password(password)
            instance.save()

            if profile_data is not None:
                profile, _ = UserProfile.objects.get_or_create(user=instance)
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
                profile.save()

            return instance
