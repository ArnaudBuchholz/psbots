# Operator Abstraction

This project is all about experimentation with different languages (TypeScript, WebAssembly...). However, operators have a logic that needs to be implemented whatever the final language and this implementation must be validated.

It has been decided to abstract the oprator logic using JavaScript syntax so that :
- We remove the types constraint : it can be deduced from the operator definition
- 