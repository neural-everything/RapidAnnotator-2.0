from flask import json, render_template, redirect, url_for, request, jsonify, \
    current_app, g, abort, jsonify, send_file
from flask.wrappers import Response
from flask_babelex import lazy_gettext as _

from rapidannotator import db
from rapidannotator.models import User, Experiment, AnnotatorAssociation, AnnotationLevel, Label, File, ElanAnnotation, ElanAnnotation
from rapidannotator.modules.elan import blueprint
from math import ceil
import requests
import os
from rapidannotator.modules.annotate_experiment.views import _getFile, _getSpecificFile, makeKeyBindingDict

from flask_login import current_user
from sqlalchemy import and_
from rapidannotator.modules.common import isAnnotator
from flask_paginate import Pagination
import pandas as pd
from io import BytesIO
import xml.etree.ElementTree as etree
import datetime

import zipfile

@blueprint.before_request
def before_request():
    if current_app.login_manager._login_disabled:
        pass
    elif not current_user.is_authenticated:
        return "Please login to access this page."


@blueprint.route('/<int:experimentId>')
@isAnnotator
def index(experimentId):
    # Get the experiment
    experiment = Experiment.query.filter_by(id=experimentId).first()
    
    # Check if the experiment exists
    if experiment is None:
        return "Experiment not found", 404
    
    # Check experiment`s type
    if experiment.category != 'elan':
        return redirect(url_for('annotate_experiment.index', experimentId = experimentId))

    # Get keybindings
    keyBindingDict, _ = makeKeyBindingDict(experimentId)
    
    # Get the annotator info
    annotatorInfo = AnnotatorAssociation.query.filter_by(user_id=current_user.id).\
                    filter_by(experiment_id=experimentId).first()
    currentFileIndex = annotatorInfo.current
    firstFile = annotatorInfo.start
    lastFile = annotatorInfo.end

    if lastFile == -1:
        lastFile = experiment.files.count() - 1
    
    # Get the file to be annotated
    currentFile = {}
    if currentFileIndex <= lastFile:
        currentFile = _getFile(experimentId, currentFileIndex, firstFile)        
    
    # The labels warning message in case of labels count is changed in the middle of the annotation
    labelCount = 0
    labelWarning = 0
    
    # Count labels of the experiment (actually)
    annotationLevels = AnnotationLevel.query.filter_by(experiment_id=experimentId).all()
    for level in annotationLevels:
        labels = Label.query.filter_by(annotation_id=level.id)
        labelCount += labels.count()
    
    # Compare with last count stored in the experiment's object
    if experiment.countLabel != labelCount and experiment.countLabel != -1 and labelCount != 0:
        if currentFileIndex > 0:
            labelWarning = 1
    
    # Update the count in the experiment's object
    if labelCount == 0:
        experiment.countLabel = -1
        db.session.commit()
    else:
        experiment.countLabel = labelCount
        db.session.commit()
    
    # Progress bar width
    progress_width = round((currentFileIndex/ (lastFile  + 1))*100, 2)
    
    # Is that an experiment owner?
    isExpowner =  int((current_user in  experiment.owners))
    
    # Get annotations (incase of specific annotation is used before!)
    fileId = currentFile["id"]if currentFile else None
    annotations = ElanAnnotation.query.filter(and_(ElanAnnotation.user_id==current_user.id, ElanAnnotation.file_id==fileId)).first()
    

    # Return the response
    return render_template('elan/main.html',
        experiment = experiment,
        currentFile = currentFile,
        currentFileIndex = currentFileIndex,
        lastFile = lastFile,
        firstFile = firstFile,
        keyBindingDict = keyBindingDict,
        labelWarning = labelWarning,
        progress_width = progress_width,
        isExpowner = isExpowner,
        annotations = annotations.data if annotations is not None else {},
    ) 


