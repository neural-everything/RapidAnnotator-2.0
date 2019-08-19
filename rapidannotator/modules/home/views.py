from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, abort
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user

from rapidannotator import db
from rapidannotator import bcrypt
import flask_bcrypt
from rapidannotator.models import User, Experiment, RightsRequest, AnnotatorAssociation
from rapidannotator.modules.home import blueprint
from rapidannotator.modules.home.forms import AddExperimentForm, UpdateInfoForm

@blueprint.before_request
def before_request():
    if current_app.login_manager._login_disabled:
        pass
    elif not current_user.is_authenticated:
        return current_app.login_manager.unauthorized()



@blueprint.route('/')
def index():
    addExperimentForm = AddExperimentForm()
    myExperiments = current_user.my_experiments.all()
    annotatorAssociation = current_user.experiments_to_annotate
    experimentsToAnnotate = [association.experiment for association in annotatorAssociation]
    
    totalExperiments = Experiment.query.all()
    othersExperiments = []
    for experiment in totalExperiments:
        owners = experiment.owners
        if (current_user in owners) and (owners.count() == 1):
            continue
        othersExperiments.append(experiment)
    
    is_admin = int(current_user.is_admin())

    return render_template('home/main.html',
        addExperimentForm = addExperimentForm,
        myExperiments = myExperiments,
        experimentsToAnnotate = experimentsToAnnotate,
        othersExperiments = othersExperiments,
        is_admin = is_admin,
        )

@blueprint.route('/addExperiment', methods=['POST'])
def addExperiment():
    addExperimentForm = AddExperimentForm()

    if addExperimentForm.validate_on_submit():
        print(addExperimentForm.category.data)
        experiment = Experiment(
            name=addExperimentForm.name.data,
            description=addExperimentForm.description.data,
            category=addExperimentForm.category.data,
            uploadType=addExperimentForm.uploadType.data,
        )
        experiment.owners.append(current_user)
        db.session.add(experiment)
        db.session.commit()

        experimentId = experiment.id
        return redirect(url_for('add_experiment.index', experimentId = experimentId, page = 1))

    errors = "addExperimentErrors"
    return render_template('home/main.html',
        addExperimentForm = addExperimentForm,
        errors = errors,)


@blueprint.route('/askRights', methods=['GET', 'POST'])
def askRights():
    message = request.args.get('message', '')
    role = request.args.get('role', 'experimenter')

    rightsRequest = RightsRequest(
        user_id = current_user.id,
        username = current_user.username,
        role = role,
        message = message,
    )

    db.session.add(rightsRequest)
    db.session.commit()

    response = {}
    response['success'] = True

    return jsonify(response)

''' check for what right do the user has / requested for '''
@blueprint.route('/checkRights', methods=['GET', 'POST'])
def checkRights():

    requestsSent = RightsRequest.query.filter_by(user_id=current_user.id)
    
    if requestsSent.count() == 0:
        response = {}
        response['success'] = False
        return jsonify(response)
    
    response = {}
    response['success'] = True

    for r in requestsSent:
        if r.role == "experimenter": response['experimenterRequest'] = True
        if r.role == "admin": response['adminRequest'] = True

    return jsonify(response)

@blueprint.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return redirect(url_for('frontpage.index'))

@blueprint.route('/updateInfo', methods=['GET', 'POST'])
def updateInfo():

    user = current_user
    updateForm = UpdateInfoForm(obj=user)
    updateForm.populate_obj(user)
    
    if request.method == 'GET':
        return render_template('home/settings.html', updateForm = updateForm,\
            user = current_user)
    elif request.method == 'POST':
        updateForm1 = UpdateInfoForm()
        if updateForm1.validate_on_submit():
            user = User.query.filter_by(id=current_user.id).first()    
            user.username = updateForm1.username.data
            user.fullname = updateForm1.fullname.data
            user.email = updateForm1.email.data
            if updateForm.password.data is not None:
                hashedPassword = bcrypt.generate_password_hash(\
                    updateForm1.password.data).decode('utf-8')
                user.password = hashedPassword
            db.session.commit()
            flash(_('Information updated successfully'))
            return render_template('home/settings.html', updateForm = updateForm, \
                user = current_user)    

        errors = "UpdateErrors"
        return render_template('home/settings.html',
            updateForm = updateForm1,
            user = current_user,
            errors = errors,)

@blueprint.route('/checkProgress', methods=['GET'])
def checkProgress():
    experiments = current_user.my_experiments.all()
    return render_template('home/progress.html',
        experiments = experiments,)

@blueprint.route('/getExperimentProgressData', methods=['GET', 'POST'])
def getExperimentProgressData():
    
    experimentName = request.args.get('experimentName', None)
    experiment = Experiment.query.filter_by(name=experimentName).first()
    annotators = experiment.annotators
    filesLength = experiment.files.count()
    if filesLength != 0:
        filesLength = (100/filesLength)
    
    chartInfo = []
    chartInfo.append(['Annotator Name', 'Progress'])
    for association in annotators:
        user = User.query.filter_by(id=association.user_id).first()
        chartInfo.append([user.username, (association.current*filesLength)])

    response = {}
    response['success'] = True
    response['chartInfo'] = chartInfo
    response['size'] = len(chartInfo) - 1

    return jsonify(response)

@blueprint.route('/getUserProgressData', methods=['GET', 'POST'])
def getUserProgressData():
    
    associations = AnnotatorAssociation.query.filter_by(user_id=current_user.id).all()
    chartInfo = []
    chartInfo.append(['Experiment Name', 'Progress'])
    for association in associations:
        experiment = Experiment.query.filter_by(id=association.experiment_id).first()
        filesLength = experiment.files.count()
        if filesLength != 0:
            filesLength = (100/filesLength)
        chartInfo.append([experiment.name, (association.current*filesLength)])
    
    response = {}
    response['success'] = True
    response['chartInfo'] = chartInfo
    response['size'] = len(chartInfo) - 1

    return jsonify(response)
