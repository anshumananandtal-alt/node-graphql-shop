
# Post Reset Password
#mutation { postResetPassword(email: "gibatat295@comzx.com"){ status message}}

# Get User on token
#query { user(token :"d0d8a768925587d66dd53b4450a0f18af788ff737f685ce20032120e8987ce7e"){ _id name email role } }

# Post New Password
#mutation { postNewPassword(password: "Test@1234" token: "5984ebde17f88e179ab8f3a1c5d7736315d7ce7d39e84e8bfbbf517a96704d4d"){ message status}}

# Post login 
#mutation{ postLogin(email: "anshuman.anand.tal@gmail.com" password: "Anshuman15"){ token userId role}}

# Post Signup
#mutation { postSignup(name: "Test user" email: "gibatat295@comzx.com" password: "Test@123" confirmPassword: "Test@123"){ token userId}}

# Post Logout 
#mutation { postLogout(token: "zhLq2bM-GKGqAMn-QkeEeekxJ7OvFRpp") { message status}}

# Delete Cart
#mutation { deleteCart(productId: "6ab3e3a2906ac019213f292b") { message status}}

# Get checkout 
#query { checkout{ items { productId{ _id title description imageUrl price } quantity} sessionId url}}

# Get Cart
#query { carts {  items { productId { _id title description price} quantity } }}

# add to Cart
#mutation { addToCart(productId: "6ab3e42c906ac019213f2990"){ message status}}

# Get product detail
#query { product(_id: "6ab3e3a2906ac019213f292b"){ _id title imageUrl description price userId { _id name}}}


# Get products
#query { products(page: 2) { _id title imageUrl description price userId{ _id name}}}

# Add product 
#mutation { addProduct(userInput: { title: "Amla Candy Two" description: "A sweet fruit" price: 42.2 imageUrl: "images/6f9d64f2-ac35-4c41-ae07-dc22958e1559-demo_stawberry.jpg"}){ message product { _id title imageUrl description price}}}

# Edit Product
#mutation { editProduct(prodId: "6ac60638effdf65a8c0ede4f" userInput: { title: "Amla Candy Duplicate" description: "A sweet fruit" imageUrl: "images/6f9d64f2-ac35-4c41-ae07-dc22958e1559-demo_stawberry.jpg", price: 42.2 }){ message product { _id title description imageUrl}}}


# Delete Product
#mutation { deleteProduct(_id: "6ac608ecf628a61db03b693d" ) { message status}}

# Get Order
#query { orders{ message orders { _id products { product { _id title description imageUrl price} quantity} user { userId }} }}

# Post Order
#mutation { postOrder(sessionId: "Ansbdhfh"){ message order { products{ product { _id, title description imageUrl price}} user{ userId name}} }}

# Get from Favourite
#query { favourites { items { _id productId{ _id title description price} }}}

# add to favourite
#mutation { addToFavourite(prodId: "6acb557c06407ac0c452b2c1") { message status productId }}

# Delete from favourite 
#mutation { deleteFavourite(prodId: "6acb557c06407ac0c452b2c1") { message status }}