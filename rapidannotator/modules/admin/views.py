from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, g
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user
from rapidannotator import db, bcrypt
from rapidannotator.models import User, RightsRequest, Experiment, AnnotatorAssociation
from rapidannotator.modules.admin import blueprint
from rapidannotator.modules.admin.forms import EditProfileForm
from rapidannotator.modules.frontpage.forms import RegistrationForm
import datetime


@blueprint.before_request
def before_request():
    if current_app.login_manager._login_disabled:
        pass
    elif not current_user.is_authenticated:
        return "Please login to access this page."
    elif not current_user.is_admin():
        return "You are not an admin, hence allowed to access this page."


@blueprint.route('/')
def index():
    requests = RightsRequest.query.all()
    users = User.query.all()
    addUserForm = RegistrationForm()

    from rapidannotator import app
    for r in requests:
        app.logger.info(r.id)

    return render_template('admin/main.html', requests = requests, users=users, addUserForm = addUserForm)


@blueprint.route('/toggleRequest')
def toggleRequest():

    requestId = request.args.get('requestId', None)
    req = RightsRequest.query.filter_by(id=requestId).first()
    user = User.query.filter_by(id=req.user_id).first()

    if req.approved:
        RightsRequest.query.filter_by(id=requestId).delete()
        user.admin = 0
        db.session.commit()
    else:
        action = 0 if req.approved else 1

        if req.role == "experimenter": user.experimenter = action
        if req.role == "admin": user.admin = action
        req.approved = action

        db.session.commit()

    response = {}
    response['success'] = True

    return jsonify(response)


@blueprint.route('/settings')
def settings():
    users = User.query.all()
    addUserForm = RegistrationForm()
    return render_template('admin/settings.html', users=users, addUserForm = addUserForm)


@blueprint.route('/addUser', methods=['POST'])
def addUser():
    addUserForm = RegistrationForm()

    if addUserForm.validate_on_submit():
        hashedPassword = bcrypt.generate_password_hash(
            addUserForm.password.data).decode('utf-8')
        user = User(
            username = addUserForm.username.data,
            fullname = addUserForm.fullname.data,
            email = addUserForm.email.data,
            password = hashedPassword,
            confirmed=True,
            confirmedOn = datetime.datetime.now(),
        )
        db.session.add(user)
        db.session.commit()

        userId = user.id
        return redirect(url_for('admin.index'))

    errors = "addUserErrors"
    users = User.query.all()
    requests = RightsRequest.query.all()
    return render_template('admin/main.html',
        addUserForm = addUserForm,
        users=users,
        requests = requests,
        errors = errors,)


@blueprint.route('/_deleteUser', methods=['POST','GET'])
def _deleteUser():
    userId = request.args.get('userId', None)
    user = User.query.filter_by(id=userId).first()
    db.session.delete(user)
    db.session.commit()

    response = {}
    response['success'] = True

    return jsonify(response)


@blueprint.route('/editUserProfile/<int:userId>')
def editUserProfile(userId):
    user = User.query.filter_by(id=userId).first()
    editProfileForm = EditProfileForm(obj = user)
    editProfileForm.populate_obj(user)
    return render_template('admin/editUserProfile.html', \
        editProfileForm = editProfileForm, user = user)


@blueprint.route('/updateInfo', methods=['POST'])
def updateInfo():
    
    userId = request.form['userId']
    user = User.query.filter_by(id=userId).first()

    username, fullname = request.form['username'], request.form['fullname']
    email = request.form['email']
    password, confirm_password = request.form['password'], request.form['password2']


    '''Validating Username '''
    if username == '':
        msg = 'Username cannot be Empty!'
        flash(msg)
        return redirect(url_for('admin.editUserProfile', userId = userId))
    else:
        check_user = User.query.filter_by(username=username).first()
        if check_user is not None and int(check_user.id) != int(userId):
            msg = "Username has already taken!"
            flash(msg)
            return redirect(url_for('admin.editUserProfile', userId = userId))
        else:
            user.username = username
    
    ''' Validating Fullname '''
    if fullname == '':
        msg = 'Name cannot be Empty!'
        flash(msg)
        return redirect(url_for('admin.editUserProfile', userId = userId))
    else:
        user.fullname = fullname

    ''' Validating Email '''
    if email == '':
        msg = 'Email cannot be Empty!'
        flash(msg)
        return redirect(url_for('admin.editUserProfile', userId = userId))
    else:
        check_user = User.query.filter_by(email=email).first()
        if check_user is not None and int(check_user.id) != int(userId):
            msg = "Email already in Use!"
            flash(msg)
            return redirect(url_for('admin.editUserProfile', userId = userId))
        else:
            user.email = email


    ''' Validating Password '''
    if password == '' or password != confirm_password:
        msg = 'Invalid Password!'
        flash(msg)
        return redirect(url_for('admin.editUserProfile', userId = userId))
    else:
        hashedPassword = bcrypt.generate_password_hash(password).decode('utf-8')
        user.password = hashedPassword
        
    if request.form['optradio'] == 'yes':
        user.admin = 1
    else:
        user.admin = 0
    db.session.commit()

    flash('Information updated successfully', 'info')
    return redirect(url_for('admin.settings'))


@blueprint.route('/userExperiments/<int:userId>')
def userExperiments(userId):
    user = User.query.filter_by(id=userId).first()
    userExperiments = user.my_experiments.all()
    annotatorAssociation = user.experiments_to_annotate
    userExperimentsToAnnotate = [association.experiment for association in annotatorAssociation]
    return render_template('admin/userExperiments.html', userExperiments = userExperiments, \
        userExperimentsToAnnotate = userExperimentsToAnnotate, userId = userId, user= user)


@blueprint.route('/allExperiments', methods=['GET'])
def allExperiments():
    experiments = Experiment.query.all()
    return render_template('admin/allExperiments.html', experiments = experiments)


@blueprint.route('/searchItems', methods=['GET', 'POST'])
def searchItems():
    key = request.form['search']
    experiments = Experiment.query.all()
    return render_template('admin/userProfile.html', user = current_user)


@blueprint.route('/seeProfile/<int:userId>', methods=['GET', 'POST'])
def seeProfile(userId):
    user = User.query.filter_by(id=userId).first()
    return render_template('admin/userProfile.html', user = user)

@blueprint.route('/userProgress/<int:userId>', methods=['GET', 'POST'])
def userProgress(userId):
    user = User.query.filter_by(id=userId).first()
    experiments = user.my_experiments.all()
    return render_template('home/progress.html',
        experiments = experiments,)

