```SHELL
#### To install Flask-Migrate  
pip install -r requirements.txt 
#### Initalize the flask-migrate files.
flask db init  
#### Make a migration, it is like commit it and a comment beside.
flask db migrate -m "Initial migration." # OR just add your comment right there  
#### Then apply your migration to the database, it is like push.
flask db upgrade  
```
