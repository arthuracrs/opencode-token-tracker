FROM liquibase/liquibase:4.29-alpine

# Changelogs are mounted from the project directory via docker-compose volume.
# To run standalone without compose:
#   docker run -v $PWD/changelog:/liquibase/changelog liquibase/liquibase \
#     --changeLogFile=db.changelog-master.yaml update

CMD ["update"]
