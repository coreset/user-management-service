
to build docker image   
```bash   
$ docker build -t user-management-service . 
```
to start docker container    
```bash   
$ docker run -d --name user-management-service -p 3000:3000 user-management-service
```

## For Development   

to run nestjs application   
```bash 
$ yarn start:dev
```

This application inclided following 4 modules  
1. auth module  
2. clients module  
3. roles module   
4. users module  

### auth module  
* auth/strategies/local.strategy.ts  for handle create user with username and password   
* auth/strategies/jwt.strategy.ts  for handle jwt token (validate token, user role)  
* auth/strategies/refresh.strategy.ts for handle refresh token (validate refresh token)   
* auth/strategies/google.strategy.ts for handle google auth20  

