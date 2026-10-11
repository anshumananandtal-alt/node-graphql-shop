# Node GraphQL Shop

A Node.js e-commerce application that was converted from a traditional REST-style API to a GraphQL API. The project uses Express, MongoDB/Mongoose, and GraphQL to power a lightweight online shop with product management, authentication, cart handling, and order processing.

## Features

- GraphQL API at `/graphql` with GraphiQL enabled
- User signup, login, logout, and password reset flows
- Product listing and product detail queries
- Product creation, editing, and deletion
- Cart management
- Order creation and retrieval
- Session-based authentication
- Image upload support for product assets
- MongoDB persistence with Mongoose

## Tech Stack

- Node.js
- Express.js
- GraphQL (`express-graphql` and `graphql`)
- MongoDB + Mongoose
- EJS templates
- JWT-style authentication token handling for GraphQL mutations
- Multer for file upload support

## Project Structure

```text
.
├── app.js
├── controllers/
├── data/
├── graphql/
│   ├── resolver/
│   ├── schema/
│   └── query.md
├── models/
├── public/
├── routes/
├── util/
├── views/
├── .env
├── package.json
└── README.md
```

## Prerequisites

- Node.js 16+ recommended
- MongoDB Atlas or a local MongoDB instance
- npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd convert-the-api-to-graphql
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with your MongoDB configuration:

```env
MONGO_USERNAME=your_mongodb_username
MONGO_PASSWORD=your_mongodb_password
DEFAULT_DATABASE=your_database_name
```

The project reads these values in `app.js` when establishing the MongoDB connection.

## Running the App

Start the app in development mode:

```bash
npm run start:dev
```

Or use the standard server start command:

```bash
npm start
```

The application listens on:

```text
http://localhost:3000
```

The GraphQL playground is available at:

```text
http://localhost:3000/graphql
```

## GraphQL Examples

A few sample operations are included in `graphql/query.md`.

### Get all products

```graphql
query {
  products {
    _id
    title
    imageUrl
    description
    price
  }
}
```

### Get a single product

```graphql
query {
  product(_id: "some-product-id") {
    _id
    title
    description
    price
    imageUrl
  }
}
```

### Login

```graphql
mutation {
  postLogin(email: "user@example.com", password: "your-password") {
    token
    userId
  }
}
```

### Add product

```graphql
mutation {
  addProduct(userInput: {
    title: "Amla Candy Two"
    description: "A sweet fruit"
    price: 42.2
    imageUrl: "images/demo_image.jpg"
  }) {
    message
    product {
      _id
      title
      imageUrl
      description
      price
    }
  }
}
```

### Get cart

```graphql
query {
  carts {
    items {
      productId {
        _id
        title
        description
        price
      }
      quantity
    }
  }
}
```

## Available Functional Areas

The GraphQL schema covers areas such as:

- Authentication
- Products
- Cart
- Orders
- Password reset and recovery

## Scripts

```bash
npm test
npm start
npm run start:dev
```

## License

This project is licensed under the ISC License.
