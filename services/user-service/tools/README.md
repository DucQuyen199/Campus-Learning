### Initialize Competition Registrations Table

The `createCompetitionRegistrationsTable.js` script creates the CompetitionRegistrations table if it doesn't exist in the database.

#### Usage

Run the script using NPM:

```bash
npm run create-comp-reg-table
```

#### What it does

1. Connects to the database
2. Defines the CompetitionRegistrations table structure
3. Creates the table if it doesn't exist
4. Does not modify the table if it already exists

#### When to use

- When setting up a new environment
- If you get 404 errors when checking competition registration status
- If you have issues with competition registration 