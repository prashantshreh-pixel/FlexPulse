import os
import sys
import django
import json

# Add the flexpulse_backend directory to the sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'flexpulse_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flexpulse_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Exercise, Routine, RoutineExercise, UserProfile

def run():
    print("Seeding database...")
    
    # Create a superuser and a default user if they don't exist
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin')
        
    user, created = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})
    if created:
        user.set_password('testpass')
        user.save()
        UserProfile.objects.create(user=user)

    # Read the seed.json file
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'seed.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    exercises_data = data.get('exercises', [])
    programs_data = data.get('programs', [])

    # Insert Exercises
    print(f"Inserting {len(exercises_data)} exercises...")
    exercise_map = {} # Map ID to DB instance
    for ex in exercises_data:
        db_ex, created = Exercise.objects.update_or_create(
            name=ex['name'],
            defaults={
                'muscle_group': ex['muscleGroup'],
                'equipment': ex['equipment'],
                'category': ex['category'],
                'instructions': ex['instructions'],
                'is_custom': False
            }
        )
        exercise_map[ex['id']] = db_ex
        
    # Insert Programs
    print(f"Inserting {len(programs_data)} programs...")
    for prog in programs_data:
        routine, created = Routine.objects.update_or_create(
            name=prog['name'],
            defaults={
                'user': user,
                'description': prog['description'],
                'is_template': True
            }
        )
        
        # Clear existing exercises for this routine if it existed
        if not created:
            RoutineExercise.objects.filter(routine=routine).delete()
            
        # Add routine exercises
        order_index = 1
        for day in prog['days']:
            for ex in day['exercises']:
                db_ex = exercise_map.get(ex['exerciseId'])
                if db_ex:
                    # Handle ranges like '12-15' or raw ints
                    reps_str = str(ex['reps'])
                    target_reps = int(reps_str.split('-')[0]) if '-' in reps_str else int(reps_str)
                    
                    RoutineExercise.objects.create(
                        routine=routine,
                        exercise=db_ex,
                        target_sets=int(ex['sets']),
                        target_reps=target_reps,
                        order_index=order_index,
                        notes=ex.get('notes', '')
                    )
                    order_index += 1

    print("Seeding complete!")

if __name__ == '__main__':
    run()
