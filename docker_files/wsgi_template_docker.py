''' Delete the lines 2, 3 and 4 if you are not using virtualenv else uncomment it'''
# activate_this = '[Path_to_virtual_environment]/bin/activate_this.py'
# with open(activate_this) as file_:
#    exec(file_.read(), dict(__file__=activate_this))

import sys
sys.path.insert(0, '/var/www/rapidannotator')

from rapidannotator import app as application