''' delete the annotation of the specified file & experiment '''
@blueprint.route('/deleteAnnotation', methods=['DELETE'])
def deleteAnnotation():
    # Parse the request body and ensure it contains the experiment ID
    experimentId = request.form.get('experimentId', None)
    if experimentId is None:
        abort(400)
    # Remove the annotations of that file
    fileId = request.form.get('fileId', None)
    if fileId is not None:
        ElanAnnotation.query.filter(and_(ElanAnnotation.user_id==current_user.id, ElanAnnotation.file_id==fileId)).delete()
    
    # Get the annotator association 
    annotatorInfo = AnnotatorAssociation.query.filter_by(user_id=current_user.id).filter_by(experiment_id=experimentId).first()
    
    # Update the current file index
    if annotatorInfo.current > annotatorInfo.start:
        annotatorInfo.current = annotatorInfo.current - 1
        db.session.commit()

    # Get the previous file i.e. current file after undo operation is done
    currentFile = _getFile(experimentId, annotatorInfo.current, annotatorInfo.start)
    
    # Prepare the response
    response = {}
    response['success'] = True
    response['currentFile'] = currentFile
    response['currentFileIndex'] = annotatorInfo.current
    # Get the annotations of the current file
    elanAnnotation = None
    if 'id' in currentFile.keys():
        elanAnnotation = ElanAnnotation.query.filter(and_(ElanAnnotation.user_id==current_user.id, ElanAnnotation.file_id==currentFile['id'])).first()
    # Attach the annotations to the response
    response['annotations'] = elanAnnotation.data if elanAnnotation is not None else {}
    # Return the response
    return jsonify(response)


@blueprint.route('/addAnnotation', methods=['POST'])
def addAnnotation():
    # Parse the request body and ensure it contains the experiment ID, file ID, and annotations
    fileId = request.json.get('fileId', None)
    experimentId = request.json.get('experimentId', None)
    updateSpecific = request.json.get('updateSpecific', None)
    if fileId is None or experimentId is None:
        abort(400)
    annotations = request.json.get('annotations', {})
    # Remove the annotations of that file, if any exist
    ElanAnnotation.query.filter(and_(ElanAnnotation.user_id==current_user.id, ElanAnnotation.file_id==fileId)).delete()
    db.session.commit()
    # Add the new annotations
    elanAnnotation = ElanAnnotation(file_id = fileId, user_id = current_user.id, data = annotations)
    db.session.add(elanAnnotation)
    # Dont make the increment of the current annotator's file index if the specific annotation is used
    # Return the response
    if updateSpecific:
        db.session.commit()
        return jsonify({'success': True})
    # Increment the current file index (normal procedure)
    annotatorInfo = AnnotatorAssociation.query.filter_by(user_id=current_user.id).filter_by(experiment_id=experimentId).first()
    end = annotatorInfo.end 
    if end == -1:
        end = Experiment.query.filter_by(id=experimentId).first().files.count()
    annotatorInfo.current = annotatorInfo.current + 1
    if annotatorInfo.current >= end:
        annotatorInfo.current = end
    db.session.commit()
    response = {}
    response['success'] = True
    response['currentFileIndex'] = annotatorInfo.current
    response['finished'] = annotatorInfo.current == end
    currentFile = {}
    if annotatorInfo.current < end:
        currentFile = _getFile(experimentId, annotatorInfo.current, annotatorInfo.start)
    response['currentFile'] = currentFile
    elanAnnotation = None
    if 'id' in currentFile.keys():
        elanAnnotation = ElanAnnotation.query.filter(and_(ElanAnnotation.user_id==current_user.id, ElanAnnotation.file_id==currentFile['id'])).first()
    # Attach the annotations to the response
    response['annotations'] = elanAnnotation.data if elanAnnotation is not None else {}
    return jsonify(response)


@blueprint.route('/_getSpecificFileDetails', methods=['POST','GET'])
def _getSpecificFileDetails():
    experimentId = request.args.get('experimentId', None)
    fileId = request.args.get('fileId', None)
    currentFile = _getSpecificFile(experimentId, int(fileId))
    annotations = ElanAnnotation.query.filter(and_(ElanAnnotation.user_id==current_user.id, ElanAnnotation.file_id==fileId)).first()
    response = {}
    response['success'] = True
    response['currentFile'] = currentFile
    response['annotations'] = annotations.data if annotations is not None else {}
    return jsonify(response)


