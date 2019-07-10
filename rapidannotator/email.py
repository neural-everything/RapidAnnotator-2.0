from flask_mail import Message
from rapidannotator import app, mail


def send_email(to, subject, template):
    msg = Message(
        subject,
        recipients=[to],
        html=template,
        sender= app.config['MAIL_DEFAULT_SENDER']
    )
    mail.send(msg)
    print("Yo Message is sent!")