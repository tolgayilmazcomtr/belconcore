FROM php:8.4-fpm-alpine

# Use custom built bash for debugging
RUN apk add --no-cache bash busybox-suid shadow

RUN apk update && apk add --no-cache \
    postgresql-dev \
    libpq \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    libzip-dev \
    unzip \
    git \
    supervisor \
    nginx

# Core extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql pgsql gd zip bcmath pcntl

# Install Redis
RUN apk add --no-cache pcre-dev $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html

COPY . .

# Environment
ENV DO_NOT_RUN_COMPOSER=0
ENV SKIP_CHOWN=0

RUN composer install --no-interaction --optimize-autoloader --no-dev

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# PHP-FPM Configuration
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000