def viewResults(experimentId, userId, page, per_page, offset):
    experiment = Experiment.query.filter_by(id=experimentId).first()
    if experiment is None:
        abort(404)
    annotators = [assoc.annotator for assoc in experiment.annotators]
    total = ceil(File.query.filter_by(experiment_id=experiment.id).count() / per_page)
    pagination = Pagination(page=page, per_page=per_page, total=total, css_framework='bootstrap3')
    expFiles = File.query.filter_by(experiment_id=experiment.id)\
            .join(ElanAnnotation, ElanAnnotation.file_id == File.id, isouter=True)\
            .limit(per_page).offset(offset)
    user = User.query.filter_by(id=userId).first()
    annotations = []
    for file in expFiles:
        annotation = ElanAnnotation.query.filter_by(file_id=file.id, user_id=userId).first()
        if annotation is not None:
            annotations.append(annotation.data)
        else:
            annotations.append({})
    return render_template('elan/results.html',
        experiment=experiment,
        annotations=annotations, 
        exp_files=expFiles, page=page, \
        per_page=per_page, pagination=pagination,\
        annotators=annotators, user=user)


@blueprint.route('/specificAnnotation/<int:userId>/<int:experimentId>/<int:fileId>', methods=['GET', 'POST'])
def specificAnnotation(userId, experimentId, fileId):
    experiment = Experiment.query.filter_by(id=experimentId).first()
    keyBindingDict, skipLevelDict = makeKeyBindingDict(experimentId)

    currentFile = _getSpecificFile(experimentId, fileId)

    annotations = ElanAnnotation.query.filter_by(user_id= userId, file_id= fileId).first()
    if annotations is None:
        annotations = {}
    else:
        annotations = annotations.data
    isExpowner =  int((current_user in  experiment.owners))

    return render_template('elan/specific.html',
        experiment = experiment,
        currentFile = currentFile,
        keyBindingDict = keyBindingDict,
        skipLevelDict = skipLevelDict,
        isExpowner = isExpowner,
        fileId = fileId,
        userId = userId,
        annotations=annotations,
    )


@blueprint.route('/exportResults/<int:experimentId>/<exportType>', methods=['GET'], defaults={'userId': None, 'fileId': None})
@blueprint.route('/exportResults/<int:experimentId>/<int:userId>/<int:fileId>', methods=['GET'])
def exportResults(experimentId, exportType, userId=None, fileId=None):
    experiment = Experiment.query.filter_by(id=experimentId).first()
    if experiment is None:
        abort(404)
    expFiles = []
    if fileId is not None:
        expFiles.append(File.query.filter_by(id=fileId).first())
    else:
        expFiles = File.query.filter_by(experiment_id=experiment.id).all()
    resultsDataFrame = pd.DataFrame(columns = ['File Name', 'Annotator', 'Tier Name', 'Annotation Text', 'Start Time (sec)', 'End Time (sec)'])
    annotations = []
    if userId is None :
        annotations = ElanAnnotation.query.filter(ElanAnnotation.file_id.in_([file.id for file in expFiles]))\
        .join(ElanAnnotation, ElanAnnotation.file_id == File.id)\
        .join(User, User.id == ElanAnnotation.user_id)\
        .add_columns(File.name, User.username, ElanAnnotation.data).all()
    else:
        annotations = ElanAnnotation.query.filter_by(user_id=userId)\
        .filter(ElanAnnotation.file_id.in_([file.id for file in expFiles]))\
        .join(ElanAnnotation, ElanAnnotation.file_id == File.id)\
        .add_columns(File.name, User.username, ElanAnnotation.data).all()
    levelsMap = {}
    for level in experiment.annotation_levels:
        levelsMap[level.id] = level.name
    for annotation in annotations:
        for levelId, tierData in annotation.data.items():
            for annotationEntry in tierData:
                resultsDataFrame = resultsDataFrame.append({
                    'File Name': annotation['name'],
                    'Annotator': annotation['username'],
                    'Tier Name': levelsMap[int(levelId)],
                    'Annotation Text': annotationEntry['text'],
                    'Start Time (sec)': annotationEntry['startTime'],
                    'End Time (sec)': annotationEntry['endTime']
                }, ignore_index=True)
    if exportType == 'csv':
        return Response(
            resultsDataFrame.to_csv(index=False),
            mimetype="text/csv",
            headers={"Content-disposition":
                     "attachment; filename={}-results.csv".format(experiment.name)})
    elif exportType == 'json':
        return Response(
            resultsDataFrame.to_json(orient='records'),
            mimetype="application/json",
            headers={"Content-disposition":
                     "attachment; filename={}-results.json".format(experiment.name)})
    elif exportType == 'xlsx':
        buffer = BytesIO()
        resultsDataFrame.to_excel(buffer, index=False)
        return Response(
            buffer.getvalue(),
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-disposition":
                     "attachment; filename={}-results.xlsx".format(experiment.name)})
    else:
        abort(404)
        
