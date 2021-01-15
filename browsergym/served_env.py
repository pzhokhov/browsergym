from abc import ABC

class ServedEnv(ABC):
    def __init__(self, env):
        self.env = env
        self._last_ob = self.process_observation(env.reset())
        self._last_rew = 0
        self._last_done = False
        self._last_info = {}
        self._in_step = False

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
        
    def observe(self):
        return self._last_ob

    def process_observation(self, ob):
        raise NotImplementedError

    def process_action(self, ac):
        raise NotImplementedError
   
