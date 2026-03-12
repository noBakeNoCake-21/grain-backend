Grain Backend Application 


REST APIs for Grain. All the routes a user might hit while traversing Grain. Grain Backend has it's own Authentication method for logged in users.  

JWT authentication methods used. 

Connection to clould flare R2 bucket storage for images via CloudFlare API
Connection to clouldflare Stream to store and stream movies via CloudFlare API. 

Database sechema  



Critical Things needed to add/Take Care of 
- Move S3 clouldflare creds S3 and object command from @aws-sdk/client-s3 need to be moved to its own module 
and exported out. 
- Create Controller folder and move all controllers to their own respective modules.  
- Deleting the Movies and Images from cloudlfare using cloudflare APIs