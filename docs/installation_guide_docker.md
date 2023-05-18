# Rapid Annotator Installation Guide With docker compose

## Clone the repository

```
git clone https://github.com/RedHenLab/RapidAnnotator-2.0.git

```

## Edit config file

Edit the file `docker_files/config_template_docker.py` to configure mail settings and key


## Build and run the container

```
docker-compose build
docker-compose up
```

Connect to http://localhost:8888

> **Warning**
> Use this installation method only for testing pourposes
> It isn't fully secured. No SSL/TLS certificates. 
> Database Access user/password in docker-compose.yaml file

