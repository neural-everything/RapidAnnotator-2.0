from flask import Blueprint

blueprint = Blueprint(
        'elan',
        __name__,
        template_folder='templates',
)

from rapidannotator.modules.elan import views
