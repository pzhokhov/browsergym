import cv2
import gym
import flask
from io import BytesIO

KEY_MAPPING = {
    "attack": 0,
    "use": 2,
    "forward": "KeyW",
    "back": "KeyS",
    "left": "KeyA",
    "right": "KeyD",
    "drop": "KeyQ",
    "inventory": "KeyE",
    "jump": "Space",
    "sneak": "LeftShift",
    "sprint": "ControlLeft",
} 

KEY_MAPPING.update({f"hotbar.{i}": "Digit{i}" for i in range(1, 10)})


class FlaskWrapper(gym.Wrapper):
    def __init__(self, env):
        # TODO add configurable schema
        super().__init__(env)
        self._last_ob = self._process_ob(env.reset())
        self._last_rew = 0
        self._last_done = False
        self._last_info = {}
        self._in_step = False

    def step(self, action_json):
        if not self._in_step:
            self._in_step = True
            processed_ac = self.process_action(action_json)
            ob, self._last_rew, self._last_done, self._last_info = self.env.step(processed_ac)
            self._last_ob = self._process_ob(ob)
            if self._last_done:
                #TODO make this async
                self._last_ob = self._process_ob(self.env.reset())
            self._in_step = False
        return self._last_ob
        
        
    def observe(self):
        return self._last_ob

    def _process_ob(self, ob):
        ok, data = cv2.imencode('.png', cv2.cvtColor(ob['pov'], cv2.COLOR_BGR2RGB))
        # TODO also add BGR -> RGB or similar conversion
        if not ok:
            raise ValueError("Conversion of image failed!")
        return data

    def process_action(self, ac):
        print(ac)
        action = {k: int(v in ac['keys'] + ac['mouseButtons']) for k, v in KEY_MAPPING.items()}
        action["camera"] = [ac["mouseDy"], ac["mouseDx"]]
        return action

def make_env():
    env = gym.make('minerl:MineRLHumanSurvival-v0')
    env = FlaskWrapper(env)
    return env
    
