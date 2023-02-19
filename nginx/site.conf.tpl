server {
    listen 80;
    server_name ${domain} www.${domain};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot/${domain};
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${domain} www.${domain};

    ssl_certificate /etc/nginx/sites/ssl/dummy/${domain}/fullchain.pem;
    ssl_certificate_key /etc/nginx/sites/ssl/dummy/${domain}/privkey.pem;

    include /etc/nginx/includes/options-ssl-nginx.conf;

    ssl_dhparam /etc/nginx/sites/ssl/ssl-dhparams.pem;

    include /etc/nginx/includes/hsts.conf;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
    }

    location /api {
      resolver 127.0.0.11;
      proxy_pass http://backend:8080/$request_uri;
    }
}
