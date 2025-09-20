server {
    listen 80;
    server_name auth.with-jiko.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name auth.with-jiko.com;

    ssl_certificate /etc/letsencrypt/live/auth.with-jiko.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.with-jiko.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}