ALTER TABLE accounts
    ADD COLUMN balance DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE accounts
SET balance = balance_cents / 100.0;

ALTER TABLE accounts
    DROP COLUMN balance_cents;

ALTER TABLE invoices
    ADD COLUMN amount DECIMAL(10, 2);

UPDATE invoices
SET amount = amount_cents / 100.0;

ALTER TABLE invoices
    ALTER COLUMN amount SET NOT NULL;

ALTER TABLE invoices
    DROP COLUMN amount_cents;
