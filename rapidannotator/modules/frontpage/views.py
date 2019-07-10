from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, g
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user

from rapidannotator import db
from rapidannotator import bcrypt
from rapidannotator.models import User
from rapidannotator.modules.frontpage import blueprint
from rapidannotator.token import generate_confirmation_token, confirm_token
from rapidannotator.modules.frontpage.forms import LoginForm, RegistrationForm, ForgotPasswordForm
import datetime
from rapidannotator.email import send_email


@blueprint.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home.index'))
    loginForm = LoginForm()
    registrationForm = RegistrationForm()
    forgotPasswordForm = ForgotPasswordForm()

    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm)

@blueprint.route('/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home.index'))

    loginForm = LoginForm()
    registrationForm = RegistrationForm()
    forgotPasswordForm = ForgotPasswordForm()

    if loginForm.validate_on_submit():
        user = User.query.filter_by(username=loginForm.username.data).first()
        if user is None or not bcrypt.check_password_hash(
                                user.password, loginForm.password.data):
            loginForm.username.errors.append(_('Invalid username or password'))
            loginForm.password.errors.append(_('Invalid username or password'))
        else:
            login_user(user, remember=loginForm.remember_me.data)
            return redirect(url_for('home.index'))

    errors = "LogInErrors"
    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm,
        errors = errors,)

@blueprint.route('/register', methods=['POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home.index'))
    loginForm = LoginForm()
    registrationForm = RegistrationForm()
    forgotPasswordForm = ForgotPasswordForm()

    if registrationForm.validate_on_submit():
        hashedPassword = bcrypt.generate_password_hash(
            registrationForm.password.data).decode('utf-8')

        user = User(
            username=registrationForm.username.data,
            fullname=registrationForm.fullname.data,
            email=registrationForm.email.data,
            password=hashedPassword,
            confirmed=False
        )
        db.session.add(user)
        db.session.commit()

        token = generate_confirmation_token(user.email)
        print("The token is :{}".format(token))
        confirm_url = url_for('frontpage.confirm_email', token=token, _external=True)
        print("The Url is :{}".format(confirm_url))
        html = render_template('frontpage/activate.html', confirm_url=confirm_url)
        print(html)
        subject = "Please confirm your email"
        send_email(registrationForm.email.data, subject, html)

        flash(_('Thank you, you are now a registered user. \
                Please Login to continue.'))

        return render_template('frontpage/main.html',
            loginForm = loginForm,
            registrationForm = registrationForm)

    errors = "registrationErrors"
    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm,
        errors = errors,)

@blueprint.route('/forgotPassword', methods=['POST'])
def forgotPassword():
    if current_user.is_authenticated:
        return redirect(url_for('home.index'))
    
    forgotPasswordForm = ForgotPasswordForm()
    loginForm = LoginForm()
    registrationForm = RegistrationForm()

    if forgotPasswordForm.validate_on_submit():
        user = User.query.filter_by(username=forgotPasswordForm.username.data, email=forgotPasswordForm.email.data).first()
        hashedPassword = bcrypt.generate_password_hash(
            forgotPasswordForm.password.data).decode('utf-8')
        user.password = hashedPassword
        db.session.commit()

        flash(_('Password has been Changed Successfully. \
                Please Login to continue.'))

        return render_template('frontpage/main.html',
            loginForm = loginForm,
            registrationForm = registrationForm,
            forgotPasswordForm = forgotPasswordForm)

    errors = "forgotPasswordErrors"
    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm,
        errors = errors,)

@blueprint.route('/confirm/<token>')
def confirm_email(token):
    try:
        email = confirm_token(token)
    except:
        flash('The confirmation link is invalid or has expired.', 'danger')
        return redirect(url_for('frontpage.index'))

    user = User.query.filter_by(email=email).first_or_404()
    if user.confirmed:
        flash('Account already confirmed. Please login.', 'success')
    else:
        user.confirmed = True
        user.confirmedOn = datetime.datetime.now()
        db.session.add(user)
        db.session.commit()
        flash('You have confirmed your account. Thanks!', 'success')
    return redirect(url_for('frontpage.index'))