ALTER TABLE accounts
    ADD COLUMN balance_cents BIGINT NOT NULL DEFAULT 0;

UPDATE accounts
SET balance_cents = ROUND(balance * 100);

ALTER TABLE accounts
    DROP COLUMN balance;

ALTER TABLE invoices
    ADD COLUMN amount_cents BIGINT;

UPDATE invoices
SET amount_cents = ROUND(amount * 100);

ALTER TABLE invoices
    ALTER COLUMN amount_cents SET NOT NULL;

ALTER TABLE invoices
    DROP COLUMN amount;
