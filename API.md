# AutoBlog API Documentation

This API provides endpoints for generating blog posts based on a given URL. It supports both short and long-form blog posts in English and Korean.

## Base URL

The base URL for all API endpoints is: `https://autoblog.miniecho.com`, or your own URL if you choose to host this yourself.

## Authentication

Authentication is handled via a cookie named `OPENAI_KEY`. This cookie should contain a valid OpenAI API key.

## Endpoints

### 1. Generate Short Blog Post

Generates a short-form blog post based on the content of a given URL.

- **URL:** `/short`
- **Method:** `GET`
- **URL Params:** 
  - Required: `url=[string]`

#### Success Response

- **Code:** 200
- **Content:** HTML content of the generated blog post

#### Error Response

- **Code:** 400 BAD REQUEST
  - **Content:** `{ error : "URL parameter is required" }`

OR

- **Code:** 200
  - **Content:** `<h1>You don't have an API key in your cookie!</h1>`

OR

- **Code:** 500 INTERNAL SERVER ERROR
  - **Content:** `{ error : "Internal server error" }`

### 2. Generate Long Blog Post

Generates a long-form blog post based on the content of a given URL.

- **URL:** `/long`
- **Method:** `GET`
- **URL Params:** 
  - Required: `url=[string]`

#### Success Response

- **Code:** 200
- **Content:** HTML content of the generated blog post

#### Error Response

- **Code:** 400 BAD REQUEST
  - **Content:** `{ error : "URL parameter is required" }`

OR

- **Code:** 200
  - **Content:** `<h1>You don't have an API key in your cookie!</h1>`

OR

- **Code:** 500 INTERNAL SERVER ERROR
  - **Content:** `{ error : "Internal server error" }`

### 3. Generate Short Blog Post in Korean

Generates a short-form blog post in Korean based on the content of a given URL.

- **URL:** `/short_ko`
- **Method:** `GET`
- **URL Params:** 
  - Required: `url=[string]`

#### Success Response

- **Code:** 200
- **Content:** HTML content of the generated blog post in Korean

#### Error Response

- **Code:** 400 BAD REQUEST
  - **Content:** `{ error : "URL parameter is required" }`

OR

- **Code:** 200
  - **Content:** `<h1>You don't have an API key in your cookie!</h1>`

OR

- **Code:** 500 INTERNAL SERVER ERROR
  - **Content:** `{ error : "Internal server error" }`

### 4. Generate Long Blog Post in Korean

Generates a long-form blog post in Korean based on the content of a given URL.

- **URL:** `/long_ko`
- **Method:** `GET`
- **URL Params:** 
  - Required: `url=[string]`

#### Success Response

- **Code:** 200
- **Content:** HTML content of the generated blog post in Korean

#### Error Response

- **Code:** 400 BAD REQUEST
  - **Content:** `{ error : "URL parameter is required" }`

OR

- **Code:** 200
  - **Content:** `<h1>You don't have an API key in your cookie!</h1>`

OR

- **Code:** 500 INTERNAL SERVER ERROR
  - **Content:** `{ error : "Internal server error" }`

## Notes

- All endpoints require a valid OpenAI API key to be present in the `OPENAI_KEY` cookie.
- The API uses the OpenAI GPT-3.5 Turbo model for content generation.
- Generated content is returned as HTML, processed through the `marked` library for Markdown rendering.
- The API scrapes the content of the provided URL using the `textract` library.
- Error handling is implemented for various scenarios, including missing URL parameters, missing API keys, and internal server errors.
