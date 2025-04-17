# Next Prisma

![NPM Version](https://img.shields.io/npm/v/%40pglabs%2Fnext-prisma)
![NPM Downloads](https://img.shields.io/npm/d18m/%40pglabs%2Fnext-prisma)
![NPM Collaborators](https://img.shields.io/npm/collaborators/%40pglabs%2Fnext-prisma)
![NPM Last Update](https://img.shields.io/npm/last-update/%40pglabs%2Fnext-prisma)

Loving both [Prisma](https://www.prisma.io/) and [Next.js](https://nextjs.org/) but struggling to make them work together? This package is for you!

## Features

- **Automatic Prisma Client Generation**: Automatically generates the Prisma client when you run `next dev`.
- **Automatic Singleton Client Instance**: Ensures that the Prisma client is a singleton instance, preventing multiple connections to the database.
- **Complete Automatic Initialization**: You do not need to worry about initializing the Prisma client. It is done automatically for you, in the folder of your choice.
- **Automatic Studio Start**: Automatically starts Prisma Studio when you run `next dev` in development mode.

## Quick Start

1. Install the package:

```bash
npm install @pglabs/next-prisma
```

2. Update the `next.config.ts` file of your Next.js project:

```typescript
import { withNextPrisma } from "@pglabs/next-prisma";

const nextConfig = {
  // Your Next.js config
};

export default withNextPrisma(nextConfig);
```

3. Run the development server:

```bash
npm run dev
```

> It will automatically init prisma, create a first migration and create the prisma client !

## Configuration

You can configure the package by adding a second argument to the `withNextPrisma` function. The configuration object can contain the following properties:

- `runMigration`: boolean (default: true)

  - If set to `true`, the package will automatically run an initial migration if the migrations folder does'nt exists

- `prismaRoot`: string (default: "prisma")

  - The folder where prisma lives, where the `schema.prisma` will be created and where the migrations and clients will be stored.

- `dbProvider`: string (default: "sqlite")
  - Tell the package which database provider to use. It will be used to create the `schema.prisma` file. The default is `sqlite`, but you can also use `postgresql`, `mysql`,`sqlserver`, `mariadb`, `mongodb` and `cockroachdb`.

- `startStudio`: boolean (default: false)
  - If set to `true`, the package will automatically start Prisma Studio when you run `next dev` in development mode.
