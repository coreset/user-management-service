to build docker image   
```bash   
$ docker build -t user-management-service . 
```
to start docker container    
```bash   
$ docker run -d --name user-management-service -p 3000:3000 user-management-service
```



