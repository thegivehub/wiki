## Authentication

The Give Hub uses JWT-based authentication. All API requests must include an Authorization header with a valid access token.

```javascript
// Authenticate user
async function login(email, password) {
    try {
        const response = await app.client.auth.login(email, password);
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        return response.user;
    } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
    }
}
```


