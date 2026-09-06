# QueLess MySQL Setup

1. Install and start MySQL.
2. Create the database structure:

```bash
mysql -u root -p < database/schema.sql
```

3. Add demo data:

```bash
mysql -u root -p < database/seed.sql
```

Demo passwords in `seed.sql` use the value `password123`.

The schema demonstrates primary keys, foreign keys, constraints, one-to-many relationships, useful indexes, aggregate views, joins, and a trigger that records completed service durations.
