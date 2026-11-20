from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from .models import Exercise, WorkoutLog


class SecurityAndHeadersTests(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_production_security_settings(self):
        self.assertFalse(settings.DEBUG)
        self.assertFalse(settings.CORS_ALLOW_ALL_ORIGINS)
        self.assertGreaterEqual(len(settings.SECRET_KEY), 32)
        self.assertFalse(settings.SECRET_KEY.startswith('django-' + 'insecure-'))
        self.assertIn('django.contrib.auth.hashers.PBKDF2PasswordHasher', settings.PASSWORD_HASHERS)
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)

    def test_security_headers_present_on_root_and_favicon(self):
        response = self.client.get('/', HTTP_HOST='localhost')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_headers = [
            'Content-Security-Policy',
            'X-Content-Type-Options',
            'X-Frame-Options',
            'Permissions-Policy',
            'Referrer-Policy',
            'Cross-Origin-Opener-Policy',
        ]
        for header in expected_headers:
            self.assertIn(header, response.headers)
        self.assertEqual(response.headers['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response.headers['X-Frame-Options'], 'DENY')

        favicon = self.client.get('/favicon.svg', HTTP_HOST='localhost')
        self.assertEqual(favicon.status_code, status.HTTP_200_OK)


class AuthenticationAndAuthorizationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = APIClient()
        self.exercise = Exercise.objects.create(
            name='Barbell Bench Press',
            muscle_group='Chest',
            equipment='Barbell',
            category='Compound',
            instructions='Lower bar to mid-chest and press.',
        )

    def tearDown(self):
        cache.clear()

    def test_unauthenticated_endpoints_require_auth(self):
        protected = [
            '/api/exercises/',
            '/api/routines/',
            '/api/workouts/',
            '/api/prs/',
            '/api/profile/',
        ]
        for endpoint in protected:
            res = self.api.get(endpoint, HTTP_HOST='localhost')
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED, endpoint)

    def test_registration_rejects_xss_and_weak_passwords(self):
        bad_username = self.api.post(
            '/api/auth/register/',
            data={'username': '<script>alert(1)</script>', 'password': 'StrongPassword!99'},
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(bad_username.status_code, status.HTTP_400_BAD_REQUEST)

        weak_pass = self.api.post(
            '/api/auth/register/',
            data={'username': 'lifter_one', 'password': '123'},
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(weak_pass.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_login_and_profile_sanitization(self):
        reg = self.api.post(
            '/api/auth/register/',
            data={
                'username': 'lifter_one',
                'email': 'lifter@flexpulse.app',
                'password': 'StrongPassword!99',
            },
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(reg.status_code, status.HTTP_201_CREATED)

        login = self.api.post(
            '/api/auth/login/',
            data={'username': 'lifter_one', 'password': 'StrongPassword!99'},
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        token = login.data['access']
        self.api.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        profile_res = self.api.get('/api/profile/', HTTP_HOST='localhost')
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertFalse(profile_res.data['is_staff'])

        # Reject SVG XSS payload in profile_picture
        bad_svg = self.api.put(
            '/api/profile/',
            data={
                'username': 'lifter_one',
                'profile': {
                    'profile_picture': 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
                },
            },
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(bad_svg.status_code, status.HTTP_400_BAD_REQUEST)

        # Reject javascript: URI in background_picture
        bad_js = self.api.put(
            '/api/profile/',
            data={
                'username': 'lifter_one',
                'profile': {
                    'background_picture': 'javascript:alert(1)',
                },
            },
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(bad_js.status_code, status.HTTP_400_BAD_REQUEST)

        # Accept valid PNG base64 image and strip HTML tags in bio
        valid_png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        ok_update = self.api.put(
            '/api/profile/',
            data={
                'username': 'lifter_one',
                'profile': {
                    'bio': '<b>Heavy</b> squats',
                    'profile_picture': valid_png,
                    'height': '180.00',
                    'weight': '185.00',
                },
            },
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(ok_update.status_code, status.HTTP_200_OK)
        self.assertEqual(ok_update.data['profile']['bio'], 'Heavy squats')

    @override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
    def test_workout_logging_pr_detection_and_owner_isolation(self):
        user_a = User.objects.create_user(username='athlete_a', password='StrongPassword!99')
        user_b = User.objects.create_user(username='athlete_b', password='StrongPassword!99')

        login_a = self.api.post(
            '/api/auth/login/',
            data={'username': 'athlete_a', 'password': 'StrongPassword!99'},
            format='json',
            HTTP_HOST='localhost',
        )
        self.api.credentials(HTTP_AUTHORIZATION=f"Bearer {login_a.data['access']}")

        workout_res = self.api.post(
            '/api/workouts/',
            data={
                'title': 'Push Day <b>Test</b>',
                'duration_seconds': 2400,
                'status': 'COMPLETED',
                'sets': [
                    {
                        'exercise_id': self.exercise.id,
                        'set_number': 1,
                        'weight_lbs': '225.00',
                        'reps': 5,
                        'rpe': '8.5',
                    }
                ],
            },
            format='json',
            HTTP_HOST='localhost',
        )
        self.assertEqual(workout_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(workout_res.data['title'], 'Push Day Test')
        self.assertEqual(float(workout_res.data['total_volume_lbs']), 1125.0)
        workout_id = workout_res.data['id']

        prs_res = self.api.get('/api/prs/', HTTP_HOST='localhost')
        self.assertEqual(prs_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(prs_res.data), 1)
        self.assertTrue(prs_res.data[0]['is_pr'])

        # Authenticate as user_b and ensure user_b cannot read or delete user_a's workout
        login_b = self.api.post(
            '/api/auth/login/',
            data={'username': 'athlete_b', 'password': 'StrongPassword!99'},
            format='json',
            HTTP_HOST='localhost',
        )
        self.api.credentials(HTTP_AUTHORIZATION=f"Bearer {login_b.data['access']}")
        get_other = self.api.get(f'/api/workouts/{workout_id}/', HTTP_HOST='localhost')
        self.assertEqual(get_other.status_code, status.HTTP_404_NOT_FOUND)
        del_other = self.api.delete(f'/api/workouts/{workout_id}/', HTTP_HOST='localhost')
        self.assertEqual(del_other.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(WorkoutLog.objects.filter(id=workout_id, user=user_a).exists())
        self.assertFalse(WorkoutLog.objects.filter(user=user_b).exists())

    @override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
    def test_auth_login_rate_limiting(self):
        User.objects.create_user(username='rate_user', password='StrongPassword!99')
        statuses = []
        for _ in range(12):
            res = self.api.post(
                '/api/auth/login/',
                data={'username': 'rate_user', 'password': 'WrongPassword!1'},
                format='json',
                HTTP_HOST='localhost',
            )
            statuses.append(res.status_code)
        self.assertIn(status.HTTP_429_TOO_MANY_REQUESTS, statuses)
