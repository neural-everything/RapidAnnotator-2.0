# All variables should be uppercase
# For sending Mails to the users TESTING should be False in DevlopmentConfig Class
# UPLOAD_FOLDER path must be raw string

class BaseConfig(object):
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_DATABASE_URI = 'mysql://rapidannotator:rapidannotator@db/rapidannotator'
    SECRET_KEY = "sldjfhals13 2hhdwflkjdhfa"
    SECURITY_PASSWORD_SALT = "SOME SECURITY SALT like abcdefre"
    WTF_CSRF_ENABLED = True
    CSRF_ENABLED = True
    UPLOAD_FOLDER = r'/videos'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # mail settings
    MAIL_SERVER = 'smtp.xxx.xxx'
    MAIL_PORT = 465
    MAIL_USE_TLS = False
    MAIL_USE_SSL = True

    # gmail authentication
    MAIL_USERNAME = "xxx@xxx.xxx"
    MAIL_PASSWORD = "xxxxxxxx"

    # mail accounts
    MAIL_DEFAULT_SENDER = "xxxx@xxx.xxx"

class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    LOGIN_DISABLED = False
