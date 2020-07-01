"""Forms for AddExperiment/UpdateInformation."""

from flask_babelex import lazy_gettext as _
from flask_login import current_user
from flask_security.forms import email_required, email_validator, \
    unique_user_email
from flask_wtf import FlaskForm
from rapidannotator import bcrypt
from sqlalchemy.orm.exc import NoResultFound
from wtforms import FormField, PasswordField, StringField, SubmitField, \
    BooleanField, SelectField, TextAreaField
from wtforms.validators import DataRequired, EqualTo, StopValidation, \
    ValidationError, Email, Length

from rapidannotator.models import Experiment, User
from rapidannotator.validators import USERNAME_RULES, validate_username


def strip_filter(text):
    """Filter for trimming whitespace.

    :param text: The text to strip.
    :returns: The stripped text.
    """
    return text.strip() if text else text

class AddExperimentForm(FlaskForm):
    name = StringField(
        label=_('Experiment Name'),
        description=_("Required. Experiment Name can't exceed 40 characters"),
        validators=[DataRequired(message=_('Experiment name not provided.')),
                    Length(max=40 ,message=_("Experiment name can't exceed 40 characters."))],
        filters=[strip_filter],
    )

    description = TextAreaField(
        label=_('Experiment description'),
        description=_("A short description, can't exceed 320 characters"),
        validators=[Length(max=320 ,message=_("Experiment description can't exceed 320 characters."))],
        filters =[strip_filter],
    )

    category = SelectField(
        label=_('Type of experiment'),
        description=_("Select the type of files that your experiment has."),
        choices=[   ('video', 'Video'),
                    ('image', 'Image'),
                    ('text', 'Text'),
                    ('audio', 'Audio')],
    )

    uploadType = SelectField(
        label=_('File uploading procedure'),
        description=_("Select the way in which you wish to upload files."),
        choices=[   ('fromConcordance', 'fromConcordance'),
                    ('manual', 'manual'),
                    ('viaSpreadsheet', 'viaSpreadsheet')],
    )

    def validate_name(self, name):
        experiment = Experiment.query.filter_by(name=name.data).first()
        if experiment is not None:
            raise ValidationError(_('Experiment name already taken!'))

class UpdateInfoForm(FlaskForm):
    username = StringField(
        label=_('Username'),
        description=_('Required. %(username_rules)s',
                      username_rules=USERNAME_RULES),
        validators=[DataRequired(message=_('Username not provided.'))],
        filters=[strip_filter],
    )

    fullname = StringField(
        label=_('Fullname'),
        filters=[strip_filter],
    )

    email = StringField(
        label=_('Email'),
        validators=[DataRequired(message=_('Email not provided.')), Email()]
    )

    # oldpassword = PasswordField(
    #     label=_('Old Password'),
    #     validators=[DataRequired(message=_('Old Password not provided.'))],)

    password = PasswordField(
        label=_('Password'),
        validators=[DataRequired(message=_('Password not provided.'))],)
    
    password2 = PasswordField(
        label=_('Confirm Password'),
        validators=[DataRequired(message=_('Confirmation password not provided.')),
                    EqualTo('password')])
    
    def validate_username(self, username):
        """Wrap username validator for WTForms."""
        try:
            validate_username(username.data)
        except ValueError as e:
            raise ValidationError(_('Invalid Username'))

        user = User.query.filter_by(username=username.data).first()

        if user.id != current_user.id:
            if user is not None:
                raise ValidationError(_('Username already taken or earlier Name is Provided!'))

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user.id != current_user.id and user is not None:
            raise ValidationError(_('Email address already registered.'))


class DummyForm(FlaskForm):
    """A Dummy form for testing and debugging."""

    username = StringField(_('Enter something random'),)
    submit = SubmitField(_('Sign In'))

class DummyForm2(FlaskForm):
    """A Dummy form for testing and debugging."""

    username = StringField(_('Enter something random From 2'),)
    email = StringField(_('Email'),)
    password = PasswordField(_('Password'),)
    submit = SubmitField(_('Sign In'))
