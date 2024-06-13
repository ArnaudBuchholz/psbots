# TODO

## Exceptions

Exception handling must be done in custom `try`/`catch` blocks and triggers manual unstacking.

- 🗹 Rename Error to Exception
- ☐ An exception should be maintained in the engine state to keep track of memory. This last exception should be cleared before reusing the engine (`reset`?)
