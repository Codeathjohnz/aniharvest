#!/bin/sh
set -e
# uploads live on a volume: make sure Apache can write to it
mkdir -p /var/www/html/api/uploads
chown -R www-data:www-data /var/www/html/api/uploads
# create tables on first start, apply the admin password
php /var/www/setup/init-db.php
exec docker-php-entrypoint "$@"
