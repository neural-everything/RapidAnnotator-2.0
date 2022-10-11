
from flask_login import current_user
from functools import wraps

from rapidannotator.models import Experiment

def strip_filter(text):
    """Filter for trimming whitespace.

    :param text: The text to strip.
    :returns: The stripped text.
    """
    return text.strip() if text else text

def isAnnotator(func):
    @wraps(func)
    def checkAnnotator(experimentId):
        experiment = Experiment.query.filter_by(id=experimentId).first()
        annotatorAssociation = experiment.annotators
        annotators = [assoc.annotator for assoc in annotatorAssociation]
        if current_user not in annotators:
            return "You are not assigned to annotate this experiment."
        return func(experimentId)
    return checkAnnotator
