from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, g
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user
from rapidannotator import db
from rapidannotator import bcrypt
from rapidannotator.modules.clustering import blueprint
import datetime, os, base64, json, pandas
from rapidannotator.models import User, Experiment, Clustering



@blueprint.route('/_setJob', methods=['GET', 'POST'])
def _setJob():
	experimentId = int(request.args.get('experimentId', None))
	userId = int(request.args.get('userId', None))
	
	clustering = Clustering.query.filter_by(experiment_id = experimentId, user_id=userId, status=0).first()
	if clustering is None:
		clustering = Clustering(experiment_id = experimentId, user_id=userId, status=0)
		db.session.add(clustering)
		db.session.commit()

	response = {}
	response['success'] = True
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
