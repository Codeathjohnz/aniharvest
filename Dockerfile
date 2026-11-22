# ---------- Stage 1: build the React site ----------
FROM node:20-alpine AS web
WORKDIR /app
COPY client/package.json client/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY client/ ./
# the site calls the API on the same domain: https://your-domain/api
ENV VITE_API_URL=/api
RUN npm run build

# ---------- Stage 2: Apache + PHP serving the site and the API ----------
FROM php:8.2-apache
RUN docker-php-ext-install pdo_mysql \
 && a2enmod headers \
 && { echo 'upload_max_filesize=4M'; echo 'post_max_size=6M'; echo 'expose_php=Off'; } > /usr/local/etc/php/conf.d/aniharvest.ini

# React build at /, PHP API at /api
COPY --from=web /app/dist/ /var/www/html/
COPY api/ /var/www/html/api/

# Setup-only files live OUTSIDE the web root, then are removed from it,
# so nobody on the internet can reset the database or read the SQL.
RUN mkdir -p /var/www/setup \
 && cp /var/www/html/api/database.sql /var/www/html/api/seed_more_users.sql \
       /var/www/html/api/seed_sample_orders.php /var/www/html/api/config.php /var/www/setup/ \
 && rm -f /var/www/html/api/install.php /var/www/html/api/seed_sample_orders.php /var/www/html/api/*.sql \
 && mkdir -p /var/www/html/api/uploads \
 && chown -R www-data:www-data /var/www/html/api/uploads

COPY docker/apache-security.conf /etc/apache2/conf-enabled/aniharvest-security.conf
COPY docker/init-db.php /var/www/setup/init-db.php
COPY docker/entrypoint.sh /usr/local/bin/aniharvest-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/aniharvest-entrypoint && chmod +x /usr/local/bin/aniharvest-entrypoint

EXPOSE 80
ENTRYPOINT ["aniharvest-entrypoint"]
CMD ["apache2-foreground"]