@blueprint.route('/downloadEafFile/<int:userId>/<int:experimentId>/<int:fileId>', methods=['GET'])
def downloadEafFile(experimentId, userId, fileId):
    experiment = Experiment.query.filter_by(id=experimentId).first()
    if experiment is None:
        abort(404)
    file = File.query.filter_by(id=fileId).first()
    if file is None:
        abort(404)
    annotation = ElanAnnotation.query.filter_by(file_id=fileId, user_id=userId).first()
    if annotation is None:
        abort(404)
    annotations = annotation.data
    author = User.query.filter_by(id=userId).first().username
    eafXML = createEafXML(experiment, file, annotations, author)
    eafBytes = BytesIO(eafXML)
    return Response(eafBytes, mimetype="application/xml", headers={"Content-disposition": "attachment; filename={}.eaf".format(file.name)})
    


def createEafXML(experiment, file, annotations, author):
    # Configuration
    FORMAT = '3.0'
    VERSION = '3.0'
    DATE = datetime.datetime.now().strftime("%Y-%m-%d")
    TIME_UNITS = 'milliseconds'
    MEDIA_FILE = file.name
    VERSION = '1.0'
    MEDIA_TYPE = 'video'
    MIME_TYPE = 'video/mp4'
    RELATIVE_MEDIA_URL = "file://./{}".format(file.name+".mp4")
    if experiment.uploadType == "manual":
        RELATIVE_MEDIA_URL = "file://./{}".format(file.name)
    # Root element
    eaf = etree.Element('ANNOTATION_DOCUMENT', AUTHOR=author, FORMAT=FORMAT, VERSION=VERSION, DATE=DATE)
    # Header element
    header = etree.Element('HEADER', TIME_UNITS=TIME_UNITS, MEDIA_FILE=MEDIA_FILE, MEDIA_TYPE=MEDIA_TYPE, MIME_TYPE=MIME_TYPE, RELATIVE_MEDIA_URL=RELATIVE_MEDIA_URL)
    mediaDiscriptor = etree.Element('MEDIA_DESCRIPTOR')
    mediaDiscriptor.set('MEDIA_URL', RELATIVE_MEDIA_URL)
    mediaDiscriptor.set('MIME_TYPE', MIME_TYPE)
    header.append(mediaDiscriptor)
    # Time order element
    timeSlots = etree.Element('TIME_ORDER')
    timeSlotId = 1
    # Helper mapping for time slot ids
    timeSlotDict = {}
    # Helper mapping for tier ids
    tiersDict = {}
    # Tier ids counter
    annotationItr = 1
    linguisticTypesElements = []
    # Create linguistic types and tiers containers
    for level in experiment.annotation_levels:
        tier = etree.Element('TIER')
        tier.set('LINGUISTIC_TYPE_REF', level.name)
        tier.set('TIER_ID', level.name)
        tiersDict[str(level.id)] = tier
        linguisticType = etree.Element('LINGUISTIC_TYPE')
        linguisticType.set('LINGUISTIC_TYPE_ID', level.name)
        linguisticType.set('TIME_ALIGNABLE', 'true')
        linguisticType.set('GRAPHIC_REFERENCES', 'false')
        linguisticTypesElements.append(linguisticType)
    # Create annotations
    for tierId, tierAnnotations in annotations.items():
        for annotation in tierAnnotations:
            # Convert time to milliseconds
            startTime = str(int(annotation['startTime'] * 1000))
            endTime = str(int(annotation['endTime'] * 1000))
            # Check if time slot exists or not (create if not)
            # Start time
            if startTime not in timeSlotDict:
                timeSlot = etree.Element('TIME_SLOT')
                tId =  _timeSlotID(timeSlotId)
                timeSlot.set('TIME_SLOT_ID', tId)
                timeSlot.set('TIME_VALUE', startTime)
                timeSlotDict[startTime] = tId
                timeSlotId += 1
                timeSlots.append(timeSlot)
            # End time
            if endTime not in timeSlotDict:
                timeSlot = etree.Element('TIME_SLOT')
                tId = _timeSlotID(timeSlotId)
                timeSlot.set('TIME_SLOT_ID', tId)
                timeSlot.set('TIME_VALUE', endTime)
                timeSlotDict[endTime] = tId
                timeSlotId += 1
                timeSlots.append(timeSlot)
            # Create annotation element
            annotationElement = etree.Element('ANNOTATION')
            alignableAnnotation = etree.Element('ALIGNABLE_ANNOTATION')
            alignableAnnotation.set('ANNOTATION_ID', _annotationID(annotationItr))
            alignableAnnotation.set('TIME_SLOT_REF1',timeSlotDict[startTime])
            alignableAnnotation.set('TIME_SLOT_REF2', timeSlotDict[endTime])
            annotationValue = etree.Element('ANNOTATION_VALUE')
            annotationValue.text = annotation['text']
            alignableAnnotation.append(annotationValue)
            annotationElement.append(alignableAnnotation)
            # Add annotation to tier
            tiersDict[tierId].append(annotationElement)
            # Increment annotation id
            annotationItr += 1
    # Add header to the root element
    eaf.append(header)
    # Add time order to the root element
    eaf.append(timeSlots)
    # Add tiers to the root element
    for tier in tiersDict.values():
        eaf.append(tier)
    # Add linguistic types to the root element
    for linguisticType in linguisticTypesElements:
        eaf.append(linguisticType)
    # Return the XML as string
    return etree.tostring(eaf, encoding='utf-8')

