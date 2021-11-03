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
mvn resources:resources
pip install docker-compose
docker-compose -f ./target/classes/docker-compose.yml up --build -d
```
