# AWS RDS SSL Setup (Required for Drizzle CLI)

When running drizzle-kit commands against AWS RDS, Node must trust the AWS certificate authority.

Run this once per terminal session:

export NODE_EXTRA_CA_CERTS=./rds-global-bundle.pem

To make it permanent on macOS (zsh), run:

echo 'export NODE_EXTRA_CA_CERTS=./rds-global-bundle.pem' >> ~/.zshrc

Then restart the terminal.
