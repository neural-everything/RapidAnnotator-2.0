from flask import render_template, flash, redirect, url_for, request, jsonify, \
    current_app, g
from flask_babelex import lazy_gettext as _
from flask_login import current_user, login_required, login_user, logout_user
from rapidannotator import db
from rapidannotator import bcrypt
from rapidannotator.models import User
from rapidannotator.modules.frontpage import blueprint
from rapidannotator.token import generate_confirmation_token, confirm_token
from rapidannotator.modules.frontpage.forms import LoginForm, RegistrationForm, \
    ForgotPasswordForm
import datetime, os, base64
import onetimepass as otp
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
        forgotPasswordForm = forgotPasswordForm,
        otpShow = 0)

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
        elif user is not None and not user.confirmed:
            flash(_('Your Account is not Validated! Please confirm your email'))
            return redirect(url_for('frontpage.index'))
        else:
            login_user(user, remember=loginForm.remember_me.data)
            return redirect(url_for('home.index'))

    errors = "LogInErrors"
    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm,
        otpShow = 0,
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
        confirm_url = url_for('frontpage.confirm_email', token=token, _external=True)
        html = render_template('frontpage/activate.html', confirm_url=confirm_url)
        subject = "Please confirm your email"
        send_email(registrationForm.email.data, subject, html)

        flash(_('Thank you, you are now a registered user. \
            A confirmation email has been sent. \
                Please confirm your Email for the Login.'))

        return redirect(url_for('frontpage.index'))

    errors = "registrationErrors"
    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm,
        otpShow = 0,
        errors = errors,)


def generateOTP(user):
    secKey = base64.b32encode(os.urandom(10)).decode('utf-8')
    user.secKey = secKey
    db.session.commit()
    token = otp.get_hotp(secKey, intervals_no=3)
    html = render_template('frontpage/otp.html', token=token)
    subject = "OTP Verification for Updating Password"
    send_email(user.email, subject, html)


@blueprint.route('/forgotPassword', methods=['POST'])
def forgotPassword():
    if current_user.is_authenticated:
        return redirect(url_for('home.index'))
    
    forgotPasswordForm = ForgotPasswordForm()
    loginForm = LoginForm()
    registrationForm = RegistrationForm()

    if forgotPasswordForm.validate_on_submit():
        user = User.query.filter_by(username=forgotPasswordForm.username.data, email=forgotPasswordForm.email.data).first()
        if not user.confirmed:
            flash(_('Your Account is not Validated! Please confirm your email'))
            return redirect(url_for('frontpage.index'))
        else:
            generateOTP(user)
            return render_template('frontpage/main.html',
                loginForm = loginForm,
                registrationForm = registrationForm,
                forgotPasswordForm = forgotPasswordForm,
                otpShow = 1,
                email = forgotPasswordForm.email.data)

    errors = "forgotPasswordErrors"
    return render_template('frontpage/main.html',
        loginForm = loginForm,
        registrationForm = registrationForm,
        forgotPasswordForm = forgotPasswordForm,
        otpShow = 0,
        errors = errors,)

@blueprint.route('/verifyOTP', methods=['GET', 'POST'])
def verifyOTP():
    
    token = request.args.get('otp', None)
    email = request.args.get('email', None)
    
    user  = User.query.filter_by(email=email).first()
    is_valid = otp.valid_hotp(token=token, secret=user.secKey)
    
    response = {}
    if(not is_valid):
        response['success'] = False
    else:
        response['success'] = True
    return jsonify(response)

@blueprint.route('/confirm/<token>')
def confirm_email(token):
    try:
        email = confirm_token(token)
    except:
        flash('The confirmation link is invalid or has expired.', 'danger')
        return redirect(url_for('frontpage.index'))
    
    user = User.query.filter_by(email=email).first()
    if not email or user is None or email is None:
        flash('The confirmation link is invalid or has expired.', 'danger')
        return redirect(url_for('frontpage.index'))
    if user.confirmed:
        flash('Account already confirmed. Please login to continue.', 'success')
    else:
        user.confirmed = True
        user.confirmedOn = datetime.datetime.now()
        db.session.add(user)
        db.session.commit()
        flash('You have confirmed your account. Thanks!  Please Login to continue.', 'success')
    return redirect(url_for('frontpage.index'))

@blueprint.route('/updatePassword', methods=['GET', 'POST'])
def updatePassword():
    if current_user.is_authenticated:
        return redirect(url_for('home.index'))

    email = request.args.get('email', None)
    passwd = request.args.get('passwd', None)
    confirm_passwd = request.args.get('confirm_passwd', None)

    response = {}
    
    if passwd != confirm_passwd:
        response['success'] = False
        return jsonify(response)
    
    user = User.query.filter_by(email=email).first()
    hashedPassword = bcrypt.generate_password_hash(passwd).decode('utf-8')
    user.password = hashedPassword
    db.session.commit()
    
    response['success'] = True
    return jsonify(response)
