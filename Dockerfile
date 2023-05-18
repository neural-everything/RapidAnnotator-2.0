## Dockerfile for RapidAnnotator 2.0
## Raúl Sánchez <raul@um.es>

FROM ubuntu:18.04

LABEL maintainer="Raúl Sánchez <raul@um.es>"
LABEL version="0.1"

# Install dependencies
WORKDIR /var/www/rapidannotator

COPY . /var/www/rapidannotator
COPY docker_files/rapidannotator_httpd.conf /etc/apache2/conf-enabled/rapidannotator.conf

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update  && apt-get install -y apache2 python3-pip libapache2-mod-wsgi-py3 default-libmysqlclient-dev vim net-tools default-mysql-client \
                    && pip3 install --upgrade pip && pip3 install numpy && pip3 install -r requirements.txt 
RUN cp docker_files/wsgi_template_docker.py wsgi.py \
    && cp docker_files/config_template_docker.py rapidannotator/config.py && mkdir /videos && chmod 777 /videos && sed -i '1 i\Listen 8000' /etc/apache2/ports.conf


VOLUME [ "/videos" ]

EXPOSE 8000

# Docker start apache2 in foreground
CMD ["apachectl", "-D", "FOREGROUND"]
