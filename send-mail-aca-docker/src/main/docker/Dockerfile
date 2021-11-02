#######################
# 1. Build Node Project
FROM ${docker.node.image}:${docker.node.version} AS builder

ARG TOKEN_API
ARG GITLAB_API
ENV SRC_PRISTY="/usr/src/pristy-${pristy.version}"

# Récupération des sources
RUN echo "TOJEN_API : ${TOKEN_API}" \
  && curl -sSLk --header "PRIVATE-TOKEN: ${TOKEN_API}" "${GITLAB_API}/projects/375/repository/archive.zip?sha=${pristy.version}" \
     -o "pristy-${pristy.version}.zip" \
  && unzip "pristy-${pristy.version}.zip" -d /usr/src \
  && mv /usr/src/bendoc-front-${pristy.version}-${pristy.commit.tag} ${SRC_PRISTY} \
  && rm pristy-${pristy.version}.zip

WORKDIR ${SRC_PRISTY}
COPY extensions/* /usr/src/

RUN npm install ajv path stream
RUN npm install
RUN npm install -g @ngstack/install && \
    ngi /usr/src/send-mail-aca-${project.version}-dist.tgz @jeci/send-mail

RUN sed -i '/references/ s/^.*$/"$references": ["collabora-online.plugin.json", "send-mail.plugin.json"],/' ${SRC_PRISTY}/src/assets/app.extensions.json && \
    sed -i '/"build"/ s/ -- --prod//' ${SRC_PRISTY}/package.json
RUN npm run build.dev

#######################
# 2. Build nginx image
FROM ${docker.nginx.image}:${docker.nginx.version}
LABEL version="${pristy.version}"
LABEL maintainer="Jeci <info@jeci.fr>"
ENV SRC_PRISTY="/usr/src/pristy-${pristy.version}"

ARG GROUPNAME=Alfresco
ARG GROUPID=1000
ARG USERNAME=aca
ARG USERID=33009

WORKDIR /usr/share/nginx/html
COPY --from=builder ${SRC_PRISTY}/dist/app/ .
COPY --from=builder ${SRC_PRISTY}/docker/entrypoint.sh /
COPY nginx.conf cors_support.conf proxy_pass.conf /etc/nginx/

RUN addgroup -g ${GROUPID} ${GROUPNAME} && \
    adduser -S -u ${USERID} -G ${GROUPNAME} -s "/bin/bash" ${USERNAME} && \
    chown -R ${USERNAME}:${GROUPNAME} /usr/share/nginx/html && \
    chown -R ${USERNAME}:${GROUPNAME} /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R ${USERNAME}:${GROUPNAME} /var/run/nginx.pid && \
    chmod +x /entrypoint.sh && \
    chown -R ${USERNAME}:${GROUPNAME} /entrypoint.sh

EXPOSE 8080
USER ${USERNAME}
ENTRYPOINT [ "sh", "/entrypoint.sh" ]
