# ARK Development environment Docker files/preset

> Assuming you have Docker Compose and Docker Engine installed ..

## Use case 1 - run PostgreSQL and Redis Docker containers, use NodeJS from your local environment.

> NOTE: Redis and PostgreSQL ports are mapped to your `localhost`, so you should not have Redis or PostgreSQL installed locally.

```sh
cd docker/$NETWORK (NETWORK = testnet || devnet)
```
```sh
docker-compose up -d postgres redis
```

Need to start with clean DBs:

```sh
docker-compose down
docker-compose up -d postgres redis
```

## Use case 2 - run PostgreSQL and Redis Docker containers, build and run ARK-Core container.

> NOTE: Along with PostgreSQL and Redis containers, now you have also NodeJS container which mounts your local ark-core git folder inside the container and runs all npm prerequisites install.  

```sh
cd docker/$NETWORK (NETWORK = testnet || devnet)
```
```sh
docker-compose up -d 
```

You can now enter your `ark-core` container and use nodejs in a Docker container (Linux environment). 

```sh
docker exec -it ark-core bash
```

Need to start everything from scratch and make sure there aren't any cached containers, images or volumes left, just use `purge_all.sh` script.

### Once again the current files/preset are not Production ready. Official Production ARK-Core Docker images will be released soon after ARK-Core v2 goes live.  
