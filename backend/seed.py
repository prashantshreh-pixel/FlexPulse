import os
import sys
import django
import json

# Add the flexpulse_backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'flexpulse_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flexpulse_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Exercise, Routine, RoutineExercise, UserProfile


def run():
    print("Seeding database...")

    admin_password = os.environ.get('FLEXPULSE_ADMIN_PASSWORD')
    if admin_password and not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@flexpulse.app', admin_password)

    # Ensure a template owner exists without embedding static passwords in source
    owner = User.objects.filter(is_superuser=True).first()
    if not owner:
        owner, created = User.objects.get_or_create(
            username='system_templates',
            defaults={'email': 'templates@flexpulse.app', 'is_active': False},
        )
        if created:
            owner.set_unusable_password()
            owner.save()
            UserProfile.objects.get_or_create(user=owner)

    test_password = os.environ.get('FLEXPULSE_TEST_PASSWORD')
    if test_password:
        test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@flexpulse.app'},
        )
        if created:
            test_user.set_password(test_password)
            test_user.save()
            UserProfile.objects.get_or_create(user=test_user)

    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'seed.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    exercises_data = data.get('exercises', [])
    programs_data = data.get('programs', [])

    print(f"Inserting {len(exercises_data)} exercises...")
    exercise_map = {}
    for ex in exercises_data:
        db_ex, _ = Exercise.objects.update_or_create(
            name=ex['name'],
            defaults={
                'muscle_group': ex['muscleGroup'],
                'equipment': ex['equipment'],
                'category': ex['category'],
                'instructions': ex['instructions'],
                'is_custom': False,
            },
        )
        exercise_map[ex['id']] = db_ex

    print(f"Inserting {len(programs_data)} programs...")
    for prog in programs_data:
        routine, created = Routine.objects.update_or_create(
            name=prog['name'],
            defaults={
                'user': owner,
                'description': prog['description'],
                'is_template': True,
            },
        )

        if not created:
            RoutineExercise.objects.filter(routine=routine).delete()

        order_index = 1
        for day in prog['days']:
            for ex in day['exercises']:
                db_ex = exercise_map.get(ex['exerciseId'])
                if db_ex:
                    reps_str = str(ex['reps'])
                    target_reps = int(reps_str.split('-')[0]) if '-' in reps_str else int(reps_str)

                    RoutineExercise.objects.create(
                        routine=routine,
                        exercise=db_ex,
                        target_sets=int(ex['sets']),
                        target_reps=target_reps,
                        order_index=order_index,
                        notes=ex.get('notes', ''),
                    )
                    order_index += 1

    print("Seeding complete!")


if __name__ == '__main__':
    run()
