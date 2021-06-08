### In case of using the application and made any changes on the database, you will need to run the following commands in order to migrate the new changes in the models schema to the current exisiting database schema.
### In case it is your first time running the application it is an optional.
#### To install Flask-Migrate  
> pip install -r requirements.txt 
#### Initalize the flask-migrate files.
> flask db init  
#### Make a migration, it is like commit it and a comment beside.
> flask db migrate -m "Initial migration." # OR just add your comment right there  
#### Then apply your migration to the database, it is like push.
> flask db upgrade  
