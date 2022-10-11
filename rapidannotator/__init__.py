from flask import Flask
from flask import render_template

app = Flask(__name__)
app.config.from_object('rapidannotator.config.DevelopmentConfig')

from flask_login import LoginManager
login = LoginManager()
login.init_app(app)
login.login_view = 'frontpage.index'

from rapidannotator.models import db
db.init_app(app)

from flask_mail import Mail
mail = Mail(app)

'''
    .. for creating all the required tables
'''

from flask_migrate import Migrate
with app.app_context():
    db.create_all()
    migrate = Migrate(app, db)

from rapidannotator.modifyJsonEncoder import JSONEncoder
app.json_encoder = JSONEncoder

from flask_bcrypt import Bcrypt
bcrypt = Bcrypt(app)

from rapidannotator.filters import datetimeformat
app.jinja_env.filters['datetimeformat'] = datetimeformat

'''
    ..import all the blueprints
'''
from rapidannotator.modules.frontpage import blueprint as frontpage
app.register_blueprint(frontpage, url_prefix='/')

from rapidannotator.modules.home import blueprint as home
app.register_blueprint(home, url_prefix='/home')

from rapidannotator.modules.add_experiment import blueprint as add_experiment
app.register_blueprint(add_experiment, url_prefix='/add_experiment')

from rapidannotator.modules.annotate_experiment import blueprint as annotate_experiment
app.register_blueprint(annotate_experiment, url_prefix='/annotate_experiment')

from rapidannotator.modules.admin import blueprint as admin
app.register_blueprint(admin, url_prefix='/admin')

from rapidannotator.modules.notification import blueprint as notification
app.register_blueprint(notification, url_prefix='/notification')


from rapidannotator.modules.clustering import blueprint as clustering
app.register_blueprint(clustering, url_prefix='/clustering')

from rapidannotator.modules.elan import blueprint as elan
app.register_blueprint(elan, url_prefix='/elan')

@app.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template('404.html'), 404
