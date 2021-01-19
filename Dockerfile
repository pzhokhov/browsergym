FROM continuumio/anaconda3:latest
# TODO pin commits
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb xorg ffmpeg  && conda install -y openjdk && pip install git+https://github.com/minerllabs/minerl.git@peterz/human_recorder
COPY . /root/browsergym
RUN pip install -e /root/browsergym

CMD python -m browsergym.app