def _timeSlotID(timeSlotId):
    return 'ts{}'.format(timeSlotId)

def _annotationID(annotationId):
    return 'a{}'.format(annotationId)

    
@blueprint.route('/_discardAnnotations', methods=['POST','GET'])
def _discardAnnotations():
    experimentId = request.args.get('experimentId', None)
    experiment = Experiment.query.filter_by(id=experimentId).first()
    experiment.status = 'In Progress'
    experiment.is_done = 0
    expFilesIds = [file.id for file in experiment.files]
    ElanAnnotation.query.filter(ElanAnnotation.file_id.in_(expFilesIds)).delete(synchronize_session=False)
    annotatorsInfo = AnnotatorAssociation.query.filter_by(experiment_id=experimentId).all()
    for annotatorInfo in annotatorsInfo:
        annotatorInfo.current = 0
    db.session.commit()
    response = {}
    response['success'] = True

    return jsonify(response)

@blueprint.route('/_discardSingleAnnotation', methods=['POST','GET'])
def _discardSingleAnnotation():
    
    experimentId = request.args.get('experimentId', None)
    fileId = request.args.get('fileId', None)

    experiment = Experiment.query.filter_by(id=experimentId).first()
    experiment.status = 'In Progress'
    annotationLevels = AnnotationLevel.query.filter_by(experiment_id=experimentId).all()

    '''
        ..  delete the AnnotationInfo for all the levels
            of this file.
        .. check if the file is annotated or not
        ..  decrease the current pointer of the
            annotation.
    '''
    is_annotated = 0
    
    for level in annotationLevels:
        is_annotated = ElanAnnotation.query.filter_by(user_id=current_user.id,\
            annotationLevel_id=level.id, file_id = fileId).delete()
    
    if is_annotated == 1:
        annotatorsInfo = AnnotatorAssociation.query.filter_by(experiment_id=experimentId).all()
        for annotatorInfo in annotatorsInfo:
            annotatorInfo.current = annotatorInfo.current - 1

    db.session.commit()
    response = {}
    response['success'] = True

    return jsonify(response)



