import time
import flask
import requests
from threading import Thread

app = flask.Flask(__name__)

statuses = {}


def check_worker(url):
    try:
        response = requests.get(url + "/status", timeout=1.0)
        if response.ok:
            statuses[url] = ("ok", float(response.text))
            return
    except requests.exceptions.ConnectionError:
        pass
    statuses[url] = ("fail", None)
    

def check_workers_loop():
    while True:
        for wurl in statuses.keys():
            check_worker(wurl)
        time.sleep(1) 

def choose_worker():
    ok_workers = [(u, t) for  u, (s, t) in statuses.items() if s == 'ok']
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

def main(urls):
    for url in urls:
        register_worker(url)
    Thread(target=check_workers_loop).start()
    app.run(host='0.0.0.0', port=80)

if __name__ == '__main__':
    main(['http://192.168.8.92:5000'])

