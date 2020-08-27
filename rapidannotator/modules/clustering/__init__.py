from flask import Blueprint

blueprint = Blueprint(
        'clustering',
        __name__,
        template_folder='templates',
)

from rapidannotator.modules.clustering import views