@blueprint.route('/downloadEafGroupedFile/<int:experimentId>/<int:fileId>', methods=['GET'])
def downloadEafGroupedFile(experimentId, fileId):
    experiment = Experiment.query.filter_by(id=experimentId).first()
    if experiment is None:
        abort(404)
    file = File.query.filter_by(id=fileId).first()
    if file is None:
        abort(404)
    annotators = [assoc.annotator for assoc in experiment.annotators]
    annotations = ElanAnnotation.query.filter_by(file_id=fileId).all()
    eafXML = createEafGroupedXML(experiment, file, annotations, annotators)
    eafBytes = BytesIO(eafXML)
    return Response(eafBytes, mimetype='text/xml', headers={'Content-Disposition': 'attachment; filename={}.eaf'.format(file.name)})

def createEafGroupedXML(experiment, file, annotations, annotators):
    """
    Create EAF XML from annotations
    :param annotations: list of annotations
    :return: EAF XML
    """
    # Configuration
    FORMAT = '3.0'
    VERSION = '3.0'
    DATE = datetime.datetime.now().strftime("%Y-%m-%d")
    TIME_UNITS = 'milliseconds'
    MEDIA_FILE = file.name
    VERSION = '1.0'
    MEDIA_TYPE = 'video'
    MIME_TYPE = 'video/mp4'
    RELATIVE_MEDIA_URL = "file://./{}".format(file.name+".mp4")
    if experiment.uploadType == "manual":
        RELATIVE_MEDIA_URL = "file://./{}".format(file.name)
    # Root element
    eaf = etree.Element('ANNOTATION_DOCUMENT', FORMAT=FORMAT, VERSION=VERSION, DATE=DATE)
    # Header element
    header = etree.Element('HEADER', TIME_UNITS=TIME_UNITS, MEDIA_FILE=MEDIA_FILE, MEDIA_TYPE=MEDIA_TYPE, MIME_TYPE=MIME_TYPE, RELATIVE_MEDIA_URL=RELATIVE_MEDIA_URL)
    mediaDiscriptor = etree.Element('MEDIA_DESCRIPTOR')
    mediaDiscriptor.set('MEDIA_URL', RELATIVE_MEDIA_URL)
    mediaDiscriptor.set('MIME_TYPE', MIME_TYPE)
    header.append(mediaDiscriptor)
    # Time order element
    timeSlots = etree.Element('TIME_ORDER')
    timeSlotId = 1
    # Helper mapping for time slot ids
    timeSlotDict = {}
    # Helper mapping for tier ids
    tiersDict = {}
    # Tier ids counter
    annotationItr = 1
    linguisticTypesElements = []
    annotatorsDict = {}
    # Create linguistic types and tiers containers
    for annotator in annotators:
        annotatorsDict[annotator.id] = annotator
        for level in experiment.annotation_levels:
            tier = etree.Element('TIER')
            tier.set('LINGUISTIC_TYPE_REF', level.name + "("+annotator.username+")")
            tier.set('TIER_ID', level.name + "("+annotator.username+")")
            tiersDict[str(level.id)+ "("+annotator.username+")"] = tier
            linguisticType = etree.Element('LINGUISTIC_TYPE')
            linguisticType.set('LINGUISTIC_TYPE_ID', level.name + "("+annotator.username+")")
            linguisticType.set('TIME_ALIGNABLE', 'true')
            linguisticType.set('GRAPHIC_REFERENCES', 'false')
            linguisticTypesElements.append(linguisticType)
    for annotation in annotations:
        annotatorUsername = annotatorsDict[annotation.user_id].username
        for tierId, tierAnnotations in annotation.data.items():
            for annotation in tierAnnotations:
                # Convert time to milliseconds
                startTime = str(int(annotation['startTime'] * 1000))
                endTime = str(int(annotation['endTime'] * 1000))
                # Check if time slot exists or not (create if not)
                # Start time
                if startTime not in timeSlotDict:
                    timeSlot = etree.Element('TIME_SLOT')
                    tId =  _timeSlotID(timeSlotId)
                    timeSlot.set('TIME_SLOT_ID', tId)
                    timeSlot.set('TIME_VALUE', startTime)
                    timeSlotDict[startTime] = tId
                    timeSlotId += 1
                    timeSlots.append(timeSlot)
                # End time
                if endTime not in timeSlotDict:
                    timeSlot = etree.Element('TIME_SLOT')
                    tId = _timeSlotID(timeSlotId)
                    timeSlot.set('TIME_SLOT_ID', tId)
                    timeSlot.set('TIME_VALUE', endTime)
                    timeSlotDict[endTime] = tId
                    timeSlotId += 1
                    timeSlots.append(timeSlot)
                # Create annotation element
                annotationElement = etree.Element('ANNOTATION')
                alignableAnnotation = etree.Element('ALIGNABLE_ANNOTATION')
                alignableAnnotation.set('ANNOTATION_ID', _annotationID(annotationItr))
                alignableAnnotation.set('TIME_SLOT_REF1',timeSlotDict[startTime])
                alignableAnnotation.set('TIME_SLOT_REF2', timeSlotDict[endTime])
                annotationValue = etree.Element('ANNOTATION_VALUE')
                annotationValue.text = annotation['text']
                alignableAnnotation.append(annotationValue)
                annotationElement.append(alignableAnnotation)
                # Add annotation to tier
                tiersDict[tierId + "("+annotatorUsername+")"].append(annotationElement)
                # Increment annotation id
                annotationItr += 1
    # Add header to the root element
    eaf.append(header)
    # Add time order to the root element
    eaf.append(timeSlots)
    # Add tiers to the root element
    for tier in tiersDict.values():
        eaf.append(tier)
    # Add linguistic types to the root element
    for linguisticType in linguisticTypesElements:
        eaf.append(linguisticType)
    # Return the XML as string
    return etree.tostring(eaf, encoding='utf-8')

