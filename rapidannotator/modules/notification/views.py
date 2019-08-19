from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, abort, send_from_directory
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user

from rapidannotator import db
from rapidannotator import bcrypt
from rapidannotator.models import User, Experiment, AnnotatorAssociation, File, \
    AnnotationInfo, AnnotationLevel, Label, NotificationInfo, ExperimentOwner
from rapidannotator.modules.notification import blueprint

from sqlalchemy import and_
import json

@blueprint.before_request
def before_request():
    if current_app.login_manager._login_disabled:
        pass
    elif not current_user.is_authenticated:
        return current_app.login_manager.unauthorized()

@blueprint.route('/')
def index():
    notifications = NotificationInfo.query.filter_by(user_id=current_user.id).all()
    current_user.numNotif = 0
    db.session.commit()

    return render_template('notification/main.html',
        notifications = notifications)

@blueprint.route('/_addNotification', methods=['POST'])
def _addNotification():
    
    experimentId = request.form.get('experimentId', None)
    current_username = current_user.username
    experiment_info = Experiment.query.filter_by(id=experimentId).first()
    experiment_owners = experiment_info.owners

    for owner in experiment_owners:
        owner.numNotif += 1 
        message = 'The experiment ' + experiment_info.name + ' got completed'
        notify = NotificationInfo()
        notify.user_id = owner.id
        notify.username = current_username
        notify.notification = message
        db.session.add(notify)
        db.session.commit()

    response = {'success' : True}
    return jsonify(response)

@blueprint.route('/_rightNotification', methods=['GET', 'POST'])
def _rightNotification():
    message = request.args.get('message', '')
    role = request.args.get('role', 'experimenter')
    users = User.query.filter_by(admin=1).all()
    
    for user in users:
        user.numNotif += 1
        message = 'User ' + current_user.fullname + ' has requested rights for the role ' + role + '.'
        notify = NotificationInfo()
        notify.user_id = user.id
        notify.username = current_user.username
        notify.notification = message
        db.session.add(notify)
        db.session.commit()

    response = {'success' : True}
    return jsonify(response)

@blueprint.route('/getNumNotif', methods=['POST', 'GET'])
def getNumNotif():
    
    numNotif = User.query.filter_by(id=current_user.id).first().numNotif
    
    response = {}
    response['success'] = True
    response['numNotif'] = numNotif
    return jsonify(response)
