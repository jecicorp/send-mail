# Send Mail

## Description

Ajout d'une action d'envoi de mail dans l'interface angular pour envoyer par mail :
*  un document
* le lien de partage d'un document

## Test

* Ajouter dans `.envrc`

```
export PRIVATE_TOKEN=<your token that access the api>
export GITLAB_API="https://gitlab.beezim.fr/api/v4"
```

* Build and run

```
mvn clean package
mvn resources:resources
pip install docker-compose
docker-compose -f ./target/classes/docker-compose.yml up --build -d
```

## Installation

### ACS

Ajout du module `send-mail-platform-xxx.amp`.

### ACA

* Ajout du module grâce à la commande `ngi` lors du build de l'application ACA :

```
npm install -g @ngstack/install
ngi send-mail-aca-xxx-dist.tgz @jeci/send-mail
```

* Modifier le fichier `app.extensions.json` pour ajouter le fichier json de la librarie dans la liste des références :

```
...
  "$references": [
    ...,
    send-mail.plugin.json
  ]
...
```
