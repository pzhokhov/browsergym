from abc import ABC
from collections import deque
from threading import Thread

class ServedEnv(ABC):
    def __init__(self, env):
        self.env = env
        self._last_ob = self.process_observation(env.reset())
        self._last_rew = 0
        self._last_done = False
        self._last_info = {}
        self._in_step = False
        # self._ac_q = deque()
        # self._thread = Thread(target=self._step_loop)
        # self._thread.start()
        

    # def step_async(self, action_json):
    #     self._ac_q.append(action_json)

    def step(self, action_json):
        if not self._in_step:
            self._in_step = True
            processed_ac = self.process_action(action_json)
            ob, self._last_rew, self._last_done, self._last_info = self.env.step(processed_ac)
            self._last_ob = self.process_observation(ob)
            if self._last_done:
                self._last_ob = self.process_observation(self.env.reset())
            self._in_step = False
        return self._last_ob

    def _step_loop(self):
        while True:
            if len(self._ac_q) > 0:
                self.step(self._ac_q.popleft())
        

    
        
    def observe(self):
        return self._last_ob

    def process_observation(self, ob):
        raise NotImplementedError

    def process_action(self, ac):
        raise NotImplementedError
   
