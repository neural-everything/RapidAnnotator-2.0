from flask import Blueprint

blueprint = Blueprint(
        'notification',
        __name__,
        template_folder='templates',
)

from rapidannotator.modules.notification import views