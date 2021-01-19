import time
import flask
import requests
from threading import Thread

app = flask.Flask(__name__)

statuses = {}


def check_worker(url):
    timestamp = requests.get(url + "/status", timeout=1.0)
    last_status = statuses[url]
    if timestamp != None:
        statuses[url] = ("ok", int(timestamp))
    else:
        statuses[url] = ("fail", None)


def check_workers_loop():
    for wurl in statuses.keys():
        check_worker(wurl)
    time.sleep(1) 


def choose_worker():
    ok_workers = [(u, s[1]) for  u, s in statuses.items() if s[0] == 'ok')
    if len(ok_workers) < 1:
        raise ValueError("No valid workers!")
    ok_workers.sort(key=lambda x: x[1])
    return ok_workers[0][0]


def register_worker(url):
    statuses[url] = ("ok", 0)
    

@app.route('/')
def index():
    url = choose_worker()
    return flask.redirect(url)

if __name__ == '__main__':
    Thread(target=check_workers_loop).start()
    app.run()