@blueprint.route('/downloadAllEafResults/<int:experimentId>/<int:includeVideos>', methods=['GET'])
def downloadAllEafResults(experimentId, includeVideos=0):
    experiment = Experiment.query.filter_by(id=experimentId).first()
    if experiment is None:
        abort(404)
    files = experiment.files
    annotators = [assoc.annotator for assoc in experiment.annotators]
    compressedFile = BytesIO()
    for file in files:
        annotations = ElanAnnotation.query.filter_by(file_id=file.id).all()
        eafXML = createEafGroupedXML(experiment, file, annotations, annotators)
        eafBytes = BytesIO(eafXML)
        with zipfile.ZipFile(compressedFile, 'a') as zip:
            zip.writestr(file.name + '.eaf', eafBytes.getvalue())
            if includeVideos:
                video = None
                if experiment.uploadType == 'fromConcordance' or experiment.uploadType == 'viaSpreadsheet':
                # Download the video snippet
                    try:
                        video = requests.get(file.content)
                        zip.writestr(file.name + '.mp4', video.content)
                    except Exception as e:
                        current_app.logger.error(e)
                else:
                    # read video from file
                    video_path = os.path.join(current_app.config['UPLOAD_FOLDER'], str(experiment.id), file.content)
                    try:
                        video = open(video_path, 'rb')
                        zip.writestr(file.name, video.read())
                    except Exception as e:
                        current_app.logger.error(e)
    return Response(compressedFile.getvalue(), mimetype='application/zip', headers={'Content-Disposition': 'attachment; filename={}.zip'.format(experiment.name)})
            