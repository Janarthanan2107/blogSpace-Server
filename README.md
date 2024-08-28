# BlogSpace - Server

This repository contains the backend for **BlogSpace**, a blogging platform where users can create, edit, and interact with blog posts. The backend is built using the **MERN** stack with **Node.js**, **Express.js**, and **MongoDB**. It handles user authentication, blog post management, comments, likes, notifications, and other core features of the application.

## Features

- **User Authentication**: Secure login, registration, and token-based authentication using **JWT** and **bcrypt** for password hashing.
- **Blog Post Management**: Create, read, update, and delete (CRUD) operations for blogs.
- **Comment System**: Users can comment on blogs, reply to comments, and like posts.
- **Real-time Notifications**: Notify users when their blogs receive comments, likes, or replies.
- **Pagination and Filtering**: Support for paginating and filtering blog posts.
- **Google Authentication**: OAuth integration using Google for secure authentication.

## Tech Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose for schema modeling
- **Authentication**: JWT (JSON Web Tokens) and bcrypt for secure password storage
- **API Testing**: Postman for testing RESTful API endpoints
- **Deployment**: Deployed on **Render**

## Installation

To set up and run the server locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/Janarthanan2107/blogSpace-Server.git
   ```
2. Navigate to the project directory:
   ```bash
   cd blogSpace-Server
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```plaintext
   PORT=5000
   DB_LOCATION=mongodb+srv://janarthanan:<Password>@cluster-db.sndm3lz.mongodb.net/<title_of_db_collection>?retryWrites=true&w=majority&appName=Cluster-Db
   SECRET_ACCESS_KEY=<your_secret_access_key> # generate key using: require('crypto').randomBytes(64).toString('hex')
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   The server should now be running on `http://localhost:5000`.

## API Endpoints

### User Authentication

- **POST** `/api/auth/register`: Register a new user.
- **POST** `/api/auth/login`: Login an existing user and receive a JWT.

### Blog Management

- **GET** `/api/blog`: Get all blog posts (with pagination).
- **POST** `/api/blog`: Create a new blog post.
- **GET** `/api/blog/:id`: Get a specific blog post by ID.
- **PUT** `/api/blog/:id`: Update a blog post by ID.
- **DELETE** `/api/blog/:id`: Delete a blog post by ID.

### Comment and Like System

- **POST** `/api/blog/comment/:blogId`: Add a comment to a blog post.
- **POST** `/api/blog/like/:blogId`: Like or unlike a blog post.

### Notifications

- **GET** `/api/blog/notify`: Get all notifications for a user.

## Folder Structure

```plaintext
blogSpace-Server/
├── config/
├── controllers/
├── middleware/
├── routes/
├── schema/
├── .env
├── .gitignore
├── sdk.json
├── server.js
├── package.json
└── README.md
```

- **config/**: Database configuration and connection setup.
- **controllers/**: Contains logic for handling requests and responses.
- **middleware/**: Contains middleware for authentication and error handling.
- **routes/**: Defines routes for authentication, blogs, comments, and notifications.
- **schema/**: MongoDB models for Users, Blogs, Comments, and Notifications.
- **sdk.json**: Google authentication configuration file.
- **server.js**: Entry point for the server.

## Deployment

The server is deployed on Render. Ensure you set the required environment variables in the Render settings.

## Contributing

If you'd like to contribute to this project, feel free to submit a pull request or open an issue for discussion.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
