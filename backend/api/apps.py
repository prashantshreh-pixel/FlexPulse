from django.apps import AppConfig
from django.db.backends.signals import connection_created


def _configure_sqlite_pragmas(sender, connection, **kwargs):
    if connection.vendor == 'sqlite':
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA foreign_keys = ON;')
            cursor.execute('PRAGMA journal_mode = WAL;')
            cursor.execute('PRAGMA synchronous = NORMAL;')


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        connection_created.connect(_configure_sqlite_pragmas)
