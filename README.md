# Woo Rest Headless SDK

A lightweight, type-safe, and production-ready TypeScript SDK for building headless WooCommerce and WordPress applications. Designed for Next.js and modern JS frameworks.

## Features

- 🚀 **Zero Dependencies** (uses native `fetch`)
- 📘 **TypeScript Ready** (typed request/responses)
- 🔐 **Authentication Helpers** (JWT, Basic Auth, Cookies)
- 🛒 **WooCommerce V3 Support** (Products, Orders, Customers)
- 📦 **Shipping & Checkout** Integration
- ⚡ **Next.js Friendly** (includes caching tags headers support)

## Installation

```bash
npm install woo-rest-headless
# or
yarn add woo-rest-headless
# or
pnpm add woo-rest-headless
```

## Usage

### Initialization

```typescript
import { WooHeadless } from 'woo-rest-headless';

const client = new WooHeadless({
  url: 'https://your-wordpress-site.com',
  consumerKey: process.env.WOO_CONSUMER_KEY, // Optional
  consumerSecret: process.env.WOO_CONSUMER_SECRET, // Optional
  debug: false,
});
```

### Authentication (JWT / Custom WRH)

```typescript
// Login
const auth = await client.auth.login({
  username: 'john.doe',
  password: 'secretpassword',
});

// The token is automatically set for subsequent requests
console.log(client.getToken());
```

### Fetching Data

```typescript
// Get products (example)
const products = await client.request('GET', '/wp-json/wc/v3/products');

// Get shipping zones
const zones = await client.shipping.zones();
```

### Next.js Caching Support

The client automatically supports Next.js `fetch` options like `revalidate` and `tags`.

```typescript
// Custom revalidation
await client.request('GET', '/endpoint', null, {
  next: { revalidate: 60 },
});
```

## API Reference

The client is organized into modules:

- `client.auth` - Login, Register, OTP
- `client.profile` - User profile and orders
- `client.checkout` - Order creation, updates
- `client.shipping` - Zones, methods, calculations
- `client.content` - Menus, banners, brands, reviews
- `client.admin` - Admin specific layouts and settings
- `client.universal` - Generic actions and meta handling

## License

MIT
