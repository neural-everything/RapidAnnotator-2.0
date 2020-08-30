from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, g
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user
from rapidannotator import db
from rapidannotator import bcrypt
from rapidannotator.modules.clustering import blueprint
import datetime, os, base64, json, pandas
from rapidannotator.models import User, Experiment, Clustering
import requests as rq



@blueprint.route('/_setJob', methods=['GET', 'POST'])
def _setJob():
	experimentId = int(request.args.get('experimentId', None))
	userId = int(request.args.get('userId', None))
	
	clustering = Clustering.query.filter_by(experiment_id = experimentId).first()
	if clustering is None:
		clustering = Clustering(experiment_id = experimentId, user_id = userId, status=0)
		db.session.add(clustering)
		db.session.commit()

		response = {}
		response['success'] = True
		return jsonify(response)
	else:
		clustering = Clustering.query.filter_by(experiment_id = experimentId).first()
		response = {}
		response['success'] = False
		response['msg'] = "Clustering is under process ! Please Wait!"
		if clustering.status == 2:
			response['msg'] = "Clustering is already Done!"
		return jsonify(response)


@blueprint.route('/getJobData', methods=['GET'])
def index():
	clusters = Clustering.query.all()
	response = {}
	response['jobsData'] = []
	for cluster in clusters:
		if str(cluster.status) == '0':
			from rapidannotator import app
			experimentDIR = os.path.join(app.config['UPLOAD_FOLDER'], str(cluster.experiment_id))
			inputConcordance = os.path.join(experimentDIR, 'concordance.csv')
			data = pandas.read_csv(inputConcordance)
			first_pair = data['Screenshot'].tolist()
			second_pair = list(range(1, len(first_pair) + 1))
			dictionary = {'fileId': second_pair, 'imageURLS': first_pair, 'jobId': cluster.id, 'experiment_id': str(cluster.experiment_id)}
			response['jobsData'].append(dictionary)
	response['success'] = True
	return jsonify(response)

@blueprint.route('/setJobStatus', methods=['GET', 'POST'])
def setJobStatus():

	content = request.data
	content = content.decode('utf-8')
	content = eval(content)
	jobId = int(content['jobId'])
	
	clustering = Clustering.query.filter_by(id = jobId).first()
	if clustering is None:
		response = {}
		response['success'] = False
		return jsonify(response)

	if content['jobStatus'] == 'Processing':
		clustering.status = 1
		db.session.commit()

	response = {}
	response['success'] = True
	return jsonify(response)


@blueprint.route('/publishResults', methods=['GET', 'POST'])
def publishResults():

	content = request.data
	content = content.decode('utf-8')
	content = eval(content)
	
	from rapidannotator import app
	experimentDIR = os.path.join(app.config['UPLOAD_FOLDER'], str(content['experiment_id']))
	outJson = os.path.join(experimentDIR, 'output.json')


	out = content['largest1']
	out1 = sorted(range(len(out)), key=lambda k: out[k], reverse=True)
	content['sortOrder'] = out1


	with open(outJson, 'w') as json_file:
		json.dump(content, json_file, indent = 4, sort_keys=True)

	jobId = int(content['job_id'])
	clustering = Clustering.query.filter_by(id = jobId).first()

	if clustering is None:
		response = {}
		response['success'] = False
		return jsonify(response)

	clustering.status = 2
	db.session.commit()

	response = {}
	response['success'] = True
	return jsonify(response)

@blueprint.route('/getStatus', methods=['GET', 'POST'])
def getStatus():
	experiment_id = request.form['experiment_id']
	if experiment_id is not None:
		experiment_id = int(experiment_id)

	clustering = Clustering.query.filter_by(experiment_id = experiment_id, user_id = int(current_user.id)).first()
	if clustering is None:
		status = 0
	else:
		status = clustering.status

	response = {}
	response['success'] = True
	response['status'] = status
	return jsonify(response)
