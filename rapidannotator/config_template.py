# All variables should be uppercase
# For sending Mails to the users TESTING should be False in DevlopmentConfig Class

class BaseConfig(object):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_DATABASE_URI = 'mysql://[username]:[password]@localhost/[database_name]'
    SECRET_KEY = "sldjfhals13 2hhdwflkjdhfa"
    SECURITY_PASSWORD_SALT = "SOME SECURITY SALT like abcdefre"
    WTF_CSRF_ENABLED = True
    CSRF_ENABLED = True
    UPLOAD_FOLDER = '[Path_to_storage_directory]'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # mail settings
    MAIL_SERVER = 'smtp.googlemail.com'
    MAIL_PORT = 465
    MAIL_USE_TLS = False
    MAIL_USE_SSL = True

    # gmail authentication
    MAIL_USERNAME = "your gmail id from which you ant to send mail to users"
    MAIL_PASSWORD = "Your gmail Password"

    # mail accounts
    MAIL_DEFAULT_SENDER = "your gmail id"

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    LOGIN_DISABLED = False
