FROM ${docker.share.image}:${docker.share.version}

ARG TOMCAT_DIR=/usr/local/tomcat

COPY share-config-custom.xml $TOMCAT_DIR/shared/classes/alfresco/web-extension

COPY log4j.properties $TOMCAT_DIR/webapps/share/WEB-INF/classes
