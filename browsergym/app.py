import flask
from io import BytesIO
import base64
import logging
from .served_minerl import make_env

logging.basicConfig(level=logging.DEBUG)
app = flask.Flask(__name__)

@app.route('/')
def hello_world():
    return flask.render_template('index.html')

@app.route('/step', methods=['POST'])
def step():
    action = flask.request.json
    data = app.env.step(action)
    return base64.b64encode(data.tobytes())

if __name__ == '__main__':
    app.env = make_env()
    app.run(debug=False)

