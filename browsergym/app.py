import quart
from io import BytesIO
import base64
import logging
import time
from .served_minerl import make_env
import asyncio
import json

logging.basicConfig(level=logging.DEBUG)
app = quart.Quart(__name__)
last_step_timestamp = 0

@app.route('/')
async def index():
    return await quart.render_template('index.html')

@app.route('/status')
async def status():
    return str(last_step_timestamp)

@app.websocket("/ws")
async def step_ws():
    try:
        while True:
            action_str = await quart.websocket.receive()
            print(action_str)
            # data = "blabla" + step_json # app.gymenv.step(action)
            # await quart.websocket.send(data)
            app.gymenv.step_async(json.loads(action_str))
            data = app.gymenv.observe()
            await quart.websocket.send(base64.b64encode(data.tobytes()))
    except asyncio.CancelledError as e:
        print(e)

def main():
    # print("Starting minecraft")
    env = make_env()
    app.gymenv = env
    app.run(debug=False, host="0.0.0.0", port=5000)

if __name__ == '__main__':
    main()

