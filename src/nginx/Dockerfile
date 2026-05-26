FROM nginxinc/nginx-unprivileged:alpine

# Copie votre configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]