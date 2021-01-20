import cv2
from minerl.herobraine.env_specs.human_survival_specs import HumanSurvival
from .served_env import ServedEnv

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
    "sneak": "ShiftLeft",
    "sprint": "ControlLeft",
} 

KEY_MAPPING.update({f"hotbar.{i}": f"Digit{i}" for i in range(1, 10)})

class ServedMinerl(ServedEnv):
    def process_observation(self, ob):
        served_resolution = (160, 90)
        data = ob['pov']
        data = cv2.cvtColor(data, cv2.COLOR_BGR2RGB)
        data = cv2.resize(data, served_resolution)
        # ok, data = cv2.imencode('.png', data, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        ok, data = cv2.imencode('.png', data)
        if not ok:
            raise ValueError("Conversion of image failed!")
        return data

    def process_action(self, ac):
        action = {k: int(v in ac['keys'] + ac['mouseButtons']) for k, v in KEY_MAPPING.items()}
        sensitivity = 0.25
        action["camera"] = [sensitivity * ac["mouseDy"], sensitivity * ac["mouseDx"]]
        return action

def make_env():
    env = HumanSurvival(resolution=(320, 180)).make()
    env = ServedMinerl(env)
    return env
 
