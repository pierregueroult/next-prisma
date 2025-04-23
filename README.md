# Next Prisma

![NPM Version](https://img.shields.io/npm/v/%40pglabs%2Fnext-prisma)
![NPM Downloads](https://img.shields.io/npm/d18m/%40pglabs%2Fnext-prisma)
![NPM Collaborators](https://img.shields.io/npm/collaborators/%40pglabs%2Fnext-prisma)
![NPM Last Update](https://img.shields.io/npm/last-update/%40pglabs%2Fnext-prisma)

Loving both [Prisma](https://www.prisma.io/) and [Next.js](https://nextjs.org/) but struggling to make them work together? This package is for you!

(is now supposed to work for both webpack and turbopack)

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


## Contributing

If you want to contribute to the project, feel free to open an issue or a pull request. We welcome any contributions, whether it's bug fixes, new features, or improvements to the documentation.

Read the [contributing guide](./CONTRIBUTING.md) and [code of conduct](./CODE_OF_CONDUCT.md) for more information.

```bash
git clone https://github.com/pglabs/next-prisma.git
cd next-prisma
pnpm install
```
Make sure to use `pnpm` to install the dependencies or at least make sure to have it installed globally since some tests require it ( most of them actually, especially the one under the directory `e2e`, that init several next.js projects and test the package usecase scenarios).

Here are the available scripts:
- `pnpm build`: Build the package in `dist` folder
- `pnpm test`: Run all unit tests (under the directory `tests`)
- `pnpm e2e`: Run all e2e tests (under the directory `e2e`)
- `pnpm lint`: Run the linter
- `pnpm format`: Format the code with Prettier
- `pnpm release`: Release a new version of the package (that's my job there)

To test the project during your development project feel free to duplicate the `e2e/fixture/starter` folder and run the following command:

```bash
pnpm dev
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more information.
