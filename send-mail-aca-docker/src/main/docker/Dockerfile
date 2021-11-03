#######################
# 1. Build Node Project
FROM ${docker.node.image}:${docker.node.version} AS builder

ARG PRIVATE_TOKEN
ARG GITLAB_API
ENV SRC_PRISTY="/usr/src/pristy-${pristy.version}"
ENV ACA_COLLAB_VERSION="0.5.0-dist"

# Récupération des sources de Pristy
RUN apk add curl \
  && mkdir -p /usr/src \
  && curl -sSL --header "PRIVATE-TOKEN: ${PRIVATE_TOKEN}" "${GITLAB_API}/projects/375/repository/archive.zip?sha=${pristy.version}" \
     -o "pristy-${pristy.version}.zip" \
  && unzip "pristy-${pristy.version}.zip" -d /usr/src \
  && mv /usr/src/pristy-front-${pristy.version}-${pristy.commit.tag} ${SRC_PRISTY} \
  && rm pristy-${pristy.version}.zip

WORKDIR ${SRC_PRISTY}
COPY extensions/* ${SRC_PRISTY}

# Récupération du module alfresco-collabora-online
RUN curl -sSL --header "PRIVATE-TOKEN: ${PRIVATE_TOKEN}" -o /tmp/gitlab_helper.sh "${GITLAB_API}/projects/391/repository/files/gitlab_helper.sh/raw?ref=master" \
    && source /tmp/gitlab_helper.sh \
    && downloadMavenArtifact 342 fr.jeci.alfresco collabora-aca-extension ${ACA_COLLAB_VERSION} tgz

RUN npm install ajv path stream
RUN npm install
RUN npm run ng add collabora-aca-extension-${ACA_COLLAB_VERSION}.tgz
RUN npm install -g @ngstack/install && \
    ngi ${SRC_PRISTY}/send-mail-aca-${project.version}-dist.tgz @jeci/send-mail

RUN sed -i '/collabora-online/ s/$/, "send-mail.plugin.json"/' ${SRC_PRISTY}/src/assets/app.extensions.json && \
    sed -i '/"build"/ s/ -- --prod//' ${SRC_PRISTY}/package.json
RUN npm run build.dev

#######################
# 2. Build nginx image
FROM ${docker.nginx.image}:${docker.nginx.version}
LABEL version="${pristy.version}"
LABEL maintainer="Jeci <info@jeci.fr>"
ENV SRC_PRISTY="/usr/src/pristy-${pristy.version}"

ARG PROJECT_NAME="app"

ARG GROUPNAME=Alfresco
ARG GROUPID=1000
ARG USERNAME=aca
ARG USERID=33009

COPY --from=builder ${SRC_PRISTY}/docker/default.conf.template /etc/nginx/templates/
COPY --from=builder ${SRC_PRISTY}/docker/docker-entrypoint.d/* /docker-entrypoint.d/
COPY --from=builder ${SRC_PRISTY}/dist/$PROJECT_NAME /usr/share/nginx/html/
COPY --from=builder ${SRC_PRISTY}/dist/$PROJECT_NAME/app.config.json /etc/nginx/templates/app.config.json.template
COPY --from=builder ${SRC_PRISTY}/dist/$PROJECT_NAME/assets/app.extensions.json /etc/nginx/templates/app.extensions.json.template
COPY nginx.conf cors_support.conf proxy_pass.conf /etc/nginx/

USER root
RUN addgroup -g ${GROUPID} ${GROUPNAME} \
  && adduser -S -u ${USERID} -G ${GROUPNAME} -s "/bin/bash" ${USERNAME} \
  && chown -R ${USERNAME}:${GROUPNAME} /usr/share/nginx/html \
  && chown -R ${USERNAME}:${GROUPNAME} /var/cache/nginx \
  && touch /var/run/nginx.pid \
  && chown -R ${USERNAME}:${GROUPNAME} /var/run/nginx.pid \
  && chmod a+w -R /etc/nginx/conf.d

EXPOSE 8080
USER ${USERNAME}

ENV BASE_PATH=/
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
