FROM ubuntu:20.04

EXPOSE 3000

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Phoenix

# Install Utilities
RUN apt-get update -q  \
    && apt-get install -yqq \
        curl \
        nano \
        supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install NodeJs
RUN curl -sL https://deb.nodesource.com/setup_15.x | bash - \
    && apt-get install -yq nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install and copy Nginx
# Set timezone:
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && apt-get -y update \
    && apt-get install -y nginx \
    && apt-get clean -y
COPY default /etc/nginx/sites-available/

# Copy supervisord conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy start script
COPY start.sh /

# Node deployment steps
RUN mkdir -p /usr/src/app/public
WORKDIR /usr/src/app
COPY ./server/package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY ./server/. /usr/src/app/
COPY ./client/build/. /usr/src/app/public/

# start.sh contains the startup commands for nodejs and nginx
CMD [ "/bin/sh", "/start.sh" ]