#!/bin/bash

# Starting Node
nohup node index.js &

#Starting Nginx
/usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf