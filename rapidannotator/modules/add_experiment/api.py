from flask_login import current_user
from functools import wraps

from rapidannotator.models import Experiment

def isPerimitted(func):
    @wraps(func)
    def checkOwners(experimentId):
        experiment = Experiment.query.filter_by(id=experimentId).first()
        owners = experiment.owners
        if (current_user not in owners) and (int(current_user.is_admin()) == 0):
            return "You are not allowed to modify this experiment."
        return func(experimentId)
    return checkOwners
